import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';
import { integrityService } from '@/services/integrityService';
import { updateCaseWithAudit } from '@/services/caseAuditService';

const categoryColors: Record<string, string> = {
  'Tenant Rights': 'hsl(210, 56%, 24%)', 'Labor Law': 'hsl(160, 87%, 33%)', 'Domestic Violence': 'hsl(0, 84%, 60%)', 'Education': 'hsl(25, 95%, 53%)', 'Criminal': 'hsl(270, 80%, 60%)', 'Consumer Rights': 'hsl(43, 72%, 47%)', 'Property': 'hsl(179, 80%, 25%)',
};

const cleanSummary = (s: string) => s ? s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim() : 'No summary available';

// ─── Direct Supabase score update (replaces Edge Function) ───────────────────
const updateLawyerScore = async (lawyerId: string, eventType: string, extra?: any) => {
  try {
    // Get current scores
    const { data: existing } = await supabase
      .from('lawyer_scores')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .single();

    const current = existing || {
      lawyer_id: lawyerId,
      total_score: 0,
      cases_won: 0,
      cases_resolved: 0,
      anonymous_cases_count: 0,
      avg_rating: 0,
      mentor_sessions: 0,
    };

    let updates: any = { updated_at: new Date().toISOString() };

    switch (eventType) {
      case 'case_accepted':
        updates.total_score = (current.total_score || 0) + 10;
        break;
      case 'case_won':
        updates.total_score = (current.total_score || 0) + 50;
        updates.cases_won = (current.cases_won || 0) + 1;
        updates.cases_resolved = (current.cases_resolved || 0) + 1;
        break;
      case 'resolved_fast':
        updates.total_score = (current.total_score || 0) + 20;
        updates.cases_resolved = (current.cases_resolved || 0) + 1;
        break;
      case 'pro_bono':
        updates.total_score = (current.total_score || 0) + 30;
        updates.anonymous_cases_count = (current.anonymous_cases_count || 0) + 1;
        break;
      case 'rating_received':
        const newRating = extra?.ratingValue || 5;
        const totalRatings = (current.cases_resolved || 1);
        updates.avg_rating = ((current.avg_rating || 0) * (totalRatings - 1) + newRating) / totalRatings;
        updates.total_score = (current.total_score || 0) + Math.round(newRating * 5);
        break;
      default:
        break;
    }

    if (existing) {
      await supabase.from('lawyer_scores').update(updates).eq('lawyer_id', lawyerId);
    } else {
      await supabase.from('lawyer_scores').insert({ ...current, ...updates });
    }
  } catch (err) {
    console.warn('Score update failed (non-critical):', err);
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const CaseFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Cases');
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchCases = async () => {
    let query = supabase
      .from('cases')
      .select('*')
      .eq('status', 'open')
      .is('assigned_lawyer_id', null)
      .order('created_at', { ascending: false })
      .limit(20);
    if (filter !== 'All Cases') query = query.eq('category', filter);
    const { data } = await query;
    if (data) {
      const verifiedData = await Promise.all(data.map(async (c: any) => {
        if (!localStorage.getItem(`case_snapshot_${c.id}`)) {
          localStorage.setItem(`case_snapshot_${c.id}`, JSON.stringify(c));
        }
        const integrity = await integrityService.verifyCase(c);
        return { ...c, integrity };
      }));
      setCases(verifiedData);
    } else {
      setCases([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, [filter]);

  useEffect(() => {
    const channel = supabase
      .channel('case-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cases', filter: 'status=eq.open' }, (payload) => {
        setCases(prev => [payload.new as any, ...prev]);
        toast({ title: `New case posted — ${(payload.new as any).category}` });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cases' }, (payload) => {
        const updated = payload.new as any;
        if (updated.status !== 'open' || updated.assigned_lawyer_id) {
          setCases(prev => prev.filter(c => c.id !== updated.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const acceptCase = async (caseId: string) => {
    if (!user || accepting) return;
    setAccepting(caseId);
    try {
      const { data: checkCase } = await supabase.from('cases').select('*').eq('id', caseId).eq('status', 'open').is('assigned_lawyer_id', null).single();
      if (!checkCase) throw new Error("Case unavailable");

      const { data: updatedCase, error } = await updateCaseWithAudit(caseId, { 
        status: 'assigned', 
        assigned_lawyer_id: user.id 
      });

      if (error || !updatedCase) {
        toast({ title: 'Case no longer available', description: 'This case was just accepted by another lawyer.', variant: 'destructive' });
        setCases(prev => prev.filter(c => c.id !== caseId));
        return;
      }

      setCases(prev => prev.filter(c => c.id !== caseId));

      const { data: lawyerProfile } = await supabase.from('users').select('full_name').eq('id', user.id).single();
      const lawyerName = lawyerProfile?.full_name || 'Your lawyer';

      await supabase.from('notifications').insert({
        user_id: (updatedCase as any).victim_id,
        type: 'case_accepted',
        title: 'A lawyer accepted your case',
        body: `${lawyerName} has accepted your case and wants to help you.`,
      });

      // ✅ Direct score update instead of Edge Function
      await updateLawyerScore(user.id, 'case_accepted');

      toast({ title: '✅ Case accepted!', description: 'Check My Cases to chat with the victim.' });
    } catch (err: any) {
      toast({ title: 'Failed to accept case', description: err.message, variant: 'destructive' });
    } finally {
      setAccepting(null);
    }
  };

  const filters = ['All Cases', 'Tenant Rights', 'Criminal', 'Domestic Violence', 'Labor Law', 'Property', 'Consumer Rights'];

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Case Feed</h2>
      <p className="text-sm font-body text-muted-foreground mb-6">Open cases from verified victims seeking legal help.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-pill text-xs font-body nyaya-transition ${f === filter ? 'bg-primary text-primary-foreground font-semibold' : ''}`} style={f !== filter ? { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'hsl(var(--muted-foreground))' } : {}}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm font-body text-muted-foreground">No open cases at the moment. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c, i) => (
            <ScrollReveal key={c.id} delay={i * 0.05}>
              <TiltCard className="glass-card rounded-2xl overflow-hidden" maxTilt={4}>
                <div className="flex">
                  <div className="w-1.5 flex-shrink-0" style={{ background: `linear-gradient(180deg, ${categoryColors[c.category] || 'hsl(210, 56%, 24%)'}, transparent)` }} />
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-pill text-xs font-body font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: categoryColors[c.category] || '#fff' }}>{c.category}</span>
                      <span className="text-xs font-body text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      {c.fir_verified && <span className="px-2 py-0.5 rounded-pill text-xs font-body" style={{ background: 'rgba(10,158,110,0.1)', color: '#0a9e6e' }}>FIR Verified</span>}
                      {c.integrity && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-pill text-xs font-body font-semibold flex items-center gap-1 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/proof/${c.id}`);
                                }}
                                style={{
                                  background: c.integrity.status === 'valid' ? 'rgba(10,158,110,0.1)' : c.integrity.status === 'tampered' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                                  color: c.integrity.status === 'valid' ? '#0a9e6e' : c.integrity.status === 'tampered' ? '#ef4444' : '#f97316'
                                }}>
                            {c.integrity.status === 'valid' ? '🔒 Blockchain Secured' : c.integrity.status === 'tampered' ? '⚠️ Tampering Detected' : '⏳ Pending Sync'}
                          </span>
                          {c.integrity.status === 'valid' && (
                            <span className="text-[10px] text-muted-foreground underline cursor-pointer hover:text-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/proof/${c.id}`);
                                  }}>
                              View Proof
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-body text-muted-foreground mb-3">{cleanSummary(c.ai_summary || c.description || 'No description provided.')}</p>

                    {c.evidence_gaps?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {c.evidence_gaps.map((m: string) => (
                          <span key={m} className="px-2 py-0.5 rounded text-xs font-body" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>⚠ {m}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {c.case_strength > 0 && (
                          <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                              <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={c.case_strength >= 70 ? '#0a9e6e' : '#f97316'} strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: `${c.case_strength}, 100` }} transition={{ duration: 1.5 }} />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-foreground">{c.case_strength}%</span>
                          </div>
                        )}
                      </div>
                      <motion.button
                        onClick={() => acceptCase(c.id)}
                        disabled={accepting === c.id}
                        className="px-4 py-2 rounded-lg text-xs font-body font-semibold btn-shine"
                        style={{ background: accepting === c.id ? '#6b7280' : 'hsl(var(--nyaya-navy))', color: '#fff', opacity: accepting === c.id ? 0.7 : 1, cursor: accepting === c.id ? 'not-allowed' : 'pointer' }}
                        whileHover={{ scale: accepting === c.id ? 1 : 1.02 }}
                        whileTap={{ scale: accepting === c.id ? 1 : 0.98 }}
                      >
                        {accepting === c.id ? 'Accepting...' : 'Accept Case'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseFeed;