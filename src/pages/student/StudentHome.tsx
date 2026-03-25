import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import CountUp from '@/components/CountUp';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';

const StudentHome = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [internships, setInternships] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('internships').select('*, lawyer:users!internships_lawyer_id_fkey(full_name, specialization)').eq('student_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setInternships(data || []);
      setCompletedCount((data || []).filter((i: any) => i.status === 'completed').length);
    });
  }, [user]);

  const activeInternship = internships.find(i => i.status === 'active');
  const profileCompletion = [user?.full_name, user?.city, user?.university, user?.year_of_study].filter(Boolean).length * 25;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Welcome banner */}
      <motion.div
        className="p-5 md:p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(13,115,119,0.25) 0%, rgba(201,162,39,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(13,115,119,0.08) 0%, rgba(201,162,39,0.04) 100%)',
          border: `1px solid ${isDark ? 'rgba(13,115,119,0.15)' : 'rgba(13,115,119,0.1)'}`,
          backdropFilter: 'blur(20px)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(13,115,119,0.2), transparent)', filter: 'blur(40px)' }} />
        <h1 className="text-xl md:text-3xl font-display font-bold relative z-10" style={{ color: colors.textHeading }}>
          Welcome, <span style={{ color: '#0d7377' }}>{user?.full_name?.split(' ')[0] || 'Student'}</span> 👋
        </h1>
        <p className="text-sm font-body mt-1 relative z-10" style={{ color: colors.textSecondary }}>
          {user?.university || 'University not set'} • {user?.year_of_study ? `Year ${user.year_of_study}` : 'Year not set'}
        </p>
      </motion.div>

      {/* Profile completion */}
      <ScrollReveal delay={0.1}>
        <TiltCard className="glass-card p-5 rounded-xl" maxTilt={4}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-body font-semibold" style={{ color: colors.textPrimary }}>Profile Completion</p>
            <span className="text-sm font-mono font-bold" style={{ color: '#0d7377' }}><CountUp end={profileCompletion} suffix="%" /></span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(13,115,119,0.1)' : 'rgba(13,115,119,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #0d7377, #14a3a8)' }} initial={{ width: 0 }} animate={{ width: `${profileCompletion}%` }} transition={{ duration: 1 }} />
          </div>
        </TiltCard>
      </ScrollReveal>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScrollReveal delay={0.2}>
          <TiltCard className="glass-card p-5 rounded-xl h-full" maxTilt={4} style={{ borderTop: '3px solid #0d7377' }}>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(13,115,119,0.1)'} strokeWidth="3" />
                  <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0d7377" strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: `${completedCount * 20}, 100` }} transition={{ duration: 1.5 }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm" style={{ color: colors.textPrimary }}><CountUp end={completedCount * 20} suffix="%" /></span>
              </div>
              <div>
                <p className="text-sm font-body font-semibold" style={{ color: colors.textPrimary }}>Portfolio Strength</p>
                <p className="text-xs font-body" style={{ color: colors.textMuted }}>{completedCount} internship{completedCount !== 1 ? 's' : ''} completed</p>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <TiltCard className="glass-card p-5 rounded-xl h-full" maxTilt={4} style={{ borderTop: `3px solid ${colors.gold}` }}>
            <p className="text-xs font-body font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textMuted }}>Current Internship</p>
            {activeInternship ? (
              <>
                <p className="text-sm font-body font-semibold" style={{ color: colors.textPrimary }}>Under {activeInternship.lawyer?.full_name || 'Lawyer'}</p>
                <p className="text-xs font-body" style={{ color: colors.textSecondary }}>{activeInternship.lawyer?.specialization?.join(', ') || 'General'}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-body font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: colors.success, border: '1px solid rgba(16,185,129,0.2)' }}>
                  {activeInternship.status}
                </span>
              </>
            ) : (
              <p className="text-sm font-body" style={{ color: colors.textMuted }}>No active internship. Find a mentor to get started.</p>
            )}
          </TiltCard>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default StudentHome;
