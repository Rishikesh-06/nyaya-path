import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, Clock, AlertTriangle, Trash2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useResponsive } from '@/hooks/useResponsive';
import CountUp from '@/components/CountUp';

interface DocRecord {
  id: string;
  uploader_id: string;
  file_name: string;
  file_type: string | null;
  file_url: string;
  ai_analysis: any;
  case_id: string | null;
  created_at: string;
}

const analyzeDocumentWithGroq = async (documentText: string, language: string): Promise<any> => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const prompt = `You are a legal document analyzer for Indian citizens. Analyze this document and respond ONLY with valid JSON. No markdown, no code blocks, no explanation. Just the raw JSON object in ${language}.

Return this exact JSON structure:
{
  "document_type": "type of document",
  "plain_summary": "2-3 sentence summary in simple language",
  "rights": ["right 1", "right 2", "right 3"],
  "deadlines": [{"description": "deadline description", "date": "YYYY-MM-DD or null"}],
  "missing_evidence": ["item 1", "item 2"],
  "case_strength": 75,
  "case_strength_explanation": "brief explanation"
}

Document content:
${documentText.substring(0, 3000)}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Groq API error');
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    return {
      document_type: 'Legal Document',
      plain_summary: text.substring(0, 200),
      rights: [], deadlines: [], missing_evidence: [],
      case_strength: 50, case_strength_explanation: 'Analysis complete',
    };
  }
};

const UploadDocument = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { ts, language } = useLanguage();
  const up = ts('upload');
  const { toast } = useToast();
  const { speak, activeMsgId } = useTextToSpeech();
  const { isMobile } = useResponsive();
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [docHistory, setDocHistory] = useState<DocRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocRecord | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(!isMobile);

  useEffect(() => { loadDocHistory(); }, [user?.id]);

  const loadDocHistory = async () => {
    if (!user?.id) { setLoadingHistory(false); return; }
    setLoadingHistory(true);
    const { data } = await supabase.from('documents').select('*').eq('uploader_id', user.id).order('created_at', { ascending: false });
    if (data) setDocHistory(data as DocRecord[]);
    setLoadingHistory(false);
  };

  const selectDoc = (doc: DocRecord) => {
    setSelectedDoc(doc);
    if (doc.ai_analysis) { setAnalysis(doc.ai_analysis); setUploaded(true); }
    if (isMobile) setHistoryOpen(false);
  };

  const deleteDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document?')) return;
    await supabase.from('documents').delete().eq('id', docId);
    setDocHistory(prev => prev.filter(d => d.id !== docId));
    if (selectedDoc?.id === docId) { setSelectedDoc(null); setAnalysis(null); setUploaded(false); }
    toast({ title: 'Document deleted' });
  };

  const clearSelection = () => { setSelectedDoc(null); setAnalysis(null); setUploaded(false); };

  const processFile = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: up.file_too_large, variant: 'destructive' }); return; }
    setAnalyzing(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('case-documents').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('case-documents').getPublicUrl(path);
      let documentText = `File: ${file.name}, Type: ${file.type}`;
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) documentText = await file.text();
      const aiResult = await analyzeDocumentWithGroq(documentText, language);
      const { data: docData } = await supabase.from('documents').insert({
        uploader_id: user.id, file_name: file.name, file_type: file.type,
        file_url: urlData?.publicUrl || '', ai_analysis: aiResult,
      }).select().single();
      if (docData) { setDocHistory(prev => [docData as DocRecord, ...prev]); setSelectedDoc(docData as DocRecord); }
      setAnalysis(aiResult);
      setUploaded(true);
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = async (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) await processFile(file); };
    input.click();
  };

  const ListenButton: React.FC<{ text: string; id: string }> = ({ text, id }) => (
    <button onClick={() => speak(text, language as any, id)} style={{ border: `1px solid ${activeMsgId === id ? '#c9a227' : colors.border}`, borderRadius: '9999px', padding: '3px 8px', cursor: 'pointer', color: activeMsgId === id ? '#c9a227' : colors.textMuted, background: activeMsgId === id ? 'rgba(201,162,39,0.08)' : 'transparent', fontSize: '11px', fontFamily: 'inherit' }}>
      {activeMsgId === id ? '⏸ Stop' : '🔊 Listen'}
    </button>
  );

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <div style={{ width: isMobile ? (historyOpen ? '100%' : 0) : (historyOpen ? 260 : 0), flexShrink: 0, overflow: 'hidden', transition: 'width 0.2s ease', borderRight: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', position: isMobile ? 'absolute' : 'relative', zIndex: isMobile ? 20 : 'auto', height: '100%', left: 0, top: 0 }}>
        <div style={{ padding: '12px 16px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="text-xs font-body font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Document History</p>
          {isMobile && (
            <button onClick={() => setHistoryOpen(false)} style={{ background: 'none', border: 'none', color: colors.textSecondary, padding: '4px' }}>
              <Trash2 className="w-4 h-4" style={{ display: 'none' }} />
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px 8px' }}>
          {loadingHistory
            ? <div className="flex justify-center py-4"><div className="w-4 h-4 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin" /></div>
            : docHistory.length === 0
              ? <p className="text-xs font-body text-center py-6" style={{ color: colors.textMuted }}>No documents yet</p>
              : docHistory.map(doc => (
                <div key={doc.id} onClick={() => selectDoc(doc)} className="flex items-center justify-between p-2 rounded-lg mb-1 cursor-pointer nyaya-transition" style={{ background: selectedDoc?.id === doc.id ? (isDark ? 'rgba(201,162,39,0.12)' : 'rgba(26,60,94,0.08)') : 'transparent', border: `1px solid ${selectedDoc?.id === doc.id ? (isDark ? 'rgba(201,162,39,0.2)' : 'rgba(26,60,94,0.12)') : 'transparent'}` }}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: colors.textSecondary }} strokeWidth={1.5} />
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium truncate" style={{ color: colors.textSecondary, maxWidth: '130px' }}>{doc.file_name || 'Document'}</p>
                      <p className="text-[10px]" style={{ color: colors.textMuted }}>{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={(e) => deleteDoc(doc.id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <Trash2 className="w-3.5 h-3.5" style={{ color: colors.error }} strokeWidth={1.5} />
                  </button>
                </div>
              ))
          }
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
        <div className="flex items-center justify-between px-3 md:px-6 py-3" style={{ borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <button onClick={() => setHistoryOpen(v => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center nyaya-transition hover:bg-white/10" style={{ border: `1px solid ${colors.border}` }}>
            <FileText className="w-4 h-4" style={{ color: colors.textSecondary }} strokeWidth={1.5} />
          </button>
          <h2 className="font-display font-semibold" style={{ color: colors.textHeading }}>Document Analyzer</h2>
          <div className="w-8" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-6" onClick={() => { if (isMobile && historyOpen) setHistoryOpen(false); }}>
        {analyzing ? (
          <div className="max-w-3xl flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin mb-4" />
            <p className="font-body text-sm" style={{ color: colors.textPrimary }}>{up.analyzing_with_ai}</p>
          </div>
        ) : uploaded && analysis ? (
          <AnalysisResults analysis={analysis} up={up} language={language} ListenButton={ListenButton} onUploadAnother={clearSelection} isDark={isDark} colors={colors} />
        ) : (
          <div className="max-w-3xl">
            {!isMobile && <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: colors.textHeading }}>{up.title}</h2>}
            <motion.div className="p-8 md:p-16 rounded-2xl text-center cursor-pointer nyaya-transition" style={{ border: `2px dashed ${dragging ? colors.gold : colors.border}`, background: dragging ? 'rgba(201,162,39,0.04)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)') }} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={handleFileSelect} whileHover={{ borderColor: '#c9a227' }}>
              <Upload className="w-8 md:w-10 h-8 md:h-10 mx-auto mb-3 md:mb-4" style={{ color: colors.textMuted }} strokeWidth={1.5} />
              <p className="font-body font-semibold text-sm mb-1" style={{ color: colors.textPrimary }}>{up.drop_here}</p>
              <p className="text-xs font-body" style={{ color: colors.textSecondary }}>{up.subtitle}</p>
              <p className="text-xs font-body mt-2" style={{ color: colors.textMuted }}>{up.supported_formats}</p>
            </motion.div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

const AnalysisResults = ({ analysis, up, language, ListenButton, onUploadAnother, isDark, colors }: { analysis: any; up: Record<string, string>; language: string; ListenButton: React.FC<{ text: string; id: string }>; onUploadAnother: () => void; isDark: boolean; colors: any; }) => {
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)';
  const cardBorder = `1px solid ${colors.border}`;
  return (
    <div className="max-w-3xl space-y-4">
      <motion.h2 className="font-display text-xl md:text-2xl font-bold" style={{ color: colors.textHeading }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{up.ai_analysis_complete}</motion.h2>
      <motion.div className="p-4 md:p-5 rounded-xl" style={{ background: cardBg, border: cardBorder }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <p className="text-xs font-body font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>{up.document_type}</p>
        <p className="text-sm font-body" style={{ color: colors.textPrimary }}>{analysis.document_type}</p>
      </motion.div>
      <motion.div className="p-4 md:p-5 rounded-xl" style={{ background: cardBg, border: cardBorder }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <p className="text-xs font-body font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{up.plain_summary}</p>
          <ListenButton text={analysis.plain_summary} id="doc-summary" />
        </div>
        <p className="text-sm font-body" style={{ color: colors.textPrimary }}>{analysis.plain_summary}</p>
      </motion.div>
      {analysis.rights?.length > 0 && (
        <motion.div className="p-4 md:p-5 rounded-xl" style={{ background: cardBg, border: cardBorder }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-body font-semibold uppercase tracking-wider" style={{ color: '#0a9e6e' }}>{up.your_rights}</p>
            <ListenButton text={analysis.rights.join('. ')} id="doc-rights" />
          </div>
          {analysis.rights.map((r: string, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#0a9e6e' }} strokeWidth={1.5} />
              <p className="text-sm font-body" style={{ color: colors.textSecondary }}>{r}</p>
            </div>
          ))}
        </motion.div>
      )}
      {analysis.deadlines?.length > 0 && (
        <motion.div className="p-4 md:p-5 rounded-xl" style={{ background: cardBg, border: cardBorder }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <p className="text-xs font-body font-semibold uppercase tracking-wider mb-3" style={{ color: '#ef4444' }}>{up.deadlines}</p>
          {analysis.deadlines.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} strokeWidth={1.5} />
              <p className="text-sm font-body" style={{ color: colors.textSecondary }}>{typeof d === 'string' ? d : <>{d.description} — <strong>{d.date}</strong></>}</p>
            </div>
          ))}
        </motion.div>
      )}
      {analysis.missing_evidence?.length > 0 && (
        <motion.div className="p-4 md:p-5 rounded-xl" style={{ background: cardBg, border: cardBorder }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <p className="text-xs font-body font-semibold uppercase tracking-wider mb-3" style={{ color: '#f97316' }}>{up.evidence_gap}</p>
          {analysis.missing_evidence.map((m: string, i: number) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#f97316' }} strokeWidth={1.5} />
              <p className="text-sm font-body" style={{ color: colors.textSecondary }}>{m}</p>
            </div>
          ))}
        </motion.div>
      )}
      <motion.div className="p-4 md:p-6 rounded-xl flex items-center gap-4" style={{ background: cardBg, border: cardBorder }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
        <div className="relative w-16 md:w-20 h-16 md:h-20 flex-shrink-0">
          <svg className="w-16 md:w-20 h-16 md:h-20 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={colors.border} strokeWidth="3" />
            <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0a9e6e" strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: `${analysis.case_strength || 0}, 100` }} transition={{ duration: 1.5, ease: 'easeOut' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono font-bold text-base md:text-lg" style={{ color: colors.textPrimary }}><CountUp end={analysis.case_strength || 0} suffix="%" /></span>
          </div>
        </div>
        <div>
          <p className="text-sm font-body font-semibold" style={{ color: colors.textPrimary }}>{up.case_strength_score}</p>
          <p className="text-xs font-body" style={{ color: colors.textSecondary }}>{analysis.case_strength_explanation}</p>
        </div>
      </motion.div>
      <motion.button className="w-full py-3 rounded-xl font-body font-semibold text-sm btn-shine" style={{ background: '#c9a227', color: '#fff' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onUploadAnother}>
        {up.upload_another}
      </motion.button>
    </div>
  );
};

export default UploadDocument;
