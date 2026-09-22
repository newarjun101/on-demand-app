import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useI18n, LOCALES, LocaleCode } from '@/i18n';
import clsx from 'clsx';

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
        aria-label="Switch language"
      >
        <Globe size={14} />
        <span>{current.flag} {current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLocale(l.code as LocaleCode); setOpen(false); }}
              className={clsx(
                'w-full text-left flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50',
                locale === l.code && 'bg-brand-50 text-brand-700',
              )}
            >
              <span className="flex items-center gap-2">
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </span>
              {locale === l.code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}