import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

    // Optional: check localStorage on app load
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // ✅ SIGN UP
    async function signUp(email: string, password: string, username: string, fullName: string) {
        try {
            const res = await fetch("http://localhost:8081/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username, fullName })
            });

            if (!res.ok) {
                const text = await res.text();
                return { error: text || "Signup failed" };
            }

            return { error: null };
        } catch (err) {
            return { error: "Network error" };
        }
    }

    // ✅ SIGN IN
    async function signIn(email: string, password: string) {
        try {
            const res = await fetch("http://localhost:8081/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                return { error: "Invalid email or password" };
            }

            const userData: User = await res.json();

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return { error: null };
        } catch (err) {
            return { error: "Network error" };
        }
    }

    // ✅ SIGN OUT
    async function signOut() {
        setUser(null);
        localStorage.removeItem('user');
    }

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ HOOK
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}