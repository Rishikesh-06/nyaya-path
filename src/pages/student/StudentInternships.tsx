import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';

const StudentInternships = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchInternships();
  }, [user]);

  const fetchInternships = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from('mentorship_applications')
      .select('*, lawyer:users!mentorship_applications_lawyer_id_fkey(id, full_name, specialization, city, phone, email)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Fetch internships error:', error);
    setInternships(data || []);
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    pending: '#f97316',
    accepted: '#0a9e6e',
    rejected: '#ef4444',
    completed: '#6b7280',
  };

  const statusLabels: Record<string, string> = {
    pending: '⏳ Pending',
    accepted: '✓ Accepted',
    rejected: '✗ Declined',
    completed: '✓ Completed',
  };

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">My Internships</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : internships.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-sm font-body text-muted-foreground">No internships yet. Find mentors to apply.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {internships.map((intern, i) => (
            <ScrollReveal key={intern.id} delay={i * 0.08}>
              <TiltCard className="glass-card p-5 rounded-xl" maxTilt={3}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-lg"
                      style={{ background: 'linear-gradient(135deg, #1a3c5e, #c9a227)' }}>
                      {intern.lawyer?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-body font-semibold text-foreground">{intern.lawyer?.full_name}</p>
                      <p className="text-xs font-body text-muted-foreground">
                        {Array.isArray(intern.lawyer?.specialization)
                          ? intern.lawyer.specialization.join(', ')
                          : intern.lawyer?.specialization || 'General Law'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-body font-semibold"
                    style={{ color: statusColors[intern.status], background: `${statusColors[intern.status]}15` }}>
                    {statusLabels[intern.status] || intern.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {intern.lawyer?.city && (
                    <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {intern.lawyer.city}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                    <Clock className="w-3 h-3" /> {new Date(intern.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>

                {/* Your message */}
                {intern.message && (
                  <div className="mb-4 p-3 rounded-lg text-xs font-body text-muted-foreground italic"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    "{intern.message}"
                  </div>
                )}

                {/* Actions for accepted / completed */}
                {(intern.status === 'accepted' || intern.status === 'completed') && (
                  <div className="flex flex-wrap gap-2">
                    {/* Chat with mentor */}
                    <motion.button
                      onClick={() => navigate(`/student/mentorship/chat/${intern.id}`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold"
                      style={{ background: '#1a3c5e', color: '#fff' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    >
                      <MessageCircle className="w-3 h-3" /> Chat with Mentor
                    </motion.button>

                    {/* WhatsApp */}
                    {intern.status !== 'completed' && intern.lawyer?.phone && (
                      <a
                        href={`https://wa.me/91${intern.lawyer.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I am your intern from Nyaya platform!')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold no-underline"
                        style={{ background: '#0a9e6e', color: '#fff' }}
                      >
                        <Phone className="w-3 h-3" /> WhatsApp
                      </a>
                    )}

                    {/* Email */}
                    {intern.status !== 'completed' && intern.lawyer?.email && (
                      <a
                        href={`mailto:${intern.lawyer.email}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold no-underline"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                      >
                        <Mail className="w-3 h-3" /> Email
                      </a>
                    )}
                  </div>
                )}

                {/* Pending info */}
                {intern.status === 'pending' && (
                  <p className="text-xs font-body text-muted-foreground">
                    ⏳ Waiting for lawyer to review your application...
                  </p>
                )}

                {/* Rejected info */}
                {intern.status === 'rejected' && (
                  <p className="text-xs font-body" style={{ color: '#ef4444' }}>
                    This application was not accepted. Try applying to another mentor!
                  </p>
                )}
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentInternships;