import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, LockOpen, Upload, CheckCircle, ArrowLeft, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Props { onClose: () => void; }

const generateAnonymousSummaryWithGroq = async (description: string, category: string, city: string, language: string = 'English'): Promise<string> => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a legal assistant helping victims of ${category} cases in India.

Rewrite this as an anonymized case summary meeting these rules:
1. Removes ALL identifying information (names, addresses, specific dates, phone numbers)
2. Keeps the legal facts and rights violations intact
3. Is written in third person
4. Is 3-5 sentences long
5. Ends with the main legal remedy being sought

CRITICAL INSTRUCTION: Generate the entire legal summary STRICTLY in ${language}. Do not use English if ${language} is not English. Translate the category and all context into ${language}. Maintain professional legal clarity, natural phrasing, and readability strictly in ${language}.

Original description: "${description}"
Category: ${category}, City/Region: ${city}

Write ONLY the anonymized summary in ${language}. No preamble or translation notes.`
      }],
      temperature: 0.4,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Groq API error');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || description;
};

const verifyFIRLocally = (firNumber: string): boolean => /^\d{4}-[A-Z]{2,10}-\d{1,6}$/i.test(firNumber.trim());

const locRaw = {
  English: {
    title: "Anonymous Case Posting",
    hasFirQ: "Do you have an FIR for your case?",
    yesFir: "Yes, I have FIR",
    noFir: "No FIR yet",
    enterFir: "Enter your FIR number",
    firFormat: "Format: YYYY-CITY-NUMBER (e.g. 2024-HYD-441)",
    firInvalid: "Invalid FIR format. Use: YYYY-CITY-NUMBER",
    firFailed: "Verification failed.",
    verifyFirBtn: "Verify FIR",
    verifying: "Verifying...",
    firVerified: "FIR Verified!",
    selectCatQ: "Select category and describe your case",
    descPlaceholder: "Describe what happened...",
    uploadOptional: "Upload evidence (optional)",
    genSummaryBtn: "Generate Anonymous Summary",
    aiGenerating: "AI is generating anonymous summary...",
    aiFailed: "Failed to generate summary.",
    aiSummaryLabel: "AI Anonymous Summary",
    postBtn: "Post Anonymously",
    posting: "Posting...",
    postFailed: "Failed to post case.",
    successTitle: "Case Posted Anonymously!",
    lawyersCanSee: "Lawyers can now see your case and offer help",
    close: "Close",
    back: "Back",
    caseWord: "Case"
  },
  Telugu: {
    title: "అజ్ఞాత కేసు పోస్టింగ్",
    hasFirQ: "మీ కేసుకు సంబంధించి మీ వద్ద FIR ఉందా?",
    yesFir: "అవును, FIR ఉంది",
    noFir: "ఇంకా FIR లేదు",
    enterFir: "మీ FIR నంబర్ నమోదు చేయండి",
    firFormat: "నమూనా: YYYY-CITY-NUMBER (ఉదా. 2024-HYD-441)",
    firInvalid: "చెల్లని FIR ఫార్మాట్. నమూనా: YYYY-CITY-NUMBER",
    firFailed: "ధృవీకరణ విఫలమైంది.",
    verifyFirBtn: "FIR ధృవీకరించు",
    verifying: "ధృవీకరిస్తోంది...",
    firVerified: "FIR ధృవీకరించబడింది!",
    selectCatQ: "కేటగిరీని ఎంచుకుని మీ కేసును వివరించండి",
    descPlaceholder: "ఏమి జరిగిందో వివరించండి...",
    uploadOptional: "ఆధారాలు అప్‌లోడ్ చేయండి (ఐచ్ఛికం)",
    genSummaryBtn: "అజ్ఞాత సారాంశాన్ని రూపొందించు",
    aiGenerating: "AI అజ్ఞాత సారాంశాన్ని రూపొందిస్తోంది...",
    aiFailed: "సారాంశం రూపొందించడం విఫలమైంది.",
    aiSummaryLabel: "AI అజ్ఞాత సారాంశం",
    postBtn: "అజ్ఞాతంగా పోస్ట్ చేయండి",
    posting: "పోస్ట్ చేయబడుతోంది...",
    postFailed: "కేసు పోస్ట్ చేయడం విఫలమైంది.",
    successTitle: "కేసు అజ్ఞాతంగా పోస్ట్ చేయబడింది!",
    lawyersCanSee: "న్యాయవాదులు ఇప్పుడు మీ కేసును చూసి సహాయం అందించగలరు",
    close: "మూసివేయు",
    back: "వెనుకకు",
    caseWord: "కేసు"
  }
};

const catMap = [
  { en: 'Tenant Rights', te: 'అద్దెదారుల హక్కులు' },
  { en: 'Labor Law', te: 'కార్మిక చట్టం' },
  { en: 'Domestic Violence', te: 'గృహ హింస' },
  { en: 'Criminal', te: 'క్రిమినల్' },
  { en: 'Consumer Rights', te: 'వినియోగదారుల హక్కులు' },
  { en: 'Property', te: 'ఆస్తి' },
  { en: 'Education', te: 'విద్య' },
  { en: 'Other', te: 'ఇతర' }
];

const AnonymousCasePosting = ({ onClose }: Props) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [hasFIR, setHasFIR] = useState<boolean | null>(null);
  const [firNumber, setFirNumber] = useState('');
  const [firVerified, setFirVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [processing, setProcessing] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [locked, setLocked] = useState(false);

  const t = locRaw[language as keyof typeof locRaw] || locRaw.English;
  const isTelugu = language === 'Telugu';

  useEffect(() => { if (step === 4 && !processing && !aiSummary) generateSummary(); }, [step]);

  const verifyFIR = async () => {
    setVerifying(true);
    try {
      if (verifyFIRLocally(firNumber)) { setFirVerified(true); setLocked(true); setTimeout(() => setStep(3), 1000); }
      else toast({ title: t.firInvalid, variant: 'destructive' });
    } catch { toast({ title: t.firFailed, variant: 'destructive' }); }
    finally { setVerifying(false); }
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!user) return;
    for (const file of Array.from(fileList)) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('case-documents').upload(path, file);
      if (!error) { const { data } = supabase.storage.from('case-documents').getPublicUrl(path); setFiles(prev => [...prev, { name: file.name, url: data.publicUrl }]); }
    }
  };

  const generateSummary = async () => {
    setProcessing(true);
    try {
      const catLabel = isTelugu ? catMap.find(c => c.en === category)?.te || category : category;
      const summary = await generateAnonymousSummaryWithGroq(description, catLabel, user?.city || 'India', language);
      setAiSummary(summary); setStep(5);
    } catch { toast({ title: t.aiFailed, variant: 'destructive' }); }
    finally { setProcessing(false); }
  };

  const postCase = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const catLabel = isTelugu ? catMap.find(c => c.en === category)?.te || category : category;
      const { data, error } = await supabase.from('cases').insert({ victim_id: user.id, title: `${catLabel} ${t.caseWord}`, category, description, fir_number: firNumber || null, fir_verified: firVerified, is_anonymous: true, ai_summary: aiSummary, status: 'open' }).select().single();
      if (error) throw error;
      if (data) setCaseId(data.id);
      setStep(6);
    } catch { toast({ title: t.postFailed, variant: 'destructive' }); }
    finally { setProcessing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <motion.div className="w-full max-w-lg glass-card rounded-2xl p-6 relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-2 mb-6"><Shield className="w-5 h-5 text-nyaya-gold" /><h2 className="font-display font-bold text-lg">{t.title}</h2></div>
        <div className="flex gap-1 mb-6">{[1,2,3,4,5,6].map(s => <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ background: step >= s ? '#c9a227' : 'rgba(255,255,255,0.1)' }} />)}</div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="font-body text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.hasFirQ}</p>
              <div className="flex gap-3">
                <button onClick={() => { setHasFIR(true); setStep(2); }} className="flex-1 py-3 rounded-xl font-body text-sm font-semibold border border-nyaya-gold/30 hover:bg-nyaya-gold/10 transition-all">{t.yesFir}</button>
                <button onClick={() => { setHasFIR(false); setStep(3); }} className="flex-1 py-3 rounded-xl font-body text-sm font-semibold border border-white/10 hover:bg-white/5 transition-all">{t.noFir}</button>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="font-body text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.enterFir}</p>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.firFormat}</p>
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {locked ? <Lock className="w-4 h-4 text-nyaya-gold" /> : <LockOpen className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                <input value={firNumber} onChange={e => setFirNumber(e.target.value.toUpperCase())} disabled={locked} placeholder="2024-HYD-441" className="flex-1 bg-transparent outline-none font-mono text-sm" />
              </div>
              {firVerified ? <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle className="w-4 h-4" /><span>{t.firVerified}</span></div>
                : <button onClick={verifyFIR} disabled={verifying || !firNumber} className="w-full py-3 rounded-xl font-body text-sm font-semibold btn-shine" style={{ background: '#c9a227', color: '#fff', opacity: !firNumber ? 0.5 : 1 }}>{verifying ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />{t.verifying}</> : t.verifyFirBtn}</button>}
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="font-body text-sm mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.selectCatQ}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {catMap.map(cat => <button key={cat.en} onClick={() => setCategory(cat.en)} className="py-2 px-3 rounded-lg text-xs font-body transition-all" style={{ background: category === cat.en ? 'rgba(201,162,39,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${category === cat.en ? '#c9a227' : 'rgba(255,255,255,0.1)'}`, color: category === cat.en ? '#c9a227' : 'rgba(255,255,255,0.7)' }}>{isTelugu ? cat.te : cat.en}</button>)}
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.descPlaceholder} rows={4} className="w-full p-3 rounded-xl text-sm font-body outline-none resize-none mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-nyaya-gold/50 transition-all mb-4" style={{ borderColor: 'rgba(255,255,255,0.15)' }} onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.onchange = (e) => { const fl = (e.target as HTMLInputElement).files; if (fl) handleFileUpload(fl); }; i.click(); }}>
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <p className="text-xs font-body" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.uploadOptional}</p>
              </div>
              {files.length > 0 && <div className="space-y-1 mb-3">{files.map((f, i) => <div key={i} className="text-xs font-body flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}><CheckCircle className="w-3 h-3 text-green-400" />{f.name}</div>)}</div>}
              <button onClick={() => setStep(4)} disabled={!category || !description} className="w-full py-3 rounded-xl font-body text-sm font-semibold btn-shine" style={{ background: '#c9a227', color: '#fff', opacity: !category || !description ? 0.5 : 1 }}>{t.genSummaryBtn}</button>
            </motion.div>
          )}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-10 h-10 rounded-full border-2 border-nyaya-gold border-t-transparent animate-spin mb-4" />
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.aiGenerating}</p>
              </div>
            </motion.div>
          )}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.aiSummaryLabel}</p>
              <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.8)' }}>{aiSummary}</p>
              </div>
              <button onClick={postCase} disabled={processing} className="w-full py-3 rounded-xl font-body text-sm font-semibold btn-shine" style={{ background: '#c9a227', color: '#fff' }}>{processing ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />{t.posting}</> : t.postBtn}</button>
            </motion.div>
          )}
          {step === 6 && (
            <motion.div key="s6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(10,158,110,0.15)' }}><CheckCircle className="w-7 h-7" style={{ color: '#0a9e6e' }} /></div>
              <h3 className="font-display font-bold text-lg mb-2">{t.successTitle}</h3>
              <p className="text-sm font-body mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Case ID: <span className="font-mono text-nyaya-gold">{caseId.substring(0, 8)}...</span></p>
              <p className="text-xs font-body mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.lawyersCanSee}</p>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-body text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>{t.close}</button>
            </motion.div>
          )}
        </AnimatePresence>
        {step > 1 && step < 6 && <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-xs font-body mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}><ArrowLeft className="w-3 h-3" /> {t.back}</button>}
      </motion.div>
    </div>
  );
};

export default AnonymousCasePosting;
