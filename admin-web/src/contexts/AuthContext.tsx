import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiClient, setAccessToken, setRefreshToken, clearTokens, getAccessToken, extractError } from '@/api/client';

export interface AdminUser {
  id: string; email: string | null; phone: string | null; fullName: string;
  avatarUrl: string | null; role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  isActive: boolean; isBanned: boolean; createdAt: string;
  roles: { id: string; slug: string; name: string }[]; permissions: string[];
}

interface AdminAuthCtx {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: Set<string>;
  hasPermission: (k: string) => boolean;
  login: (identifier: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AdminAuthCtx | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const t = getAccessToken();
    if (!t) { setIsLoading(false); return; }
    try {
      const r = await apiClient.get('/admin/me');
      const u = r.data?.data;
      if (u) setUser(u);
      else { clearTokens(); setUser(null); }
    } catch { clearTokens(); setUser(null); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const permissions = new Set<string>(user?.permissions || []);
  function hasPermission(k: string) {
    return permissions.has(k) || permissions.has('*') || user?.role === 'ADMIN';
  }

  async function login(identifier: string, password: string): Promise<AdminUser> {
    const res = await apiClient.post('/auth/login', { identifier, password });
    const env = res.data;
    if (!env?.success || !env?.data?.user) {
      throw new Error(extractError({ response: res }));
    }
    const { user: u, accessToken, refreshToken } = env.data;
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(u);
    return u;
  }

  async function logout() {
    clearTokens();
    setUser(null);
  }

  async function refresh() { await load(); }

  return (
    <Ctx.Provider value={{ user, isLoading, isAuthenticated: !!user, permissions, hasPermission, login, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return c;
}
