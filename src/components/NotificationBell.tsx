import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, MessageCircle, Award, Calendar, Briefcase, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, any> = {
  case_accepted: FileText,
  new_message: MessageCircle,
  appointment_update: Calendar,
  badge_earned: Award,
  internship_update: Briefcase,
  new_application: Briefcase,
};

const NotificationBell = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
  };

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase.channel('notifications-bell').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchNotifications()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell className="w-5 h-5" style={{ color: colors.textSecondary }} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-mono font-bold" style={{ background: '#ef4444', color: '#fff' }}>
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto rounded-xl z-50"
            style={{
              background: colors.modalBg,
              border: `1px solid ${colors.border}`,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <span className="text-xs font-body font-semibold" style={{ color: colors.textPrimary }}>Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-body hover:underline" style={{ color: colors.gold }}>Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs font-body text-center py-8" style={{ color: colors.textMuted }}>No notifications yet.</p>
            ) : (
              notifications.map(n => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className="w-full text-left px-3 py-3 flex items-start gap-3 nyaya-transition"
                    style={{ background: !n.is_read ? `${colors.gold}08` : 'transparent' }}
                  >
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.gold }} strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-semibold truncate" style={{ color: colors.textPrimary }}>{n.title}</p>
                      <p className="text-xs font-body truncate" style={{ color: colors.textSecondary }}>{n.body?.slice(0, 80)}</p>
                      <p className="text-[10px] font-mono mt-1" style={{ color: colors.textMuted }}>{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: colors.gold }} />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
