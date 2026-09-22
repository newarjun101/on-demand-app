import axios from 'axios';
const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';
export const ACCESS_TOKEN_KEY = 'lsm_admin_access_token';
export const REFRESH_TOKEN_KEY = 'lsm_admin_refresh_token';
function getAcceptLanguage(): string { if (typeof window === 'undefined') return 'en'; return localStorage.getItem('lsm_admin_locale') || 'en'; }
export function getAccessToken(): string | null { return localStorage.getItem(ACCESS_TOKEN_KEY); }
export function setAccessToken(t: string | null) { if (t) localStorage.setItem(ACCESS_TOKEN_KEY, t); else localStorage.removeItem(ACCESS_TOKEN_KEY); }
export function setRefreshToken(t: string | null) { if (t) localStorage.setItem(REFRESH_TOKEN_KEY, t); else localStorage.removeItem(REFRESH_TOKEN_KEY); }
export function clearTokens() { setAccessToken(null); setRefreshToken(null); }
export const apiClient = axios.create({ baseURL: API });
let isRefreshing = false;
let pending: Array<(t: string) => void> = [];
apiClient.interceptors.request.use((c) => {
  const t = getAccessToken();
  if (t) c.headers!.Authorization = `Bearer ${t}`;
  (c.headers as any)['Accept-Language'] = getAcceptLanguage();
  (c.headers as any)['X-App-Origin'] = 'ADMIN_WEB';
  return c;
});
apiClient.interceptors.response.use(
  (r) => r,
  async (err: any) => {
    const original = err.config;
    if (err.response?.status === 401 && !original?._retry && getAccessToken()) {
      if (isRefreshing) return new Promise((res) => pending.push((t) => { original.headers.Authorization = `Bearer ${t}`; res(apiClient(original)); }));
      original._retry = true;
      isRefreshing = true;
      try {
        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${API}/auth/refresh`, { refreshToken: refresh }, { headers: { 'X-App-Origin': 'ADMIN_WEB' } });
        setAccessToken(data.data.accessToken);
        setRefreshToken(data.data.refreshToken);
        pending.forEach((cb) => cb(data.data.accessToken));
        pending = [];
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch (e) { clearTokens(); pending = []; window.location.href = '/login'; return Promise.reject(e); }
      finally { isRefreshing = false; }
    }
    return Promise.reject(err);
  },
);
export function extractError(err: any): string {
  const details = err?.response?.data?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const f = details[0];
    const path = Array.isArray(f.path) ? f.path.join('.') : 'value';
    return `${path}: ${f.message}`;
  }
  return err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';
}
