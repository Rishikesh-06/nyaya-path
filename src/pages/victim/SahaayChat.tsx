import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, MicOff, Send, Copy, Trash2, Plus, MessageSquare, PanelLeftClose, PanelLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { LANGUAGES, QUICK_QUESTIONS, LanguageCode } from '@/config/languages';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useResponsive } from '@/hooks/useResponsive';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  language: LanguageCode;
  timestamp: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
}

const parseResponse = (text: string, language: LanguageCode) => {
  const { sections } = LANGUAGES[language];
  const rightLabel = sections.right + ':';
  const sayLabel = sections.say + ':';
  const stepLabel = sections.step + ':';
  const rightIdx = text.indexOf(rightLabel);
  const sayIdx = text.indexOf(sayLabel);
  const stepIdx = text.indexOf(stepLabel);
  if (rightIdx === -1 || sayIdx === -1 || stepIdx === -1) return { right: '', say: '', step: '', raw: text };
  return {
    right: text.slice(rightIdx + rightLabel.length, sayIdx).replace(/\*\*/g, '').trim(),
    say: text.slice(sayIdx + sayLabel.length, stepIdx).replace(/\*\*/g, '').trim(),
    step: text.slice(stepIdx + stepLabel.length).replace(/\*\*/g, '').trim(),
    raw: text,
  };
};

const callGroqSahaay = async (
  userMessage: string,
  language: LanguageCode,
  conversationHistory: { role: string; content: string }[]
): Promise<string> => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const lang = LANGUAGES[language];

  const systemPrompt = `You are Sahaay, a compassionate legal assistant for Indian citizens who need help understanding their rights. You speak in ${language}.

Your response MUST always follow this exact format (translate the labels to ${language}):
${lang.sections.right}: [Explain the legal right clearly in 2-3 sentences]
${lang.sections.say}: [Give exact words they can say to police/authority/landlord]
${lang.sections.step}: [Give 2-3 concrete next steps they should take]

Be warm, empathetic, and clear. Focus on Indian law (IPC, CrPC, relevant Acts).
For casual greetings, respond naturally without the structured format.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Groq API error');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

const SahaayChat = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>((user?.preferred_language as LanguageCode) || 'English');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { activeMsgId, isSupported: ttsSupported, speak, stop: stopSpeaking } = useTextToSpeech();
  const { isListening, isSupported: sttSupported, toggleListening } = useSpeechToText({
    language: selectedLanguage,
    onTranscript: (text) => { setInput(text); },
    onError: (errMsg) => toast({ title: 'Voice Error', description: errMsg, variant: 'destructive' }),
  });

  const loadSessions = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('sahaay_conversations').select('id, session_title, messages, created_at').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) {
      setSessions(data.map(row => {
        const msgs = (row.messages as any[]) || [];
        const firstUserMsg = msgs.find((m: any) => m.role === 'user');
        return { id: row.id, title: (row as any).session_title || firstUserMsg?.content?.substring(0, 40) || 'New Chat', created_at: row.created_at || '' };
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const saved = user.preferred_language as LanguageCode;
    if (saved && LANGUAGES[saved]) setSelectedLanguage(saved);
    setIsLoadingHistory(true);
    supabase.from('sahaay_conversations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setCurrentSessionId(data[0].id);
        setMessages((data[0].messages as any[]) || []);
        if (data[0].language && LANGUAGES[data[0].language as LanguageCode]) setSelectedLanguage(data[0].language as LanguageCode);
      }
      setIsLoadingHistory(false);
    });
    loadSessions();
  }, [user, loadSessions]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const startNewChat = () => { setCurrentSessionId(null); setMessages([]); if (isMobile) setSidebarOpen(false); setTimeout(() => inputRef.current?.focus(), 100); };

  const loadSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    setIsLoadingHistory(true);
    const { data } = await supabase.from('sahaay_conversations').select('*').eq('id', sessionId).single();
    if (data) {
      setCurrentSessionId(data.id);
      setMessages((data.messages as any[]) || []);
      if (data.language && LANGUAGES[data.language as LanguageCode]) setSelectedLanguage(data.language as LanguageCode);
    }
    setIsLoadingHistory(false);
    if (isMobile) setSidebarOpen(false);
  };

  const deleteSession = async (sessionId: string) => {
    await supabase.from('sahaay_conversations').delete().eq('id', sessionId);
    if (currentSessionId === sessionId) { setCurrentSessionId(null); setMessages([]); }
    await loadSessions();
  };

  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return selectedLanguage === 'Telugu' ? 'ఈరోజు' : selectedLanguage === 'Hindi' ? 'आज' : 'Today';
    if (date.toDateString() === yesterday.toDateString()) return selectedLanguage === 'Telugu' ? 'నిన్న' : selectedLanguage === 'Hindi' ? 'कल' : 'Yesterday';
    return date.toLocaleDateString(selectedLanguage === 'Telugu' ? 'te-IN' : selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-IN');
  };

  const saveConversation = async (msgs: Message[]) => {
    if (!user) return;
    const firstUserMsg = msgs.find(m => m.role === 'user');
    const payload = { user_id: user.id, messages: msgs as any, language: selectedLanguage, updated_at: new Date().toISOString(), session_title: firstUserMsg?.content?.substring(0, 40) || 'New Chat' };
    if (currentSessionId) {
      await supabase.from('sahaay_conversations').update(payload).eq('id', currentSessionId);
    } else {
      const { data } = await supabase.from('sahaay_conversations').insert(payload).select().single();
      if (data) setCurrentSessionId(data.id);
    }
    await loadSessions();
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    setSelectedLanguage(lang);
    if (user) await supabase.from('users').update({ preferred_language: lang }).eq('id', user.id);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;
    setInput(''); stopSpeaking();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageText, language: selectedLanguage, timestamp: new Date().toISOString() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setLoading(true);
    try {
      const response = await callGroqSahaay(messageText, selectedLanguage, messages.slice(-8).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })));
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: response, language: selectedLanguage, timestamp: new Date().toISOString() };
      const finalMsgs = [...newMsgs, aiMsg];
      setMessages(finalMsgs);
      await saveConversation(finalMsgs);
    } catch (err: any) {
      toast({ title: 'Sahaay Error', description: err?.message || 'Could not reach AI. Please try again.', variant: 'destructive' });
      setMessages(newMsgs);
    } finally { setLoading(false); }
  }, [input, loading, messages, selectedLanguage, stopSpeaking, toast]);

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copied!' }); };
  const lang = LANGUAGES[selectedLanguage];
  const quickQuestions = QUICK_QUESTIONS[selectedLanguage] || QUICK_QUESTIONS['English'];
  const groupSessionsByDate = (sessions: Session[]) => {
    const groups: Record<string, Session[]> = {};
    sessions.forEach(session => { const dateStr = formatDateSeparator(new Date(session.created_at)); if (!groups[dateStr]) groups[dateStr] = []; groups[dateStr].push(session); });
    return groups;
  };
  const sectionConfig = [
    { key: 'right' as const, label: lang.sections.right, color: '#0a9e6e', bg: 'rgba(10,158,110,0.1)', italic: false },
    { key: 'say' as const, label: lang.sections.say, color: '#1a3c5e', bg: 'rgba(26,60,94,0.1)', italic: true },
    { key: 'step' as const, label: lang.sections.step, color: '#c9a227', bg: 'rgba(201,162,39,0.1)', italic: false },
  ];

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: 'inherit' }}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: isMobile ? '100%' : 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, borderRight: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: isMobile ? 'absolute' : 'relative', zIndex: isMobile ? 20 : 'auto', height: '100%', left: 0, top: 0 }}>
            <div style={{ padding: '16px 12px 8px 12px', flexShrink: 0 }}>
              <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-sm font-semibold nyaya-transition" style={{ background: isDark ? 'rgba(201,162,39,0.1)' : 'rgba(26,60,94,0.06)', border: `1px solid ${colors.border}`, color: isDark ? colors.gold : colors.navy }}>
                <Plus className="w-4 h-4" strokeWidth={2} />
                {selectedLanguage === 'Telugu' ? 'కొత్త చాట్' : selectedLanguage === 'Hindi' ? 'नई चैट' : 'New Chat'}
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px' }}>
              {sessions.length === 0
                ? <p className="text-xs font-body text-center py-8" style={{ color: colors.textMuted }}>{selectedLanguage === 'Telugu' ? 'ఇంకా చాట్‌లు లేవు' : selectedLanguage === 'Hindi' ? 'अभी तक कोई चैट नहीं' : 'No chats yet'}</p>
                : Object.entries(groupSessionsByDate(sessions)).map(([date, group]) => (
                  <div key={date}>
                    <p className="text-[10px] font-body font-semibold uppercase tracking-wider px-2 py-2" style={{ color: colors.textMuted }}>{date}</p>
                    {group.map(session => <SessionItem key={session.id} session={session} isActive={session.id === currentSessionId} onSelect={loadSession} onDelete={deleteSession} isDark={isDark} colors={colors} />)}
                  </div>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        <div className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3" style={{ borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center nyaya-transition hover:bg-white/10" style={{ border: `1px solid ${colors.border}` }}>
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" style={{ color: colors.textSecondary }} strokeWidth={1.5} /> : <PanelLeft className="w-4 h-4" style={{ color: colors.textSecondary }} strokeWidth={1.5} />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.15)' }}><Sparkles className="w-3.5 h-3.5 text-nyaya-gold" /></div>
            <div>
              <p className="text-sm font-display font-semibold" style={{ color: colors.textPrimary }}>Sahaay</p>
              <p className="text-[10px] font-body" style={{ color: colors.textMuted }}>Your legal companion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(['English', 'Telugu', 'Hindi'] as LanguageCode[]).map(l => (
              <button key={l} onClick={() => handleLanguageChange(l)} className="px-2.5 py-1 rounded-full text-xs font-body font-medium nyaya-transition" style={{ background: selectedLanguage === l ? '#c9a227' : 'transparent', color: selectedLanguage === l ? '#fff' : colors.textSecondary, border: `1px solid ${selectedLanguage === l ? '#c9a227' : colors.border}` }}>
                {l === 'English' ? 'English' : l === 'Telugu' ? 'తెలుగు' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 space-y-4">
          <AnimatePresence>
            {isLoadingHistory
              ? <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin" /></div>
              : messages.length === 0
                ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                    <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(201,162,39,0.12)' }}><Sparkles className="w-6 md:w-7 h-6 md:h-7 text-nyaya-gold" /></div>
                    <h3 className="font-display font-semibold text-base md:text-lg mb-1" style={{ color: colors.textPrimary }}>{selectedLanguage === 'Telugu' ? 'నమస్కారం! నేను సహాయ్' : selectedLanguage === 'Hindi' ? 'नमस्ते! मैं सहाय हूँ' : 'Hello! I am Sahaay'}</h3>
                    <p className="text-xs md:text-sm font-body mb-6 max-w-xs" style={{ color: colors.textSecondary }}>{selectedLanguage === 'Telugu' ? 'మీ న్యాయ సహాయకుడు' : selectedLanguage === 'Hindi' ? 'आपका कानूनी सहायक' : 'Your legal companion'}</p>
                    <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                      {quickQuestions.map((q, i) => (
                        <motion.button key={i} onClick={() => sendMessage(q)} className="px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-left text-xs md:text-sm font-body nyaya-transition" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)', border: `1px solid ${colors.border}`, color: colors.textSecondary }} whileHover={{ x: 4, borderColor: '#c9a227' }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>{q}</motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : messages.map((msg, idx) => {
                  const msgLang = msg.language || selectedLanguage;
                  const parsed = msg.role === 'ai' ? parseResponse(msg.content, msgLang) : null;
                  const showDate = idx === 0 || new Date(msg.timestamp).toDateString() !== new Date(messages[idx - 1].timestamp).toDateString();
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && <div className="flex justify-center"><span className="text-[11px] font-body px-3 py-1 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: colors.textMuted }}>{formatDateSeparator(new Date(msg.timestamp))}</span></div>}
                      <motion.div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        {msg.role === 'user'
                          ? <div className="max-w-[85%] md:max-w-[75%] px-3 md:px-4 py-2.5 md:py-3 rounded-2xl rounded-tr-sm font-body text-sm" style={{ background: isDark ? 'rgba(26,60,94,0.7)' : 'rgba(26,60,94,0.85)', color: '#fff' }}>{msg.content}</div>
                          : (
                            <div className="max-w-[95%] md:max-w-[85%] rounded-2xl rounded-tl-sm p-3 md:p-4 space-y-3" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)', border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.gold}` }}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(201,162,39,0.15)' : 'rgba(201,162,39,0.1)' }}><Sparkles className="w-3 h-3 text-nyaya-gold" /></div>
                                <span className="text-xs font-body font-medium" style={{ color: colors.textPrimary }}>Sahaay</span>
                              </div>
                              {parsed && parsed.right
                                ? sectionConfig.map(({ key, label, color, bg, italic }) => { const text = parsed[key]; if (!text) return null; return (<div key={key}><span className="inline-block px-2 py-0.5 rounded text-[11px] md:text-xs font-body font-semibold mb-1" style={{ background: bg, color }}>{label}</span><p className={`text-[13px] md:text-sm font-body ${italic ? 'italic' : ''}`} style={{ color: colors.textSecondary }}>{text}</p></div>); })
                                : <p className="text-[13px] md:text-sm font-body" style={{ color: colors.textSecondary }}>{msg.content.replace(/\*\*/g, '')}</p>
                              }
                              <div className="flex items-center gap-2 md:gap-3 pt-1 flex-wrap">
                                <button onClick={() => speak(msg.content, msgLang, msg.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: activeMsgId === msg.id ? 'rgba(201,162,39,0.12)' : 'transparent', border: `1px solid ${activeMsgId === msg.id ? '#c9a227' : colors.border}`, borderRadius: '9999px', padding: '4px 10px', cursor: 'pointer', color: activeMsgId === msg.id ? '#c9a227' : '#666', fontSize: '11px', fontFamily: 'inherit' }}>
                                  {activeMsgId === msg.id ? (msgLang === 'Telugu' ? '⏸ ఆపు' : msgLang === 'Hindi' ? '⏸ रोकें' : '⏸ Stop') : (msgLang === 'Telugu' ? '🔊 వినండి' : msgLang === 'Hindi' ? '🔊 सुनें' : '🔊 Listen')}
                                </button>
                                <button onClick={() => handleCopy(msg.content)} className="flex items-center gap-1 text-[11px] font-body nyaya-transition hover:text-nyaya-gold" style={{ color: colors.textMuted }}>
                                  <Copy className="w-3 h-3" strokeWidth={1.5} />{msgLang === 'Telugu' ? 'కాపీ' : msgLang === 'Hindi' ? 'कॉपी' : 'Copy'}
                                </button>
                              </div>
                            </div>
                          )
                        }
                      </motion.div>
                    </React.Fragment>
                  );
                })
            }
            {loading && (
              <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderLeft: `2px solid ${colors.gold}`, paddingLeft: '12px' }}>
                  <span className="text-xs font-body" style={{ color: colors.textSecondary }}>{selectedLanguage === 'Telugu' ? 'ఆలోచిస్తున్నాను...' : selectedLanguage === 'Hindi' ? 'सोच रहा हूँ...' : 'Thinking...'}</span>
                  <div className="flex gap-1">{[0, 1, 2].map(i => <motion.div key={i} className="w-2 h-2 rounded-full bg-nyaya-gold" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />)}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="pt-2 md:pt-3 pb-3 md:pb-4" style={{ borderTop: `1px solid ${colors.border}`, flexShrink: 0 }}>
          {isListening && <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg text-xs font-body" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />{selectedLanguage === 'Telugu' ? 'వింటున్నాను...' : selectedLanguage === 'Hindi' ? 'सुन रहा हूँ...' : 'Listening...'}</div>}
          <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : colors.border}` }}>
            {sttSupported && <motion.button onClick={toggleListening} className="w-8 h-8 rounded-lg flex items-center justify-center nyaya-transition flex-shrink-0" style={{ background: isListening ? 'rgba(239,68,68,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.04)') }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{isListening ? <MicOff className="w-4 h-4" style={{ color: '#ef4444' }} strokeWidth={1.5} /> : <Mic className="w-4 h-4" style={{ color: colors.textSecondary }} strokeWidth={1.5} />}</motion.button>}
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={selectedLanguage === 'Telugu' ? 'మీ సమస్య చెప్పండి...' : selectedLanguage === 'Hindi' ? 'अपनी समस्या बताएं...' : 'Describe your legal issue...'} disabled={loading} className="flex-1 text-sm font-body bg-transparent outline-none placeholder:text-muted-foreground min-w-0" style={{ color: colors.textPrimary }} />
            <motion.button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="w-8 h-8 rounded-lg flex items-center justify-center nyaya-transition flex-shrink-0" style={{ background: input.trim() ? '#c9a227' : 'rgba(201,162,39,0.3)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Send className="w-4 h-4" style={{ color: '#fff' }} strokeWidth={1.5} /></motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionItem = ({ session, isActive, onSelect, onDelete, isDark, colors }: { session: Session; isActive: boolean; onSelect: (id: string) => void; onDelete: (id: string) => void; isDark: boolean; colors: any; }) => {
  const [hovering, setHovering] = useState(false);
  return (
    <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
      <button onClick={() => onSelect(session.id)} style={{ flex: 1, padding: '10px 12px', background: isActive ? (isDark ? 'rgba(201,162,39,0.12)' : 'rgba(26,60,94,0.08)') : 'transparent', border: `1px solid ${isActive ? (isDark ? 'rgba(201,162,39,0.2)' : 'rgba(26,60,94,0.12)') : 'transparent'}`, borderRadius: '10px', color: isActive ? (isDark ? colors.gold : colors.navy) : colors.textSecondary, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: isActive ? 600 : 400, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.title}</span>
      </button>
      {hovering && <button onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '4px', flexShrink: 0 }}><Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /></button>}
    </div>
  );
};

export default SahaayChat;
