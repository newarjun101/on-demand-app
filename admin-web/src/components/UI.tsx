import { ReactNode, forwardRef, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useI18n, LOCALES, LocaleCode } from '@/i18n';
import { Globe, Check, Bell as BellIcon, Star as StarIcon } from 'lucide-react';

export const Bell = BellIcon;
export const Star = StarIcon;
export function Avatar({ src, name, size = 32 }: { src?: string | null; name?: string | null; size?: number }) {
  const initials = (name || '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
  const url = src && src.startsWith('/') ? `${(import.meta.env.VITE_API_URL as string)?.replace(/\/api$/, '') || ''}${src}` : src;
  return url ? (
    <img src={url} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover bg-gray-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <div style={{ width: size, height: size, fontSize: size / 2.5 }} className="rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
      {initials}
    </div>
  );
}
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
export const Button = forwardRef<HTMLButtonElement, {
  children: ReactNode; variant?: ButtonVariant; size?: ButtonSize; className?: string; loading?: boolean; [k: string]: any;
}>(function Button({ children, variant = 'primary', size = 'md', className, loading, ...rest }, ref) {
  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    secondary: 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-800',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  };
  const sizes: Record<string, string> = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button ref={ref} disabled={loading || rest.disabled} className={clsx('inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed', (variants as any)[variant] || variants.primary, (sizes as any)[size] || sizes.md, className)} {...rest}>
      {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" /><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>}
      {children}
    </button>
  );
});
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm', onClick && 'cursor-pointer hover:border-indigo-300 transition', className)}>{children}</div>;
}
type BadgeColor = 'gray' | 'green' | 'red' | 'yellow' | 'indigo' | 'blue';
export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: BadgeColor }) {
  const c: Record<BadgeColor, string> = {
    gray: 'bg-gray-100 text-gray-700', green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700', indigo: 'bg-indigo-100 text-indigo-700', blue: 'bg-blue-100 text-blue-700',
  };
  return <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', c[color])}>{children}</span>;
}
export function StatCard({ label, value, icon: Icon, delta, color = 'indigo' }: { label: string; value: string | number; icon: any; delta?: string; color?: BadgeColor }) {
  const c: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600', yellow: 'bg-yellow-50 text-yellow-600', blue: 'bg-blue-50 text-blue-600', gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          {delta && <div className="text-xs text-gray-500 mt-1">{delta}</div>}
        </div>
        {Icon && <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', c[color] || c.indigo)}><Icon size={18} /></div>}
      </div>
    </Card>
  );
}
export function EmptyState({ title, description, action, icon: Icon }: { title: string; description?: string; action?: ReactNode; icon?: any }) {
  return (
    <Card className="p-12 text-center">
      {Icon && <Icon size={40} className="mx-auto text-gray-400 mb-3" />}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin text-current" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
export function Skeleton({ className }: { className?: string }) { return <div className={clsx('bg-gray-200 rounded animate-pulse', className)} />; }
export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  const { label, error, className, ...rest } = props;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input {...rest} className={clsx('w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-indigo-500', error ? 'border-red-400' : 'border-gray-300', className)} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: { value: string; label: string }[] }) {
  const { label, error, className, options, ...rest } = props;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select {...rest} className={clsx('w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-indigo-500', error ? 'border-red-400' : 'border-gray-300', className)}>
        {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  const { label, error, className, ...rest } = props;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea {...rest} className={clsx('w-full px-3.5 py-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-indigo-500', error ? 'border-red-400' : 'border-gray-300', className)} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 border border-gray-200">
        <Globe size={14} /><span>{current.flag} {current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {LOCALES.map((l) => (
            <button key={l.code} onClick={() => { setLocale(l.code as LocaleCode); setOpen(false); }} className={clsx('w-full text-left flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50', locale === l.code && 'bg-indigo-50 text-indigo-700')}>
              <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.label}</span></span>
              {locale === l.code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
