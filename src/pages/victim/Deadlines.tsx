import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Trash2, Clock, AlertTriangle, CheckCircle2, CalendarDays, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';

interface Deadline {
  id: string; user_id: string; title: string; description: string | null;
  due_date: string; case_id: string | null; source: string; status: string; created_at: string;
}

const Deadlines = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: '', description: '', due_date: '' });

  useEffect(() => {
    if (user?.id) { loadDeadlines(); updateOverdueStatus(); }
  }, [user?.id]);

  const loadDeadlines = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('deadlines').select('*').eq('user_id', user.id).order('due_date', { ascending: true });
    if (data) setDeadlines(data as Deadline[]);
    setLoading(false);
  };

  const updateOverdueStatus = async () => {
    if (!user?.id) return;
    await supabase.from('deadlines').update({ status: 'overdue' }).eq('user_id', user.id).eq('status', 'pending').lt('due_date', new Date().toISOString().split('T')[0]);
  };

  const addDeadline = async () => {
    if (!newDeadline.title || !newDeadline.due_date || !user?.id) return;
    const { data } = await supabase.from('deadlines').insert({ user_id: user.id, title: newDeadline.title, description: newDeadline.description || null, due_date: newDeadline.due_date, source: 'manual', status: 'pending' }).select().single();
    if (data) {
      const typed = data as Deadline;
      setDeadlines(prev => [...prev, typed].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
      setNewDeadline({ title: '', description: '', due_date: '' });
      setShowAddForm(false);
      toast({ title: l('గడువు జోడించబడింది', 'समय सीमा जोड़ी गई', 'Deadline added') });
    }
  };

  const markComplete = async (id: string) => {
    await supabase.from('deadlines').update({ status: 'completed' }).eq('id', id);
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, status: 'completed' } : d));
  };

  const deleteDeadline = async (id: string) => {
    const msg = l('ఈ గడువును తొలగించాలా?', 'क्या इस समय सीमा को हटाएं?', 'Delete this deadline?');
    if (!window.confirm(msg)) return;
    await supabase.from('deadlines').delete().eq('id', id);
    setDeadlines(prev => prev.filter(d => d.id !== id));
    toast({ title: l('తొలగించబడింది', 'हटाया गया', 'Deleted') });
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const pending = deadlines.filter(d => d.status === 'pending').length;
  const overdue = deadlines.filter(d => d.status === 'overdue').length;
  const completed = deadlines.filter(d => d.status === 'completed').length;

  const l = (te: string, hi: string, en: string) => language === 'Telugu' ? te : language === 'Hindi' ? hi : en;

  const stats = [
    { label: l('మొత్తం', 'कुल', 'Total'), value: deadlines.length, color: colors.navy },
    { label: l('పెండింగ్', 'लंबित', 'Pending'), value: pending, color: '#f59e0b' },
    { label: l('గడువు దాటింది', 'अतिदेय', 'Overdue'), value: overdue, color: '#ef4444' },
    { label: l('పూర్తయింది', 'पूर्ण', 'Completed'), value: completed, color: '#22c55e' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1px solid ${colors.border}`,
    borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px',
    color: colors.textPrimary, background: colors.inputBg, boxSizing: 'border-box',
  };

  return (
    <div className="max-w-3xl space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-display font-bold" style={{ color: colors.textHeading }}>
          {l('గడువు తేదీలు', 'समय सीमाएं', 'Deadlines')}
        </h1>
        <motion.button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-body font-semibold text-sm"
          style={{ background: '#c9a227', color: '#fff', border: 'none', cursor: 'pointer', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" /> {l('గడువు జోడించు', 'समय सीमा जोड़ें', 'Add Deadline')}
        </motion.button>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3`}>
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-3 md:p-4 text-center" style={{ background: colors.cardBgSolid, border: `1px solid ${colors.border}` }}>
            <p className="text-xl md:text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] md:text-xs font-body mt-1" style={{ color: colors.textSecondary }}>{s.label}</p>
          </div>
        ))}
      </div>

      {showAddForm && (
        <motion.div className="rounded-xl p-4 md:p-5 space-y-3" style={{ background: colors.cardBgSolid, border: `1px solid ${colors.border}` }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-body font-semibold text-sm" style={{ color: colors.textHeading }}>{l('కొత్త గడువు జోడించు', 'नई समय सीमा जोड़ें', 'Add New Deadline')}</h3>
          <input placeholder={l('గడువు శీర్షిక...', 'समय सीमा शीर्षक...', 'Deadline title...')} value={newDeadline.title} onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <input placeholder={l('వివరణ (ఐచ్ఛికం)...', 'विवरण (वैकल्पिक)...', 'Description (optional)...')} value={newDeadline.description} onChange={e => setNewDeadline(p => ({ ...p, description: e.target.value }))} style={inputStyle} />
          <input type="date" value={newDeadline.due_date} onChange={e => setNewDeadline(p => ({ ...p, due_date: e.target.value }))} style={inputStyle} />
          <div className="flex gap-3">
            <button onClick={addDeadline} className="font-body font-semibold text-sm px-5 py-2.5 rounded-lg" style={{ background: colors.navy, color: 'white', border: 'none', cursor: 'pointer', flex: isMobile ? 1 : undefined }}>
              {l('సేవ్ చేయి', 'सहेजें', 'Save')}
            </button>
            <button onClick={() => setShowAddForm(false)} className="font-body text-sm px-5 py-2.5 rounded-lg" style={{ background: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, cursor: 'pointer', flex: isMobile ? 1 : undefined }}>
              {l('రద్దు', 'रद्द करें', 'Cancel')}
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin" />
        </div>
      ) : deadlines.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textMuted }} strokeWidth={1} />
          <p className="text-sm font-body" style={{ color: colors.textMuted }}>{l('ఇంకా గడువులు లేవు. పైన బటన్ నొక్కి జోడించండి.', 'अभी कोई समय सीमा नहीं।', 'No deadlines yet. Add one above.')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((dl, i) => {
            const days = getDaysRemaining(dl.due_date);
            const isCompleted = dl.status === 'completed';
            const isOverdue = dl.status === 'overdue';
            const statusColor = isCompleted ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b';
            const daysLabel = isCompleted ? l('✓ పూర్తయింది', '✓ पूर्ण', '✓ Completed') : days < 0 ? l(`${Math.abs(days)} రోజులు దాటింది`, `${Math.abs(days)} दिन पहले`, `${Math.abs(days)} days overdue`) : days === 0 ? l('ఈరోజు!', 'आज!', 'Today!') : l(`${days} రోజులు మిగిలాయి`, `${days} दिन बाकी`, `${days} days left`);
            const statusLabel = isCompleted ? l('పూర్తి', 'पूर्ण', 'Done') : isOverdue ? l('గడువు దాటింది', 'अतिदेय', 'Overdue') : l('పెండింగ్', 'लंबित', 'Pending');

            return (
              <motion.div key={dl.id} className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-3 md:gap-4 rounded-xl p-3 md:p-4`} style={{ background: colors.cardBgSolid, border: `1px solid ${isOverdue ? '#fecaca' : colors.border}` }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-body font-semibold text-sm" style={{ color: colors.textPrimary, textDecoration: isCompleted ? 'line-through' : 'none' }}>{dl.title}</p>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: statusColor + '18', color: statusColor }}>{statusLabel}</span>
                    {dl.source === 'document' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#e0f2fe', color: '#0369a1' }}><FileText className="w-3 h-3" /> Auto</span>
                    )}
                  </div>
                  {dl.description && <p className="text-xs font-body mb-1" style={{ color: colors.textSecondary }}>{dl.description}</p>}
                  <p className="text-xs font-body font-semibold" style={{ color: statusColor }}>
                    {daysLabel} • {new Date(dl.due_date).toLocaleDateString(language === 'Telugu' ? 'te-IN' : language === 'Hindi' ? 'hi-IN' : 'en-IN')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!isCompleted && (
                    <button onClick={() => markComplete(dl.id)} className="p-2 rounded-lg" style={{ background: '#f0fdf4', color: '#22c55e', border: '1px solid #bbf7d0', cursor: 'pointer', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={l('పూర్తి చేయి', 'पूर्ण करें', 'Mark complete')}>
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteDeadline(dl.id)} className="p-2 rounded-lg" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={l('తొలగించు', 'हटाएं', 'Delete')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Deadlines;
