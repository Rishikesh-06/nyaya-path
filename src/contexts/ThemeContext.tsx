import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

const darkColors = {
  pageBg: 'hsl(220, 30%, 5%)',
  sidebarBg: 'rgba(8,12,20,0.97)',
  cardBg: 'rgba(255,255,255,0.035)',
  cardBgSolid: 'hsl(220, 25%, 8%)',
  cardBgHover: 'rgba(255,255,255,0.06)',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.07)',
  inputBg: 'rgba(255,255,255,0.05)',
  modalBg: 'rgba(10,15,26,0.98)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.15)',
  textPrimary: '#f0f4f8',
  textSecondary: 'rgba(240,244,248,0.6)',
  textMuted: 'rgba(240,244,248,0.35)',
  textHeading: '#ffffff',
  gold: '#c9a227',
  goldLight: '#e2c97e',
  goldGlow: 'rgba(201,162,39,0.25)',
  navy: '#1a3c5e',
  navyLight: '#2a5a8a',
  success: '#10b981',
  error: '#f43f5e',
  warning: '#f59e0b',
  info: '#3b82f6',
  sidebarText: 'rgba(240,244,248,0.5)',
  sidebarTextActive: '#ffffff',
  sidebarItemActive: 'rgba(201,162,39,0.1)',
  sidebarItemHover: 'rgba(255,255,255,0.04)',
  sidebarBorder: 'rgba(255,255,255,0.06)',
  topbarBg: 'rgba(8,12,20,0.9)',
  topbarBorder: 'rgba(255,255,255,0.06)',
  hamburgerBg: 'rgba(201,162,39,0.9)',
  hamburgerColor: '#0d1520',
  avatarBg: 'linear-gradient(135deg, #1a3c5e, #2a5a8a)',
  avatarBorder: 'rgba(201,162,39,0.4)',
  avatarText: '#ffffff',
  shadowCard: '0 4px 24px rgba(0,0,0,0.35)',
  shadowCardHover: '0 12px 40px rgba(0,0,0,0.5)',
  shadowGold: '0 0 30px rgba(201,162,39,0.15)',
  // Chat specific
  chatUserBubble: '#1a3c5e',
  chatAiBubble: 'rgba(255,255,255,0.05)',
  chatInputBg: 'rgba(255,255,255,0.06)',
  chatInputBorder: 'rgba(255,255,255,0.08)',
  // Skeleton
  skeletonBg: 'rgba(255,255,255,0.04)',
};

const lightColors = {
  pageBg: 'hsl(225, 25%, 95%)',
  sidebarBg: 'rgba(255,255,255,0.97)',
  cardBg: 'rgba(255,255,255,0.85)',
  cardBgSolid: '#ffffff',
  cardBgHover: '#ffffff',
  glass: 'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(255,255,255,0.95)',
  inputBg: 'rgba(255,255,255,0.9)',
  modalBg: 'rgba(255,255,255,0.99)',
  border: 'rgba(26,60,94,0.1)',
  borderHover: 'rgba(26,60,94,0.18)',
  textPrimary: '#0d1520',
  textSecondary: '#4b6280',
  textMuted: '#9ca3af',
  textHeading: '#0d1520',
  gold: '#b8860b',
  goldLight: '#c9a227',
  goldGlow: 'rgba(201,162,39,0.15)',
  navy: '#1a3c5e',
  navyLight: '#2a5a8a',
  success: '#059669',
  error: '#e11d48',
  warning: '#d97706',
  info: '#2563eb',
  sidebarText: '#4b6280',
  sidebarTextActive: '#1a3c5e',
  sidebarItemActive: 'rgba(26,60,94,0.08)',
  sidebarItemHover: 'rgba(26,60,94,0.04)',
  sidebarBorder: 'rgba(26,60,94,0.08)',
  topbarBg: 'rgba(255,255,255,0.92)',
  topbarBorder: 'rgba(26,60,94,0.08)',
  hamburgerBg: '#1a3c5e',
  hamburgerColor: '#ffffff',
  avatarBg: 'linear-gradient(135deg, #1a3c5e, #2a5a8a)',
  avatarBorder: 'rgba(201,162,39,0.35)',
  avatarText: '#ffffff',
  shadowCard: '0 4px 24px rgba(26,60,94,0.08)',
  shadowCardHover: '0 12px 40px rgba(26,60,94,0.14)',
  shadowGold: '0 0 20px rgba(201,162,39,0.1)',
  // Chat specific
  chatUserBubble: '#1a3c5e',
  chatAiBubble: '#f1f5f9',
  chatInputBg: 'rgba(255,255,255,0.9)',
  chatInputBorder: 'rgba(26,60,94,0.1)',
  // Skeleton
  skeletonBg: 'rgba(26,60,94,0.06)',
};

export type ThemeColors = typeof darkColors;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('nyaya_theme');
    return (saved as Theme) || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('nyaya_theme', next);
      return next;
    });
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
