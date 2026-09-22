import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import en from './locales/en.json';
import zh from './locales/zh.json';
import my from './locales/my.json';
import th from './locales/th.json';
import hi from './locales/hi.json';

export type LocaleCode = 'en' | 'zh' | 'my' | 'th' | 'hi';

export const LOCALES: { code: LocaleCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'my', label: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

const TRANSLATIONS: Record<LocaleCode, any> = { en, zh, my, th, hi };

const STORAGE_KEY = 'lsm_locale';
const DEFAULT_LOCALE: LocaleCode = 'en';

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveKey(translations: any, key: string): string | undefined {
  const parts = key.split('.');
  let cur: any = translations;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const v = vars[name];
    return v == null ? '' : String(v);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
    if (saved && TRANSLATIONS[saved]) return saved;
    return DEFAULT_LOCALE;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: LocaleCode) {
    if (!TRANSLATIONS[l]) return;
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    // Try current locale, then English, then the raw key.
    const cur = resolveKey(TRANSLATIONS[locale], key);
    if (cur != null) return interpolate(cur, vars);
    const fallback = resolveKey(TRANSLATIONS.en, key);
    if (fallback != null) return interpolate(fallback, vars);
    return key;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
