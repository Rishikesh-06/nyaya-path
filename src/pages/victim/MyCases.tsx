import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import AnonymousCasePosting from '@/components/AnonymousCasePosting';
import RatingModal from '@/components/RatingModal';
import { integrityService } from '@/services/integrityService';

const MyCases = () => {
  const { user } = useAuth();
  const { ts, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const c = ts('cases');
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostFlow, setShowPostFlow] = useState(false);
  const [ratingCase, setRatingCase] = useState<any>(null);
  const [ratedCaseIds, setRatedCaseIds] = useState<Set<string>>(new Set());

  const fetchCases = async () => {
    if (!user) return;
    const { data, error } = await (supabase
      .from('cases')
      .select('*, assigned_lawyer:users!cases_assigned_lawyer_id_fkey(full_name, city, specialization)') as any)
      .eq('victim_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('VictimCases fetch error:', error);
    
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

  // Fetch which cases the user has already rated
  const fetchRatedCases = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('case_ratings')
      .select('case_id')
      .eq('victim_id', user.id);
    if (data) {
      setRatedCaseIds(new Set(data.map((r: any) => r.case_id)));
    }
  };

  useEffect(() => {
    fetchCases();
    fetchRatedCases();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('victim-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `victim_id=eq.${user.id}` }, () => fetchCases())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const deleteCase = async (caseId: string, caseStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (caseStatus !== 'open') {
      toast({
        title: language === 'Telugu' ? 'తొలగించలేరు' : language === 'Hindi' ? 'हटा नहीं सकते' : 'Cannot delete',
        description: language === 'Telugu' ? 'న్యాయవాది అంగీకరించిన కేసును తొలగించలేరు' : language === 'Hindi' ? 'वकील द्वारा स्वीकृत मामला नहीं हटा सकते' : 'Cannot delete a case already accepted by a lawyer',
        variant: 'destructive',
      });
      return;
    }
    const confirmMsg = language === 'Telugu' ? 'ఈ కేసును తొలగించాలా?' : language === 'Hindi' ? 'क्या इस मामले को हटाएं?' : 'Delete this case?';
    if (!window.confirm(confirmMsg)) return;
    const { error } = await supabase.from('cases').delete().eq('id', caseId).eq('victim_id', user!.id);
    if (!error) {
      setCases(prev => prev.filter(c => c.id !== caseId));
      toast({ title: language === 'Telugu' ? 'కేసు తొలగించబడింది' : language === 'Hindi' ? 'मामला हटाया गया' : 'Case deleted' });
    }
  };

  if (showPostFlow) {
    return <AnonymousCasePosting onClose={() => { setShowPostFlow(false); fetchCases(); }} />;
  }

  const statusColor: Record<string, string> = { open: '#f97316', assigned: '#1a3c5e', resolved: '#0a9e6e', closed: '#6b7280' };
  const statusLabel: Record<string, string> = { open: c.status_open, assigned: c.status_assigned, resolved: c.status_resolved, closed: c.status_closed };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold" style={{ color: '#1a3c5e' }}>{c.my_cases_title}</h2>
        <motion.button onClick={() => setShowPostFlow(true)} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-body font-semibold btn-shine" style={{ background: '#c9a227', color: '#0d1f35' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Plus className="w-4 h-4" /> {c.post_new_case}
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(26,60,94,0.06)' }} />)}</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm font-body" style={{ color: '#6b7280' }}>{c.no_cases_yet}</p>
          <motion.button onClick={() => setShowPostFlow(true)} className="mt-4 px-6 py-3 rounded-[10px] text-sm font-body font-semibold" style={{ background: '#1a3c5e', color: '#fff' }} whileHover={{ scale: 1.02 }}>
            {c.post_case_btn}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map(cs => {
            const alreadyRated = ratedCaseIds.has(cs.id);
            return (
              <motion.div key={cs.id} className="p-4 md:p-5 rounded-xl relative" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(26,60,94,0.06)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <button
                  onClick={(e) => deleteCase(cs.id, cs.status, e)}
                  className="absolute top-3 right-3 flex items-center gap-1 rounded-lg text-sm cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 10px', color: '#ef4444' }}
                >
                  🗑
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-body font-medium" style={{ background: 'rgba(26,60,94,0.06)', color: '#1a3c5e' }}>{cs.category}</span>
                    <span className="px-2 py-0.5 rounded-pill text-xs font-body font-semibold" style={{ color: statusColor[cs.status] || '#6b7280', background: `${statusColor[cs.status] || '#6b7280'}15` }}>
                      {statusLabel[cs.status] || cs.status}
                    </span>
                    {cs.integrity && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-pill text-xs font-body font-semibold flex items-center gap-1 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/proof/${cs.id}`);
                              }}
                              style={{
                                background: cs.integrity.status === 'valid' ? 'rgba(10,158,110,0.1)' : cs.integrity.status === 'tampered' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                                color: cs.integrity.status === 'valid' ? '#0a9e6e' : cs.integrity.status === 'tampered' ? '#ef4444' : '#f97316'
                              }}>
                          {cs.integrity.status === 'valid' ? '🔒 Blockchain Secured' : cs.integrity.status === 'tampered' ? '⚠️ Tampering Detected' : '⏳ Pending Sync'}
                        </span>
                        {cs.integrity.status === 'valid' && (
                          <span className="text-[10px] text-muted-foreground underline cursor-pointer hover:text-primary transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/proof/${cs.id}`);
                                }}>
                            View Proof
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-mono" style={{ color: '#6b7280' }}>{new Date(cs.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-body font-semibold mb-1" style={{ color: '#1a3c5e' }}>{cs.title}</p>
                {cs.ai_summary && <p className="text-xs font-body mb-3" style={{ color: '#6b7280' }}>{(cs.ai_summary || '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').slice(0, 120)}...</p>}
                {cs.assigned_lawyer && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.1)' }}>
                      <span className="text-xs font-bold text-nyaya-gold">{cs.assigned_lawyer.full_name?.[0]}</span>
                    </div>
                    <span className="text-xs font-body" style={{ color: '#4b5563' }}>{cs.assigned_lawyer.full_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {cs.status === 'assigned' && (
                    <motion.button onClick={() => navigate(`/dashboard/cases/${cs.id}/chat`)} className="flex items-center gap-1 text-xs font-body font-medium text-nyaya-gold" whileHover={{ x: 2 }}>
                      <MessageCircle className="w-3 h-3" /> {c.chat_lawyer}
                    </motion.button>
                  )}
                  {cs.status === 'resolved' && !alreadyRated && cs.assigned_lawyer_id && (
                    <motion.button
                      onClick={() => setRatingCase(cs)}
                      className="flex items-center gap-1 text-xs font-body font-medium"
                      style={{ color: '#c9a227' }}
                      whileHover={{ x: 2 }}
                    >
                      <Star className="w-3 h-3" /> {c.rate_lawyer}
                    </motion.button>
                  )}
                  {cs.status === 'resolved' && alreadyRated && (
                    <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#0a9e6e' }}>
                      ✅ {language === 'Telugu' ? 'రేటింగ్ ఇవ్వబడింది' : language === 'Hindi' ? 'रेटिंग दी गई' : 'Rated'}
                    </span>
                  )}
                  {cs.status === 'resolved' && cs.outcome && (
                    <span className="text-xs font-body ml-2" style={{ color: '#0a9e6e' }}>{c.outcome_label}: {cs.outcome}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {ratingCase && (
          <RatingModal
            caseData={ratingCase}
            onClose={() => {
              setRatingCase(null);
              fetchCases();
              fetchRatedCases(); // Refresh rated cases after submitting
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyCases;