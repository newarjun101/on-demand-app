export function formatMmk(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `${amount.toLocaleString('en-US')} MMK`;
}

// Backend's base URL (without /api) for absolute paths to uploaded files.
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/api$/, '') || 'http://localhost:4000';

// Turn a stored image URL into something the browser can fetch.
//   "/uploads/..." -> "http://localhost:4000/uploads/..."
//   "https://..."  -> as-is
//   undefined      -> undefined
export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString();
}

export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}