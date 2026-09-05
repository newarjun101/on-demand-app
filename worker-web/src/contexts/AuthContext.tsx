import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, userApi } from '@/api/endpoints';
import { User, WorkerProfile } from '@/types';
import { setAccessToken, setRefreshToken, clearTokens, getAccessToken } from '@/api/client';

interface AuthContextValue {
  user: User | null;
  profile: WorkerProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: { fullName: string; email?: string; phone?: string; password: string; city?: string; experienceYears?: number; addressLine?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    userApi.me()
      .then((u) => {
        setUser(u);
        setProfile((u as any).workerProfile ?? null);
      })
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const res = await authApi.login(identifier, password);
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    setUser(res.user);
    await refresh();
  }

  async function register(input: { fullName: string; email?: string; phone?: string; password: string; city?: string; experienceYears?: number; addressLine?: string }) {
    const res = await authApi.register(input);
    setAccessToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    setUser(res.user);
    await refresh();
  }

  async function logout() {
    try { await authApi.logout(); } catch {}
    clearTokens();
    setUser(null);
    setProfile(null);
  }

  async function refresh() {
    const u = await userApi.me();
    setUser(u);
    setProfile((u as any).workerProfile ?? null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}