import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import RatingModal from '@/components/RatingModal';
import ScrollReveal from '@/components/ScrollReveal';

const VictimAppointments = () => {
  const { user } = useAuth();
  const { ts } = useLanguage();
  const ap = ts('appointments');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingCase, setRatingCase] = useState<any>(null);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*, lawyer:users!appointments_lawyer_id_fkey(full_name, specialization, city)')
      .eq('victim_id', user.id)
      .order('date', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('victim-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `victim_id=eq.${user.id}` }, () => fetchAppointments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const statusColors: Record<string, string> = { pending: '#f97316', confirmed: '#0a9e6e', cancelled: '#ef4444', completed: '#6b7280' };
  const statusLabel: Record<string, string> = { pending: ap.pending, confirmed: ap.confirmed, cancelled: ap.cancelled, completed: ap.completed };

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold mb-6" style={{ color: '#1a3c5e' }}>{ap.my_appointments_title}</h2>
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(26,60,94,0.06)' }} />)}</div>
      ) : appointments.length === 0 ? (
        <p className="text-sm font-body text-center py-16" style={{ color: '#6b7280' }}>{ap.no_appointments_sub}</p>
      ) : (
        <div className="space-y-3">
          {appointments.map((a, i) => (
            <ScrollReveal key={a.id} delay={i * 0.05}>
              <div className="p-3 md:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(26,60,94,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: 'rgba(26,60,94,0.04)' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#1a3c5e' }} />
                    <span className="text-[10px] font-mono" style={{ color: '#1a3c5e' }}>{new Date(a.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-body font-semibold" style={{ color: '#1a3c5e' }}>{a.lawyer?.full_name}</p>
                    <p className="text-xs font-body" style={{ color: '#6b7280' }}>{new Date(a.date).toLocaleDateString()} • {a.time_slot}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-pill text-xs font-body font-semibold" style={{ color: statusColors[a.status], background: `${statusColors[a.status]}15` }}>{statusLabel[a.status] || a.status}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}

      <AnimatePresence>
        {ratingCase && <RatingModal caseData={ratingCase} onClose={() => setRatingCase(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default VictimAppointments;
