import { useState, useEffect, useRef } from 'react';
 
const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY;
 
export const useTextToSpeech = () => {
  const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
  const [isSupported] = useState(typeof window !== 'undefined' && 'speechSynthesis' in window);
  const isSpeakingRef = useRef(false);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const currentMsgIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
 
  useEffect(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  }, []);
 
  const getBestVoice = (language: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    if (language === 'Hindi') {
      return voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi')) || null;
    }
    return (
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0] ||
      null
    );
  };
 
  const getLangCode = (language: string): string => {
    if (language === 'Hindi') return 'hi-IN';
    return 'en-IN';
  };
 
  const getRate = (language: string): number => {
    if (language === 'Hindi') return 0.88;
    return 0.92;
  };
 
  const splitIntoChunks = (text: string, maxLen = 150): string[] => {
    const cleaned = text.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '').trim();
    const sentences = cleaned.match(/[^।\.!\?\n]+[।\.!\?\n]*/g) || [cleaned];
    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if ((current + sentence).length > maxLen) {
        if (current.trim()) chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(c => c.length > 0);
  };
 
  // ── Google Cloud TTS for Telugu ───────────────────────────────────────────
  const speakTeluguViaGoogleTTS = async (chunks: string[], messageId: string) => {
    for (let i = 0; i < chunks.length; i++) {
      if (currentMsgIdRef.current !== messageId) return;
 
      try {
        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: chunks[i] },
              voice: {
                languageCode: 'te-IN',
                name: 'te-IN-Standard-A',
                ssmlGender: 'FEMALE',
              },
              audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9,
                pitch: 0,
              },
            }),
          }
        );
 
        if (!response.ok) {
          console.error('Google TTS error:', await response.text());
          continue;
        }
 
        const data = await response.json();
 
        await new Promise<void>((resolve) => {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
          audioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
 
      } catch (err) {
        console.error('Telugu TTS chunk failed:', err);
      }
 
      await new Promise(r => setTimeout(r, 150));
    }
 
    if (currentMsgIdRef.current === messageId) {
      isSpeakingRef.current = false;
      currentMsgIdRef.current = null;
      setActiveMsgId(null);
    }
  };
 
  // ── Web Speech API for Hindi / English ───────────────────────────────────
  const speakChunk = (chunk: string, language: string, messageId: string) => {
    if (!window.speechSynthesis) return;
    if (currentMsgIdRef.current !== messageId) return;
 
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = getLangCode(language);
    utterance.rate = getRate(language);
    utterance.pitch = 1;
    utterance.volume = 1;
 
    const voice = getBestVoice(language);
    if (voice) utterance.voice = voice;
 
    utterance.onend = () => {
      if (currentMsgIdRef.current !== messageId) return;
      chunkIndexRef.current += 1;
      if (chunkIndexRef.current < chunksRef.current.length) {
        setTimeout(() => speakChunk(chunksRef.current[chunkIndexRef.current], language, messageId), 100);
      } else {
        isSpeakingRef.current = false;
        currentMsgIdRef.current = null;
        setActiveMsgId(null);
      }
    };
 
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      currentMsgIdRef.current = null;
      setActiveMsgId(null);
    };
 
    window.speechSynthesis.speak(utterance);
  };
 
  const speak = (text: string, language: string, messageId: string) => {
    if (activeMsgId === messageId) {
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      isSpeakingRef.current = false;
      currentMsgIdRef.current = null;
      setActiveMsgId(null);
      return;
    }
 
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    isSpeakingRef.current = false;
    currentMsgIdRef.current = null;
 
    if (!text?.trim()) return;
 
    const chunks = splitIntoChunks(text);
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    currentMsgIdRef.current = messageId;
    setActiveMsgId(messageId);
    isSpeakingRef.current = true;
 
    if (language === 'Telugu') {
      speakTeluguViaGoogleTTS(chunks, messageId);
      return;
    }
 
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener(
        'voiceschanged',
        () => speakChunk(chunksRef.current[0], language, messageId),
        { once: true }
      );
    } else {
      speakChunk(chunks[0], language, messageId);
    }
  };
 
  const stop = () => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    isSpeakingRef.current = false;
    currentMsgIdRef.current = null;
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    setActiveMsgId(null);
  };
 
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); }
    };
  }, []);
 
  return {
    speak,
    stop,
    activeMsgId,
    isSupported,
    isSpeaking: isSpeakingRef.current,
  };
};