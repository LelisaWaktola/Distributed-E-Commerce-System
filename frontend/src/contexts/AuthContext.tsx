import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userApi } from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUserId = localStorage.getItem('user_id');
        if (storedToken && storedUserId) {
            setToken(storedToken);
            loadProfile(Number(storedUserId));
        } else {
            setLoading(false);
        }
    }, []);

    async function loadProfile(userId: number) {
        try {
            const data = await userApi.getProfile(userId);
            const u: User = {
                id: String(data.id),
                email: data.email,
                username: data.name || data.email,
                full_name: data.name || '',
                phone: data.phone || '',
                avatar_url: '',
                role: data.role === 'ADMIN' ? 'admin' : 'customer',
                is_active: data.isActive ?? true,
                created_at: data.createdAt || '',
            };
            setUser(u);
        } catch {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    }

    async function signUp(email: string, password: string, username: string, fullName: string) {
        try {
            const data = await userApi.register(email, password, fullName);
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_id', String(data.userId));
                setToken(data.token);
                await loadProfile(data.userId);
            }
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Registration failed' };
        }
    }

    async function signIn(email: string, password: string) {
        try {
            const data = await userApi.login(email, password);
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_id', String(data.userId));
                setToken(data.token);
                await loadProfile(data.userId);
            }
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Login failed' };
        }
    }

    async function signOut() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        setUser(null);
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
