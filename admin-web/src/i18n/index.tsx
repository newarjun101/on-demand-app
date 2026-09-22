// Single-file i18n with 5 locales. Use en.json as the canonical source.
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
const TR: Record<LocaleCode, any> = { en, zh, my, th, hi };
const STORAGE = 'lsm_admin_locale';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
const Ctx = createContext<any>(undefined);
function resolveKey(t: any, k: string): string | undefined {
  if (!k || typeof k !== 'string') return undefined;
  const parts = k.split('.');
  let cur = t;
  for (const p of parts) { if (cur == null) return undefined; cur = cur[p]; }
  return typeof cur === 'string' ? cur : undefined;
}
function interp(s: string, vars?: Record<string, any>): string {
  if (!vars) return s;
  return s.replace(/\{\{(\w+)\}\}/g, (_, n) => (vars[n] == null ? '' : String(vars[n])));
}
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    if (typeof window === 'undefined') return 'en';
    const s = localStorage.getItem(STORAGE) as LocaleCode | null;
    if (s && TR[s]) return s;
    return 'en';
  });
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  function setLocale(l: LocaleCode) {
    if (!TR[l]) return;
    setLocaleState(l);
    try { localStorage.setItem(STORAGE, l); } catch {}
  }
  function t(key: string, vars?: Record<string, any>): string {
    if (!key || typeof key !== 'string') return '';
    const cur = resolveKey(TR[locale], key);
    if (cur != null) return interp(cur, vars);
    const fb = resolveKey(TR.en, key);
    if (fb != null) return interp(fb, vars);
    return key;
  }
  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}
export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n must be used within I18nProvider');
  return c;
}
