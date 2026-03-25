import { useState, useRef, useCallback, useEffect } from 'react';
import { LanguageCode, LANGUAGES } from '@/config/languages';

interface UseSpeechToTextProps {
  language: LanguageCode;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export const useSpeechToText = ({ language, onTranscript, onError }: UseSpeechToTextProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Voice input is not supported in this browser. Please use Chrome.');
      return;
    }

    navigator.mediaDevices?.getUserMedia({ audio: true }).catch(() => {
      onError?.('Microphone access denied. Please allow microphone in browser settings.');
    });

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = LANGUAGES[language].speechCode;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    finalTranscriptRef.current = '';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          finalTranscriptRef.current = finalTranscript;
          onTranscript(finalTranscript.trim(), true);
        } else {
          interimTranscript += transcript;
          onTranscript((finalTranscript + interimTranscript).trim(), false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone permission denied.',
        'no-speech': 'No speech detected. Please speak clearly.',
        'network': 'Network error. Check your internet connection.',
        'audio-capture': 'No microphone found.',
      };
      onError?.(errorMessages[event.error] || `Voice error: ${event.error}`);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, onTranscript, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return { isListening, isSupported, toggleListening, startListening, stopListening };
};
