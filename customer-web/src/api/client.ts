import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';

export const ACCESS_TOKEN_KEY = 'lsm_customer_access_token';
export const REFRESH_TOKEN_KEY = 'lsm_customer_refresh_token';

function getAcceptLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('lsm_locale') || 'en';
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'X-App-Origin': 'CUSTOMER_WEB' },
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Tell the backend which language the user is using
  config.headers['Accept-Language'] = getAcceptLanguage();
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<any>) => {
    const original: any = err.config;
    if (err.response?.status === 401 && !original?._retry && getAccessToken()) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true, headers: { 'X-App-Origin': 'CUSTOMER_WEB' } },
        );
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        setAccessToken(newAccess);
        setRefreshToken(newRefresh);
        pendingRequests.forEach((cb) => cb(newAccess));
        pendingRequests = [];
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch (refreshErr) {
        clearTokens();
        pendingRequests = [];
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    const message = err.response?.data?.error?.message ?? 'Something went wrong';
    // Do not toast globally — each call site is responsible for showing errors
    // so we don't end up with duplicate toasts.
    return Promise.reject(err);
  },
);

export function extractData<T>(res: any): T {
  return res.data.data as T;
}

export function extractError(err: any): string {
  // Prefer a field-specific message from Zod validation
  const details = err?.response?.data?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const first = details[0];
    const path = Array.isArray(first.path) ? first.path.join('.') : '';
    const msg = first.message ?? 'Invalid value';
    return path ? `${path}: ${msg}` : msg;
  }
  return err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';
}

export { setAccessToken, setRefreshToken };