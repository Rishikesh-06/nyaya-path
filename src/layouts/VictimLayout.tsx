import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Sparkles, FolderOpen, Search, Calendar, Upload, Clock, Settings, Scale, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import PanicCalculator from '@/components/PanicCalculator';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import IncomingCallToast from '@/components/IncomingCallToast';
import { useResponsive } from '@/hooks/useResponsive';

const navKeys = [
  { icon: Home, key: 'home', path: '/dashboard' },
  { icon: Sparkles, key: 'sahaay', path: '/dashboard/sahaay', gold: true },
  { icon: FolderOpen, key: 'my_cases', path: '/dashboard/cases' },
  { icon: Search, key: 'find_lawyer', path: '/dashboard/lawyers' },
  { icon: Calendar, key: 'appointments', path: '/dashboard/book' },
  { icon: Upload, key: 'upload_document', path: '/dashboard/upload' },
  { icon: Clock, key: 'deadlines', path: '/dashboard/deadlines' },
  { icon: Settings, key: 'settings', path: '/dashboard/settings' },
];

const VictimLayout = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [panicMode, setPanicMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();
  const navItems = navKeys.map(n => ({ ...n, label: t('victim_nav', n.key) }));

  if (panicMode) return <PanicCalculator onExit={() => setPanicMode(false)} />;

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: isDark
      ? 'radial-gradient(ellipse 70% 50% at 10% 5%, rgba(26,60,94,0.2) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,162,39,0.05) 0%, transparent 50%), hsl(220,30%,5%)'
      : 'radial-gradient(ellipse 70% 50% at 10% 5%, rgba(26,60,94,0.05) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,162,39,0.04) 0%, transparent 50%), hsl(225,25%,95%)',
    }}>

      {/* ── Incoming Video Call Toast (only for victims) ── */}
      <IncomingCallToast />

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
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6 p-2 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,60,94,0.03)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.avatarBg, border: `2px solid ${colors.avatarBorder}` }}>
              <span className="font-body font-semibold text-sm" style={{ color: colors.avatarText }}>{user?.full_name?.[0] || 'R'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-body font-semibold truncate" style={{ color: colors.textHeading }}>{user?.full_name || 'User'}</p>
              <p className="text-xs font-body truncate" style={{ color: colors.textMuted }}>{user?.city || ''}</p>
            </div>
          </div>
          <nav className="space-y-1 relative">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <button key={item.path} onClick={() => handleNav(item.path)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body nyaya-transition relative" style={{ color: active ? (isDark ? colors.gold : colors.navy) : colors.sidebarText, fontWeight: active ? 600 : 500 }}>
                  {active && (
                    <motion.div layoutId="victim-nav-pill" className="absolute inset-0 rounded-xl" style={{
                      background: isDark ? 'linear-gradient(135deg, rgba(201,162,39,0.1), rgba(201,162,39,0.05))' : 'linear-gradient(135deg, rgba(26,60,94,0.08), rgba(26,60,94,0.03))',
                      border: `1px solid ${isDark ? 'rgba(201,162,39,0.15)' : 'rgba(26,60,94,0.1)'}`,
                      boxShadow: isDark ? '0 2px 10px rgba(201,162,39,0.08)' : '0 2px 10px rgba(26,60,94,0.05)',
                    }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <item.icon className="w-[18px] h-[18px] relative z-10" strokeWidth={1.5} style={{ color: item.gold || active ? colors.gold : colors.textMuted }} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4" style={{ borderTop: `1px solid ${colors.sidebarBorder}` }}>
        </div>
      </aside>

      <div className="flex-1 min-w-0 w-full flex flex-col" style={{ marginLeft: isMobile ? 0 : '260px', transition: 'margin-left 0.3s ease' }}>
        <header className="sticky top-0 z-[30] h-[60px] flex items-center justify-between px-4 md:px-6" style={{
          background: colors.topbarBg,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: `1px solid ${colors.topbarBorder}`,
          boxShadow: isDark ? '0 1px 20px rgba(0,0,0,0.3)' : '0 1px 20px rgba(26,60,94,0.06)',
        }}>
          <div className="flex items-center gap-2">
            {isMobile && <div className="w-10" />}
            {!isMobile && <div />}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <motion.button onClick={() => navigate('/dashboard/sahaay')} className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs font-body font-semibold btn-shine nyaya-transition" style={{
              background: `linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.08))`,
              color: colors.gold,
              border: `1px solid rgba(201,162,39,0.2)`,
            }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{t('victim_home', 'ask_sahaay')}</span>
            </motion.button>
            <ThemeToggle />
            <NotificationBell />
            <div className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: colors.avatarBg, border: `2px solid ${colors.avatarBorder}`, boxShadow: `0 0 12px ${colors.goldGlow}` }} onClick={logout}>
              <span className="text-xs font-body font-bold" style={{ color: colors.avatarText }}>{user?.full_name?.[0] || 'U'}</span>
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

export default VictimLayout;