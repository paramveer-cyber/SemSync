import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authMe } from '../lib/api';
import { invalidateOnLogout } from '../lib/dataService';

interface User { id: string; name: string; email: string; avatarUrl?: string; }
interface AuthCtx { user: User | null; loading: boolean; login: (token: string, user: User) => void; logout: () => void; }

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ct_token');
    if (!token) { setLoading(false); return; }
    authMe()
      .then(({ user }: { user: User }) => setUser(user))
      .catch(() => { localStorage.removeItem('ct_token'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login  = useCallback((token: string, userData: User) => { localStorage.setItem('ct_token', token); setUser(userData); }, []);
  const logout = useCallback(() => { localStorage.removeItem('ct_token'); invalidateOnLogout(); setUser(null); }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
