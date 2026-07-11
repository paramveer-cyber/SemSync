import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import { authLogout, authMe, doRefresh } from '../lib/api';
import { invalidateOnLogout } from '../lib/dataService';
import { setToken, clearToken } from '../lib/tokenStore.js';
import { dedupe } from '../lib/sessionCache';

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}
interface AuthCtx {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

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
        dedupe('authBoot', async () => {
            await doRefresh();
            const { user: userData } = await authMe();
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

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
