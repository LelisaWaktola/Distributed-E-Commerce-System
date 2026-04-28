import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });
    }, []);

    async function fetchUserProfile(userId: string) {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        setUser(data ?? null);
        setLoading(false);
    }

    async function signUp(email: string, password: string, username: string, fullName: string) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };
        if (!data.user) return { error: 'Sign up failed' };

        const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            email,
            username,
            full_name: fullName,
            password_hash: 'managed_by_supabase_auth',
        });
        if (profileError) return { error: profileError.message };
        return { error: null };
    }

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { error: null };
    }

    async function signOut() {
        await supabase.auth.signOut();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
