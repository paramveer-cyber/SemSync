import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authLogout } from '../lib/api';
import { invalidateOnLogout } from '../lib/dataService';
import { setToken, clearToken } from '../lib/tokenStore.js';

// const BASE = 'https://semsyncbackend.vercel.app';
const BASE = 'http://localhost:3000';

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
    authLogout().catch(() => { });
  }, []);

  useEffect(() => {
    fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(async (data) => {
        setToken(data.token);
        const meRes = await fetch(`${BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
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
    setUser(userData);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};