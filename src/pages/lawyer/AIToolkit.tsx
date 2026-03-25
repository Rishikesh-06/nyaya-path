import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, BookOpen, Gavel, Send, Loader2, Copy, Check, Download, History, X, ChevronRight } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';
import { useResponsive } from '@/hooks/useResponsive';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TOOL_PROMPTS: Record<string, string> = {
  case_researcher: `You are an expert Indian legal researcher. Given the question below, provide:
1. Relevant IPC sections, CrPC sections, or applicable Acts
2. Legal rights of the person
3. 2-3 real landmark case precedents with citations
4. Practical advice
Be specific to Indian law. Format clearly with headers.
Question: `,
  document_drafter: `You are an expert Indian legal document drafter. Create a professional legal document based on the request. Include proper legal format, relevant legal provisions, clear demands, and proper conclusion. Use [Placeholder] format for fields that need to be filled in such as [Your Name], [Your Address], [Court Name], [Court Location], [Opponent Name], [Date], [Amount], [Designation] etc.
Request: `,
  precedent_finder: `You are an expert in Indian case law. Find the 5 most relevant Indian court judgments for the given case facts. For each: Case name and citation, Brief facts, Key ruling, How it applies.
Case facts: `,
  judge_intelligence: `You are analyzing the judicial philosophy of an Indian judge/court. Based on publicly known information provide: Known judicial philosophy, Patterns in verdicts, Areas of law, Notable cases, Practical insights. Only state public facts.
Judge/Court: `,
};

const tools = [
  { id: 'case_researcher', icon: Search, title: 'Case Researcher', desc: 'Enter any legal question. Get IPC sections, relevant acts, and real case precedents instantly.', color: 'hsl(210, 56%, 40%)', glow: 'rgba(26,60,94,0.4)', placeholder: 'e.g. What are the tenant rights when landlord cuts water supply?' },
  { id: 'document_drafter', icon: FileText, title: 'Document Drafter', desc: 'Describe what you need. AI generates a professional legal document — fully editable and downloadable as PDF.', color: 'hsl(160, 87%, 33%)', glow: 'rgba(10,158,110,0.4)', placeholder: 'e.g. Draft a legal notice for non-payment of salary for 3 months' },
  { id: 'precedent_finder', icon: BookOpen, title: 'Precedent Finder', desc: 'Describe your case facts. AI finds the 5 most relevant Indian court judgments with citations.', color: 'hsl(270, 80%, 60%)', glow: 'rgba(124,58,237,0.4)', placeholder: 'e.g. Wrongful termination of pregnant employee from private company' },
  { id: 'judge_intelligence', icon: Gavel, title: 'Judge Intelligence', desc: "Enter a judge's name and court. AI analyzes their past verdict patterns.", color: 'hsl(43, 72%, 47%)', glow: 'rgba(201,162,39,0.4)', placeholder: 'e.g. Justice D.Y. Chandrachud, Supreme Court of India' },
];

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ── Editable Document ─────────────────────────────────────────────────────────
const EditableDocument = ({ text, onValuesChange }: { text: string; onValuesChange: (v: Record<string, string>) => void }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const placeholders = Array.from(new Set([...text.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])));

  const handleChange = (key: string, val: string) => {
    const next = { ...values, [key]: val };
    setValues(next);
    onValuesChange(next);
  };

  const renderLine = (line: string, idx: number) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} style={{ height: '8px' }} />;
    const isGold = /^#+\s/.test(trimmed) || /^\d+\.\s+[A-Z]/.test(trimmed);
    const isBold = /^\*\*/.test(trimmed) || (trimmed.toUpperCase() === trimmed && trimmed.length < 70 && !/\[/.test(trimmed) && trimmed.length > 3);
    const isBullet = /^[•\-*]\s/.test(trimmed);
    const clean = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/^[•\-*]\s*/, '');

    const renderParts = (str: string) =>
      str.split(/(\[[^\]]+\])/g).map((part, i) => {
        if (/^\[[^\]]+\]$/.test(part)) {
          const key = part.slice(1, -1);
          const val = values[key] || '';
          return (
            <input key={i} value={val} onChange={e => handleChange(key, e.target.value)} placeholder={key}
              style={{ display: 'inline', minWidth: '80px', width: `${Math.max(key.length, val.length) * 9 + 24}px`, background: val ? 'rgba(201,162,39,0.08)' : 'rgba(201,162,39,0.18)', border: 'none', borderBottom: `2px solid ${val ? 'rgba(201,162,39,0.4)' : '#c9a227'}`, padding: '0 4px', color: val ? '#ffffff' : '#f0c040', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', cursor: 'text', borderRadius: '2px' }}
            />
          );
        }
        return <span key={i}>{part}</span>;
      });

    if (isBullet) return <div key={idx} style={{ display: 'flex', gap: '8px', margin: '4px 0 4px 16px' }}><span style={{ color: '#c9a227', fontWeight: 700, flexShrink: 0 }}>•</span><p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: '1.7' }}>{renderParts(clean)}</p></div>;
    return <p key={idx} style={{ margin: isGold ? '18px 0 6px' : isBold ? '14px 0 4px' : '5px 0', color: isGold ? '#e2c97e' : isBold ? '#ffffff' : 'rgba(255,255,255,0.85)', fontWeight: (isGold || isBold) ? 700 : 400, fontSize: isGold ? '15px' : '14px', lineHeight: '1.75', ...(isGold ? { borderBottom: '1px solid rgba(201,162,39,0.2)', paddingBottom: '4px' } : {}) }}>{renderParts(clean)}</p>;
  };

  return (
    <div>
      {placeholders.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.25)', borderRadius: '12px' }}>
          <p style={{ color: '#c9a227', fontWeight: 700, fontSize: '12px', marginBottom: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>✏️ Fill in your details</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
            {placeholders.map(key => (
              <div key={key}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', display: 'block', marginBottom: '3px' }}>{key}</label>
                <input value={values[key] || ''} onChange={e => handleChange(key, e.target.value)} placeholder={`Enter ${key}`}
                  style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontFamily: 'inherit', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(201,162,39,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div>{text.split('\n').map((line, i) => renderLine(line, i))}</div>
    </div>
  );
};

// ── Standard formatter ────────────────────────────────────────────────────────
const formatAIResult = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} style={{ height: '12px' }} />;
    if (/^#+\s/.test(trimmed)) return <p key={index} style={{ fontWeight: 700, color: '#e2c97e', fontSize: '16px', margin: '20px 0 8px', borderBottom: '1px solid rgba(201,162,39,0.3)', paddingBottom: '6px' }}>{trimmed.replace(/^#+\s*/, '')}</p>;
    if (/^\d+\.\s+[A-Z]/.test(trimmed)) return <p key={index} style={{ fontWeight: 700, color: '#e2c97e', fontSize: '15px', margin: '20px 0 8px' }}>{trimmed}</p>;
    if (trimmed.startsWith('**') || (trimmed.endsWith(':') && trimmed.length < 80)) return <p key={index} style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px', margin: '14px 0 4px' }}>{trimmed.replace(/\*\*/g, '')}</p>;
    if (/^[•\-*]\s/.test(trimmed)) return <div key={index} style={{ display: 'flex', gap: '8px', margin: '6px 0', paddingLeft: '8px' }}><span style={{ color: '#e2c97e', fontWeight: 700, flexShrink: 0 }}>•</span><p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: '14px', lineHeight: '1.6' }}>{trimmed.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, '')}</p></div>;
    return <p key={index} style={{ margin: '6px 0', color: 'rgba(255,255,255,0.82)', fontSize: '14px', lineHeight: '1.7' }}>{trimmed.replace(/\*\*/g, '')}</p>;
  });
};

// ── Main AIToolkit ────────────────────────────────────────────────────────────
const AIToolkit = () => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [docValues, setDocValues] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  const loadHistory = async (toolId: string) => {
    if (!user?.id) return;
    setHistoryLoading(true);
    const { data } = await (supabase as any)
      .from('ai_toolkit_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('tool_id', toolId)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
    setHistoryLoading(false);
  };

  const saveToHistory = async (toolId: string, q: string, r: string) => {
    if (!user?.id) return;
    await (supabase as any).from('ai_toolkit_history').insert({
      user_id: user.id,
      tool_id: toolId,
      query: q,
      result: r,
    });
  };

  const deleteHistory = async (id: string) => {
    await (supabase as any).from('ai_toolkit_history').delete().eq('id', id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const runTool = async () => {
    if (!query.trim() || !activeTool) return;
    setLoading(true); setResult(''); setDocValues({});
    try {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const prompt = (TOOL_PROMPTS[activeTool] || '') + query;
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.6, max_tokens: 2048 }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err?.error?.message || 'Groq API error'); }
      const data = await response.json();
      const r = data.choices?.[0]?.message?.content || '';
      setResult(r);
      // Save to history
      await saveToHistory(activeTool, query, r);
      if (showHistory) loadHistory(activeTool);
    } catch (err) {
      console.error(err);
      setResult('AI Toolkit is temporarily unavailable. Please try again.');
    } finally { setLoading(false); }
  };

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const loadFromHistory = (item: any) => {
    setQuery(item.query);
    setResult(item.result);
    setShowHistory(false);
  };

  const downloadPDF = () => {
    const filledText = result.replace(/\[([^\]]+)\]/g, (_, key) => docValues[key] || `[${key}]`);
    const lines = filledText.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<br/>';
      if (/^#+\s/.test(trimmed)) return `<h2>${trimmed.replace(/^#+\s*/, '')}</h2>`;
      if (trimmed.toUpperCase() === trimmed && trimmed.length < 70 && trimmed.length > 3) return `<p class="bold">${trimmed}</p>`;
      if (trimmed.startsWith('**') || (trimmed.endsWith(':') && trimmed.length < 80)) return `<p class="bold">${trimmed.replace(/\*\*/g, '')}</p>`;
      if (/^[•\-*]\s/.test(trimmed)) return `<p class="bullet">• ${trimmed.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, '')}</p>`;
      return `<p>${trimmed.replace(/\*\*/g, '')}</p>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Legal Document — NYAYA</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600;700&display=swap');
      body { font-family: 'EB Garamond', Georgia, serif; font-size: 13pt; line-height: 1.9; color: #111; background: #fff; padding: 60px 80px; max-width: 750px; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #1a3c5e; }
      .logo { font-size: 11pt; color: #c9a227; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; }
      .doc-title { font-size: 15pt; font-weight: 700; color: #1a3c5e; }
      h2 { color: #1a3c5e; font-size: 13pt; border-bottom: 1px solid #c9a227; padding-bottom: 4px; margin: 24px 0 8px; }
      p { margin: 6px 0; }
      .bold { font-weight: 700; margin: 12px 0 4px; }
      .bullet { margin: 4px 0 4px 24px; }
      .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ccc; font-size: 10pt; color: #888; text-align: center; }
      @media print { body { padding: 30px 50px; } @page { margin: 1.5cm; } }
    </style></head><body>
    <div class="header"><div class="logo">⚖ NYAYA</div><div class="doc-title">Legal Document</div></div>
    <div class="content">${lines}</div>
    <div class="footer">Generated by NYAYA AI Legal Arsenal • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <script>window.onload = function() { window.print(); }</script>
    </body></html>`);
    printWindow.document.close();
  };

  const currentTool = tools.find(t => t.id === activeTool);
  const isDocDrafter = activeTool === 'document_drafter';
  const gridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div className="max-w-4xl">
      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">Your AI Legal Arsenal</h2>
      <p className="text-xs md:text-sm font-body text-muted-foreground mb-6 md:mb-8">Powered by AI. Built for Indian courts.</p>

      {!activeTool ? (
        <div className={`grid ${gridCols} gap-4 md:gap-5`}>
          {tools.map((t, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <TiltCard className="glass-card rounded-2xl p-5 md:p-7 cursor-pointer group" maxTilt={6} onClick={() => setActiveTool(t.id)}>
                <motion.div className="w-10 md:w-12 h-10 md:h-12 rounded-xl flex items-center justify-center mb-4 md:mb-5" style={{ background: `${t.color}20` }} whileHover={{ rotate: 360, boxShadow: `0 0 30px ${t.glow}` }} transition={{ duration: 0.4 }}>
                  <t.icon className="w-5 md:w-6 h-5 md:h-6" style={{ color: t.color }} strokeWidth={1.5} />
                </motion.div>
                <h3 className="font-display font-semibold text-lg md:text-xl mb-2 text-foreground">{t.title}</h3>
                <p className="text-xs md:text-sm font-body text-muted-foreground">{t.desc}</p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => { setActiveTool(null); setResult(''); setQuery(''); setDocValues({}); setShowHistory(false); }} className="text-xs font-body text-muted-foreground hover:text-foreground nyaya-transition">← Back to tools</button>
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(activeTool); }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: showHistory ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showHistory ? 'rgba(201,162,39,0.3)' : 'rgba(255,255,255,0.1)'}`, color: showHistory ? '#c9a227' : 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: showHistory ? 600 : 400 }}
            >
              <History className="w-3 h-3" /> History
            </button>
          </div>

          {/* History Panel */}
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {currentTool?.title} History
                </p>
                {historyLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#c9a227' }} /></div>
                ) : history.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No history yet. Run a query to see it here.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {history.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                        onClick={() => loadFromHistory(item)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.query}</p>
                          <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{timeAgo(item.created_at)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                          <button
                            onClick={e => { e.stopPropagation(); deleteHistory(item.id); }}
                            style={{ padding: '3px 6px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tool Panel */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              {currentTool && <currentTool.icon className="w-5 md:w-6 h-5 md:h-6" style={{ color: currentTool.color }} strokeWidth={1.5} />}
              <h3 className="font-display font-semibold text-lg md:text-xl text-foreground">{currentTool?.title}</h3>
              {isDocDrafter && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(10,158,110,0.15)', color: '#0a9e6e', fontWeight: 600 }}>✏️ Editable + PDF</span>}
            </div>

            <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-2 mb-4`}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runTool()} placeholder={currentTool?.placeholder} className="flex-1 px-4 py-3 rounded-xl font-body text-sm bg-transparent outline-none min-w-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <motion.button onClick={runTool} disabled={loading || !query.trim()} className="px-4 py-3 rounded-xl font-body text-sm font-semibold btn-shine flex items-center justify-center gap-2" style={{ background: currentTool?.color || '#c9a227', color: '#fff', width: isMobile ? '100%' : 'auto' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Thinking...' : 'Run'}
              </motion.button>
            </div>

            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    <Download className="w-3 h-3" /> Download PDF
                  </button>
                </div>
                <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', maxHeight: isMobile ? '65vh' : '560px', overflowY: 'auto' }}>
                  {isDocDrafter
                    ? <EditableDocument text={result} onValuesChange={setDocValues} />
                    : formatAIResult(result)
                  }
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolkit;