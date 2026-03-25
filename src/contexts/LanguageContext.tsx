import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageCode, LANGUAGES } from '@/config/languages';
import { supabase } from '@/integrations/supabase/client';
import { translations } from '@/i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (section: string, key: string) => string;
  ts: (section: string) => Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('nyaya_language') as LanguageCode;
    return (saved && LANGUAGES[saved]) ? saved : 'English';
  });

  useEffect(() => {
    const profileLang = user?.preferred_language as LanguageCode;
    if (profileLang && LANGUAGES[profileLang]) {
      setLanguageState(profileLang);
      localStorage.setItem('nyaya_language', profileLang);
    }
  }, [user?.preferred_language]);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('nyaya_language', lang);
    if (user?.id) {
      await supabase.from('users').update({ preferred_language: lang }).eq('id', user.id);
    }
  }, [user?.id]);

  const t = useCallback((section: string, key: string): string => {
    return (translations as any)[language]?.[section]?.[key]
      || (translations as any)['English']?.[section]?.[key]
      || key;
  }, [language]);

  const ts = useCallback((section: string): Record<string, string> => {
    const langSection = (translations as any)[language]?.[section];
    const fallback = (translations as any)['English']?.[section];
    return { ...fallback, ...langSection };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, ts }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
