import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authLogout, doRefresh } from '../lib/api';
import { invalidateOnLogout } from '../lib/dataService';
import { setToken, clearToken, getToken } from '../lib/tokenStore.js';

const BASE = import.meta.env.VITE_BASE_URL ?? '';

interface User { id: string; name: string; email: string; avatarUrl?: string; }
interface AuthCtx { user: User | null; loading: boolean; login: (token: string, user: User) => void; logout: () => void; }

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    invalidateOnLogout();
    setUser(null);
    authLogout().catch(() => {});
  }, []);

  useEffect(() => {
    doRefresh()
      .then(async () => {
        const token = getToken();
        const meRes = await fetch(`${BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (!meRes.ok) throw new Error();
        const { user: userData } = await meRes.json();
        setUser(userData);
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = useCallback((token: string, userData: User) => {
    setToken(token);
    window.dispatchEvent(new Event('auth:login'));
    setUser(userData);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
