import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium nyaya-transition"
      style={{
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.05)',
        border: `1px solid ${colors.border}`,
        color: colors.textSecondary,
        backdropFilter: 'blur(12px)',
      }}
    >
      {isDark ? '☀️' : '🌙'}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
};

export default ThemeToggle;
