import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, FolderOpen, Wrench, Users, Trophy, Settings, Scale, Calendar, Menu, X, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import { useResponsive } from '@/hooks/useResponsive';

const navKeys = [
  { icon: Home, key: 'home', path: '/lawyer' },
  { icon: FileText, key: 'case_feed', path: '/lawyer/feed' },
  { icon: FolderOpen, key: 'my_cases', path: '/lawyer/cases' },
  { icon: Wrench, key: 'ai_toolkit', path: '/lawyer/toolkit' },
  { icon: Calendar, key: 'appointments', path: '/lawyer/appointments' },
  { icon: MessageCircle, key: 'community', path: '/lawyer/community' },
  { icon: Users, key: 'mentorship', path: '/lawyer/mentorship' },
  { icon: Trophy, key: 'leaderboard', path: '/lawyer/leaderboard' },
  { icon: Settings, key: 'settings', path: '/lawyer/settings' },
];

const LawyerLayout = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();
  const navItems = navKeys.map(n => ({ ...n, label: t('lawyer_nav', n.key) }));

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: isDark
      ? 'radial-gradient(ellipse 70% 50% at 10% 5%, rgba(26,60,94,0.2) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,162,39,0.05) 0%, transparent 50%), hsl(220,30%,5%)'
      : 'radial-gradient(ellipse 70% 50% at 10% 5%, rgba(26,60,94,0.05) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,162,39,0.04) 0%, transparent 50%), hsl(225,25%,95%)',
    }}>
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-3 left-3 z-[60] flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: colors.hamburgerBg, color: colors.hamburgerColor, border: 'none', boxShadow: isDark ? '0 2px 12px rgba(201,162,39,0.3)' : '0 2px 12px rgba(26,60,94,0.15)' }}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {isMobile && sidebarOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-[40]" style={{ background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(26,60,94,0.2)', backdropFilter: 'blur(4px)' }} />
      )}

      <aside
        className="flex w-[260px] flex-col fixed inset-y-0 left-0 z-[50]"
        style={{
          background: colors.sidebarBg,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRight: `1px solid ${colors.sidebarBorder}`,
          transform: isMobile && !sidebarOpen ? 'translateX(-280px)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: isDark ? '4px 0 30px rgba(0,0,0,0.4)' : '4px 0 30px rgba(26,60,94,0.08)',
        }}
      >
        <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${colors.sidebarBorder}` }}>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNav('/')}>
            <Scale className="w-5 h-5" style={{ color: colors.gold }} strokeWidth={1.5} />
            <span className="font-display font-bold text-[22px] tracking-wide" style={{ color: colors.gold }}>NYAYA</span>
          </div>
        </div>
        <nav className="p-4 space-y-1 flex-1 relative overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => handleNav(item.path)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body nyaya-transition relative" style={{ color: active ? (isDark ? colors.gold : colors.navy) : colors.sidebarText, fontWeight: active ? 600 : 500 }}>
                {active && (
                  <motion.div layoutId="lawyer-nav-pill" className="absolute inset-0 rounded-xl" style={{
                    background: isDark ? 'linear-gradient(135deg, rgba(201,162,39,0.1), rgba(201,162,39,0.05))' : 'linear-gradient(135deg, rgba(26,60,94,0.08), rgba(26,60,94,0.03))',
                    border: `1px solid ${isDark ? 'rgba(201,162,39,0.15)' : 'rgba(26,60,94,0.1)'}`,
                    boxShadow: isDark ? '0 2px 10px rgba(201,162,39,0.08)' : '0 2px 10px rgba(26,60,94,0.05)',
                  }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <item.icon className="w-[18px] h-[18px] relative z-10" strokeWidth={1.5} style={{ color: active ? colors.gold : colors.textMuted }} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 w-full flex flex-col relative z-10" style={{ marginLeft: isMobile ? 0 : '260px', transition: 'margin-left 0.3s ease' }}>
        <header className="sticky top-0 z-[30] h-[60px] flex items-center justify-between px-4 md:px-6" style={{
          background: colors.topbarBg,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: `1px solid ${colors.topbarBorder}`,
          boxShadow: isDark ? '0 1px 20px rgba(0,0,0,0.3)' : '0 1px 20px rgba(26,60,94,0.06)',
        }}>
          <div className="flex items-center gap-2">
            {isMobile && <div className="w-10" />}
            {isMobile && (
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4" style={{ color: colors.gold }} strokeWidth={1.5} />
                <span className="font-display font-bold text-sm" style={{ color: colors.gold }}>NYAYA</span>
              </div>
            )}
            {!isMobile && <div />}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <NotificationBell />
            <div className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: colors.avatarBg, border: `2px solid ${colors.avatarBorder}`, boxShadow: `0 0 12px ${colors.goldGlow}` }} onClick={logout}>
              <span className="text-xs font-body font-bold" style={{ color: colors.avatarText }}>{user?.full_name?.[0] || 'L'}</span>
            </div>
          </div>
        </header>
        <main className="p-3 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default LawyerLayout;
