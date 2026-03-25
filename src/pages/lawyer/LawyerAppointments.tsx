import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Clock, Calendar, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';

const LawyerAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const startVideoCall = (appointment: any) => {
    supabase.channel(`incoming-call-user-${appointment.victim_id}`).send({
      type: 'broadcast',
      event: 'incoming-call',
      payload: { caseId: appointment.id, lawyerName: user?.full_name }
    });
    navigate(`/video-call/${appointment.id}?role=lawyer&name=${encodeURIComponent(appointment.victim?.full_name || 'Victim')}`);
  };

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*, victim:users!appointments_victim_id_fkey(full_name, city)')
      .eq('lawyer_id', user.id)
      .order('date', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('lawyer-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `lawyer_id=eq.${user.id}` }, () => fetchAppointments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const updateStatus = async (id: string, status: string, victimId: string) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    await supabase.from('notifications').insert({
      user_id: victimId,
      type: 'appointment_update',
      title: `Appointment ${status === 'confirmed' ? 'Confirmed' : 'Cancelled'}`,
      body: `Your appointment has been ${status}.`,
    });
    toast({ title: `Appointment ${status}.` });
    fetchAppointments();
  };

  const statusColors: Record<string, string> = { pending: '#f97316', confirmed: '#0a9e6e', cancelled: '#ef4444', completed: '#6b7280' };

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">Appointments</h2>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
      ) : appointments.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground text-center py-16">No appointments yet.</p>
      ) : (
        <div className="space-y-3">
          {appointments.map((a, i) => (
            <ScrollReveal key={a.id} delay={i * 0.05}>
              <TiltCard className="glass-card p-3 md:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3" maxTilt={3}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: 'rgba(201,162,39,0.1)' }}>
                    <Calendar className="w-4 h-4 text-nyaya-gold" />
                    <span className="text-[10px] font-mono text-nyaya-gold">{new Date(a.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-body font-semibold text-foreground">{a.victim?.full_name}</p>
                    <p className="text-xs font-body text-muted-foreground">{new Date(a.date).toLocaleDateString()} • {a.time_slot}</p>
                    {a.notes && <p className="text-xs font-body text-muted-foreground italic">"{a.notes.slice(0, 60)}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-pill text-xs font-body font-semibold" style={{ color: statusColors[a.status], background: `${statusColors[a.status]}15` }}>{a.status}</span>
                  {a.status === 'confirmed' && (
                    <motion.button onClick={() => startVideoCall(a)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm" style={{ background: '#0a9e6e' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Video className="w-3.5 h-3.5" /> Start Call
                    </motion.button>
                  )}
                  {a.status === 'pending' && (
                    <>
                      <motion.button onClick={() => updateStatus(a.id, 'confirmed', a.victim_id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(10,158,110,0.1)' }} whileHover={{ scale: 1.1 }}>
                        <Check className="w-4 h-4" style={{ color: '#0a9e6e' }} />
                      </motion.button>
                      <motion.button onClick={() => updateStatus(a.id, 'cancelled', a.victim_id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }} whileHover={{ scale: 1.1 }}>
                        <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                      </motion.button>
                    </>
                  )}
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
};

export default LawyerAppointments;
