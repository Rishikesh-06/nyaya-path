import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useResponsive } from '@/hooks/useResponsive';

const BADGE_DEFINITIONS = [
  { key: 'first_internship', icon: '⚖️', title: 'First Internship', description: 'Completed your first internship on Nyaya', color: '#c9a227', bgColor: 'rgba(201,162,39,0.15)', borderColor: '#c9a227' },
  { key: 'second_internship', icon: '🏛️', title: 'Rising Counsel', description: 'Completed 2 internships', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.15)', borderColor: '#60a5fa' },
  { key: 'five_internships', icon: '👨‍⚖️', title: 'Legal Eagle', description: 'Completed 5 internships', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.15)', borderColor: '#a78bfa' },
  { key: 'portfolio_downloaded', icon: '📄', title: 'Portfolio Pro', description: 'Downloaded your verified portfolio', color: '#34d399', bgColor: 'rgba(52,211,153,0.15)', borderColor: '#34d399' },
  { key: 'profile_complete', icon: '✅', title: 'Profile Complete', description: 'Filled all profile details', color: '#f472b6', bgColor: 'rgba(244,114,182,0.15)', borderColor: '#f472b6' },
  { key: 'mentorship_accepted', icon: '🤝', title: 'Mentorship Star', description: 'Got accepted by a senior lawyer mentor', color: '#fb923c', bgColor: 'rgba(251,146,60,0.15)', borderColor: '#fb923c' },
  { key: 'nyaya_pioneer', icon: '🌟', title: 'Nyaya Pioneer', description: 'One of the first users on Nyaya platform', color: '#e2c97e', bgColor: 'rgba(226,201,126,0.15)', borderColor: '#e2c97e' },
];

const MyBadges = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.id) loadAndAwardBadges(); }, [user?.id]);

  const loadAndAwardBadges = async () => {
    if (!user?.id) return;
    setLoading(true);
    await autoAwardBadges();
    const { data } = await supabase.from('user_badges').select('badge_key').eq('user_id', user.id);
    if (data) setEarnedBadges(data.map((b: any) => b.badge_key));
    setLoading(false);
  };

  const autoAwardBadges = async () => {
    if (!user?.id) return;
    const badgesToAward: string[] = [];
    const { data: internships } = await supabase.from('mentorship_applications').select('id').eq('intern_id', user.id).eq('status', 'accepted');
    const internCount = internships?.length || 0;
    if (internCount >= 1) badgesToAward.push('first_internship');
    if (internCount >= 2) badgesToAward.push('second_internship');
    if (internCount >= 5) badgesToAward.push('five_internships');
    if (internCount >= 1) badgesToAward.push('mentorship_accepted');
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (profile?.full_name && profile?.phone && profile?.city && profile?.age) badgesToAward.push('profile_complete');
    badgesToAward.push('nyaya_pioneer');
    if (badgesToAward.length > 0) {
      const inserts = badgesToAward.map(key => ({ user_id: user.id, badge_key: key }));
      await supabase.from('user_badges').upsert(inserts, { onConflict: 'user_id,badge_key', ignoreDuplicates: true } as any);
    }
  };

  const earned = BADGE_DEFINITIONS.filter(b => earnedBadges.includes(b.key));
  const notEarned = BADGE_DEFINITIONS.filter(b => !earnedBadges.includes(b.key));

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: '60vh' }}>
      <p style={{ color: colors.textMuted }}>Loading badges...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-xl md:text-[28px] font-bold mb-2 font-display" style={{ color: colors.textHeading }}>My Badges</h1>
        <p style={{ color: colors.textSecondary, margin: 0, fontSize: '14px' }}>
          {earned.length} of {BADGE_DEFINITIONS.length} badges earned
        </p>
        <div style={{ marginTop: '12px', background: colors.cardBg, borderRadius: '9999px', height: '8px', width: isMobile ? '100%' : '300px', border: `1px solid ${colors.border}` }}>
          <div style={{ width: `${(earned.length / BADGE_DEFINITIONS.length) * 100}%`, background: 'linear-gradient(90deg, #c9a227, #e2c97e)', height: '8px', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {earned.length > 0 && (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: colors.textSecondary, letterSpacing: '1px', marginBottom: '16px' }}>EARNED</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {earned.map((badge, i) => (
              <motion.div key={badge.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ background: badge.bgColor, border: `1px solid ${badge.borderColor}`, borderRadius: '16px', padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                <div style={{ fontSize: isMobile ? '32px' : '40px', lineHeight: 1 }}>{badge.icon}</div>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: badge.color, fontSize: isMobile ? '12px' : '14px' }}>{badge.title}</p>
                  <p style={{ margin: 0, fontSize: isMobile ? '10px' : '12px', color: colors.textSecondary, lineHeight: '1.4' }}>{badge.description}</p>
                </div>
                <span style={{ fontSize: '11px', color: badge.color, background: `${badge.color}20`, padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>✓ Earned</span>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {notEarned.length > 0 && (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: colors.textSecondary, letterSpacing: '1px', marginBottom: '16px' }}>LOCKED</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {notEarned.map(badge => (
              <div key={badge.key} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', opacity: 0.5, filter: 'grayscale(1)' }}>
                <div style={{ fontSize: isMobile ? '32px' : '40px', lineHeight: 1 }}>{badge.icon}</div>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: colors.textSecondary, fontSize: isMobile ? '12px' : '14px' }}>{badge.title}</p>
                  <p style={{ margin: 0, fontSize: isMobile ? '10px' : '12px', color: colors.textMuted, lineHeight: '1.4' }}>{badge.description}</p>
                </div>
                <span style={{ fontSize: '11px', color: colors.textMuted, background: colors.cardBg, padding: '3px 10px', borderRadius: '9999px' }}>🔒 Locked</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyBadges;
