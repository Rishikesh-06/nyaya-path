import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import CountUp from '@/components/CountUp';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';
import TrophySVG from '@/components/2d/TrophySVG';
import { useNavigate } from 'react-router-dom';
import { Newspaper } from 'lucide-react';

const LawyerHome = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [scores, setScores] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [monthlyHero, setMonthlyHero] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    supabase.from('lawyer_scores').select('*').eq('lawyer_id', user.id).single()
      .then(({ data }) => setScores(data));

    supabase.from('cases').select('*').eq('assigned_lawyer_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setRecentCases(data || []));

    const now = new Date();
    supabase.from('monthly_heroes').select('*')
      .eq('lawyer_id', user.id)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
      .then(({ data }) => { if (data && data.length > 0) setMonthlyHero(data[0]); });

    // Realtime score updates
    const channel = supabase.channel('lawyer-scores-home')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'lawyer_scores',
        filter: `lawyer_id=eq.${user.id}`
      }, (payload) => {
        setScores(payload.new);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const stats = [
    { label: 'Total Points', value: scores?.total_score || 0, color: colors.gold },
    { label: 'Cases Won', value: scores?.cases_won || 0, color: colors.success },
    { label: 'Avg Rating', value: scores?.avg_rating ? parseFloat(scores.avg_rating).toFixed(1) : '0.0', color: '#f97316', isString: true },
    { label: 'Cases Resolved', value: scores?.cases_resolved || 0, color: colors.info },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Welcome banner */}
      <motion.div
        className="p-5 md:p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(26,60,94,0.4) 0%, rgba(201,162,39,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(26,60,94,0.08) 0%, rgba(201,162,39,0.05) 100%)',
          border: `1px solid ${isDark ? 'rgba(201,162,39,0.12)' : 'rgba(26,60,94,0.1)'}`,
          backdropFilter: 'blur(20px)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${colors.goldGlow}, transparent)`, filter: 'blur(40px)' }} />
        <h1 className="text-xl md:text-3xl font-display font-bold relative z-10" style={{ color: colors.textHeading }}>
          Welcome back, <span className="gold-shimmer">{user?.full_name || 'Advocate'}</span>.
        </h1>
        <p className="text-sm font-body mt-2 relative z-10" style={{ color: colors.textSecondary }}>
          {scores
            ? <>{scores.total_score || 0} points • {scores.cases_won || 0} cases won • {scores.avg_rating ? parseFloat(scores.avg_rating).toFixed(1) : '0.0'}★ avg rating</>
            : 'Loading your stats...'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={0.1 + i * 0.08}>
            <TiltCard className="glass-card p-5 rounded-xl" maxTilt={5} style={{ borderTop: `3px solid ${s.color}` }}>
              <p className="text-xs font-body uppercase tracking-wider font-semibold mb-2" style={{ color: colors.textMuted }}>{s.label}</p>
              <p className="text-2xl md:text-3xl font-display font-bold" style={{ color: s.color }}>
                {s.isString
                  ? <>{s.value}★</>
                  : <CountUp end={s.value as number} decimals={0} />
                }
              </p>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>

      {/* Monthly Hero */}
      {monthlyHero && (
        <motion.div className="rounded-2xl relative overflow-hidden gold-border-glow" style={{ background: isDark ? 'linear-gradient(135deg, #1a0f00 0%, #0d0800 100%)' : 'linear-gradient(135deg, #fef8e7 0%, #fdf2d0 100%)', boxShadow: colors.shadowGold }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <div className="p-5 md:p-8 relative z-10 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
            <TrophySVG className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] flex-shrink-0" isMonthlyHero={true} />
            <div className="flex-1">
              <p className="text-xs font-body font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: colors.textMuted }}>MONTHLY HERO</p>
              <p className="text-2xl sm:text-3xl md:text-[44px] font-display font-bold gold-shimmer leading-tight">{monthlyHero.category}</p>
              <p className="text-sm font-body mt-2" style={{ color: colors.textSecondary }}>{monthlyHero.key_stat}</p>
            </div>
          </div>
        </motion.div>
      )}
      {/* Law Updates Card */}
      <motion.div
        onClick={() => navigate('/lawyer/updates')}
        className="p-5 rounded-2xl cursor-pointer group"
        style={{
          background: isDark ? 'rgba(201,162,39,0.06)' : 'rgba(201,162,39,0.04)',
          border: `1px solid rgba(201,162,39,0.2)`,
        }}
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(201,162,39,0.12)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.15)' }}>
              <Newspaper className="w-5 h-5" style={{ color: '#c9a227' }} />
            </div>
            <div>
              <p className="font-display font-semibold text-sm" style={{ color: colors.textPrimary }}>Law Updates</p>
              <p className="text-xs font-body" style={{ color: colors.textMuted }}>Supreme Court • Amendments • Judgments • Live</p>
            </div>
          </div>
          <span className="text-xs font-body font-semibold px-3 py-1 rounded-full group-hover:bg-nyaya-gold group-hover:text-white transition-all"
            style={{ background: 'rgba(201,162,39,0.1)', color: '#c9a227' }}>
            View →
          </span>
        </div>
      </motion.div>
      {/* Recent Cases */}
      <div>
        <h3 className="font-display font-semibold text-xl mb-4" style={{ color: colors.textHeading }}>Recent Cases</h3>
        {recentCases.length === 0 ? (
          <p className="text-sm font-body" style={{ color: colors.textMuted }}>No cases yet. Check the Case Feed for open cases.</p>
        ) : (
          <div className="space-y-3">
            {recentCases.map((c, i) => (
              <ScrollReveal key={c.id} delay={0.1 * i}>
                <TiltCard className="glass-card p-4 rounded-xl flex items-center justify-between" maxTilt={4}>
                  <div>
                    <p className="font-body font-semibold text-sm" style={{ color: colors.textPrimary }}>{c.title}</p>
                    <p className="text-xs font-body" style={{ color: colors.textMuted }}>{c.category} • {c.status}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-body font-semibold" style={{
                    background: c.status === 'resolved' ? 'rgba(16,185,129,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.06)'),
                    color: c.status === 'resolved' ? colors.success : colors.textSecondary,
                    border: `1px solid ${c.status === 'resolved' ? 'rgba(16,185,129,0.2)' : colors.border}`,
                  }}>
                    {c.status}
                  </span>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LawyerHome;