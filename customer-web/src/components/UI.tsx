import * as React from 'react';
import { ReactNode, forwardRef } from 'react';
import clsx from 'clsx';
import { resolveImageUrl } from '@/utils/format';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
    secondary: 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-800',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  } as const;
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  } as const;
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={clsx('bg-white rounded-2xl shadow-sm border border-gray-100', onClick && 'cursor-pointer hover:border-brand-300 transition', className)}>
      {children}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  function Input({ label, error, className, ...rest }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          ref={ref}
          {...rest}
          className={clsx(
            'w-full px-3.5 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error ? 'border-red-400' : 'border-gray-300',
            className,
          )}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  function Textarea({ label, error, className, ...rest }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <textarea
          ref={ref}
          {...rest}
          className={clsx(
            'w-full px-3.5 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error ? 'border-red-400' : 'border-gray-300',
            className,
          )}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: { value: string; label: string }[] }>(
  function Select({ label, error, options, className, ...rest }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <select
          ref={ref}
          {...rest}
          className={clsx(
            'w-full px-3.5 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white',
            error ? 'border-red-400' : 'border-gray-300',
            className,
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  },
);

export function Badge({ children, color = 'primary' }: { children: ReactNode; color?: 'primary' | 'green' | 'gray' | 'yellow' | 'red' }) {
  const colors = {
    primary: 'bg-brand-100 text-brand-700',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
  } as const;
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colors[color])}>
      {children}
    </span>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-current"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('bg-gray-200 rounded animate-pulse', className)} />;
}

export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 bg-white rounded-2xl border border-gray-100">
      {icon && <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Avatar({ src, name, size = 40 }: { src: string | null | undefined; name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
  const resolved = resolveImageUrl(src);
  return resolved ? (
    <img src={resolved} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover bg-gray-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size / 2.5 }}
      className="rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold"
    >
      {initials}
    </div>
  );
}

export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="inline-flex items-center">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < Math.round(value) ? '#facc15' : '#e5e7eb'}
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}