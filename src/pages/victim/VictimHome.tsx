import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, FileText, Search, Clock, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';

const VictimHome = () => {
  const { user } = useAuth();
  const { ts } = useLanguage();
  const { colors, isDark } = useTheme();
  const navigate = useNavigate();
  const home = ts('victim_home');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? home.greeting_morning : hour < 17 ? home.greeting_afternoon : home.greeting_evening;

  const [stats, setStats] = useState({ activeCases: 0, documents: 0, deadlines: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count: caseCount } = await supabase.from('cases').select('*', { count: 'exact', head: true }).eq('victim_id', user.id).in('status', ['open', 'assigned']);
      const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('uploader_id', user.id);
      setStats({ activeCases: caseCount || 0, documents: docCount || 0, deadlines: 0 });
    };
    load();
  }, [user]);

  const quickActions = [
    { icon: Upload, label: home.upload_doc, path: '/dashboard/upload', color: colors.navy, bg: isDark ? 'rgba(26,60,94,0.15)' : 'rgba(26,60,94,0.08)' },
    { icon: Sparkles, label: home.ask_sahaay, path: '/dashboard/sahaay', color: colors.gold, bg: isDark ? 'rgba(201,162,39,0.1)' : 'rgba(201,162,39,0.06)' },
    { icon: FileText, label: home.post_case, path: '/dashboard/cases', color: colors.textPrimary, bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,60,94,0.05)' },
    { icon: Search, label: home.find_lawyer, path: '/dashboard/lawyers', color: colors.success, bg: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)' },
    { icon: Clock, label: home.deadlines, path: '/dashboard/deadlines', color: colors.error, bg: isDark ? 'rgba(244,63,94,0.08)' : 'rgba(244,63,94,0.06)' },
  ];

  return (
    <div className="max-w-4xl space-y-4 md:space-y-6">
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
        {/* Decorative orb */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${colors.goldGlow}, transparent)`, filter: 'blur(40px)' }} />
        <motion.div className="absolute right-4 md:right-8 top-4 opacity-[0.07]" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          <Shield className="w-16 md:w-24 h-16 md:h-24" style={{ color: colors.gold }} strokeWidth={1} />
        </motion.div>
        <div className="relative z-10">
          <h1 className="text-xl md:text-3xl font-display font-bold" style={{ color: colors.textHeading }}>
            {greeting}, <span className="gold-shimmer">{user?.full_name?.split(' ')[0] || 'there'}</span>.
          </h1>
          <p className="text-xs md:text-sm font-body mt-2" style={{ color: colors.textSecondary }}>
            {stats.activeCases > 0
              ? <><span className="font-semibold" style={{ color: colors.textPrimary }}>{stats.activeCases} {home.active_cases_label}</span></>
              : home.welcome_sub}
          </p>
          <div className="flex flex-wrap gap-2 md:gap-4 mt-3 md:mt-4">
            <span className="px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-body font-medium" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.05)', color: colors.textSecondary, border: `1px solid ${colors.border}` }}>
              📂 {stats.activeCases} {home.active_cases_label}
            </span>
            <span className="px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-body font-medium" style={{ background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)', color: colors.success, border: '1px solid rgba(16,185,129,0.15)' }}>
              📄 {stats.documents} {home.documents}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            className="p-3 md:p-5 rounded-xl text-left group cursor-pointer glass-card"
            onClick={() => navigate(action.path)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl flex items-center justify-center mb-2 md:mb-3" style={{ background: action.bg }}>
              <action.icon className="w-4 md:w-5 h-4 md:h-5" style={{ color: action.color }} strokeWidth={1.5} />
            </div>
            <p className="text-xs md:text-sm font-body font-semibold" style={{ color: colors.textHeading }}>{action.label}</p>
            <ArrowRight className="w-3.5 h-3.5 mt-1 md:mt-2 group-hover:translate-x-1 nyaya-transition" style={{ color: colors.textMuted }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default VictimHome;
