import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, CheckCircle, Gavel, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ResolveCaseModal from '@/components/ResolveCaseModal';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';

const LawyerCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveCase, setResolveCase] = useState<any>(null);

  const fetchCases = async () => {
    if (!user) return;
    const { data, error } = await (supabase
      .from('cases')
      .select('*, victim:users!cases_victim_id_fkey(full_name, city)') as any)
      .eq('assigned_lawyer_id', user.id)
      .in('status', ['assigned', 'resolved'])
      .order('created_at', { ascending: false });
    if (error) console.error('LawyerCases fetch error:', error);
    setCases(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('lawyer-my-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `assigned_lawyer_id=eq.${user.id}` }, () => fetchCases())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Start video call via Broadcast ───────────────────────────────────────
  const startVideoCall = async (c: any) => {
    if (!user) return;

    // Get lawyer name
    const { data: lawyerProfile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const lawyerName = lawyerProfile?.full_name || 'Your Lawyer';
    const victimName = c.victim?.full_name || 'Victim';
    const victimId = c.victim_id;

    // Send broadcast directly to victim's personal channel
    const notifyChannel = supabase.channel(`incoming-call-user-${victimId}`);

    await new Promise<void>((resolve) => {
      notifyChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await notifyChannel.send({
            type: 'broadcast',
            event: 'incoming-call',
            payload: {
              caseId: c.id,
              lawyerName: lawyerName,
            },
          });
          resolve();
        }
      });
    });

    // Small delay then navigate lawyer to video call
    setTimeout(() => {
      navigate(`/video-call/${c.id}?role=lawyer&name=${encodeURIComponent(victimName)}`);
    }, 500);
  };

  const statusColor: Record<string, string> = { assigned: '#c9a227', resolved: '#0a9e6e', closed: '#6b7280' };

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">My Cases</h2>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
      ) : cases.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground text-center py-16">No cases assigned yet. Check the Case Feed.</p>
      ) : (
        <div className="space-y-4">
          {cases.map((c, i) => (
            <ScrollReveal key={c.id} delay={i * 0.05}>
              <TiltCard className="glass-card p-5 rounded-xl" maxTilt={3}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-body font-medium" style={{ background: 'rgba(255,255,255,0.06)' }}>{c.category}</span>
                    <span className="px-2 py-0.5 rounded-pill text-xs font-body font-semibold" style={{ color: statusColor[c.status] || '#fff', background: `${statusColor[c.status] || '#6b7280'}15` }}>
                      {c.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-body font-semibold text-foreground mb-1">{c.title}</p>
                {c.victim && <p className="text-xs font-body text-muted-foreground mb-3">Client: {c.victim.full_name} • {c.victim.city || ''}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  {c.status === 'assigned' && (
                    <>
                      {/* Chat */}
                      <motion.button
                        onClick={() => navigate(`/lawyer/cases/${c.id}/chat`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-semibold btn-shine"
                        style={{ background: 'hsl(var(--nyaya-navy))', color: '#fff' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <MessageCircle className="w-3 h-3" /> Chat
                      </motion.button>

                      {/* Video Call */}
                      <motion.button
                        onClick={() => startVideoCall(c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-semibold btn-shine"
                        style={{ background: '#c9a227', color: '#0d1f35' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Video className="w-3 h-3" /> Video Call
                      </motion.button>

                      {/* Resolve */}
                      <motion.button
                        onClick={() => setResolveCase(c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-semibold btn-shine"
                        style={{ background: '#0a9e6e', color: '#fff' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Gavel className="w-3 h-3" /> Resolve
                      </motion.button>
                    </>
                  )}
                  {c.status === 'resolved' && (
                    <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#0a9e6e' }}>
                      <CheckCircle className="w-3 h-3" /> {c.outcome}
                    </span>
                  )}
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}

      <AnimatePresence>
        {resolveCase && <ResolveCaseModal caseData={resolveCase} onClose={() => setResolveCase(null)} onResolved={() => { setResolveCase(null); fetchCases(); }} />}
      </AnimatePresence>
    </div>
  );
};

export default LawyerCases;