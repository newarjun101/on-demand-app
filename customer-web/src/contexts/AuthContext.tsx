import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, userApi } from '@/api/endpoints';
import { User } from '@/types';
import { setAccessToken, setRefreshToken, clearTokens, getAccessToken } from '@/api/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: { fullName: string; email?: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    userApi.me()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const res = await authApi.login(identifier, password);
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    setUser(res.user);
  }

  async function register(input: { fullName: string; email?: string; phone?: string; password: string }) {
    const res = await authApi.register({ role: 'CUSTOMER', ...input });
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    setUser(res.user);
  }

  async function logout() {
    try { await authApi.logout(); } catch {}
    clearTokens();
    setUser(null);
  }

  async function refreshUser() {
    const u = await userApi.me();
    setUser(u);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}