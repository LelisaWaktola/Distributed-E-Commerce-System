import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { CartItem } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
    items: CartItem[];
    loading: boolean;
    itemCount: number;
    total: number;
    addToCart: (productId: string, quantity?: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            setItems([]);
        }
    }, [user]);

    async function fetchCart() {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('carts')
            .select('*, products(*)')
            .eq('user_id', user.id);
        setItems(data ?? []);
        setLoading(false);
    }

    async function addToCart(productId: string, quantity = 1) {
        if (!user) return;
        const existing = items.find(i => i.product_id === productId);
        if (existing) {
            await supabase
                .from('carts')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id);
        } else {
            await supabase.from('carts').insert({ user_id: user.id, product_id: productId, quantity });
        }
        await fetchCart();
    }

    async function removeFromCart(productId: string) {
        if (!user) return;
        await supabase.from('carts').delete().eq('user_id', user.id).eq('product_id', productId);
        setItems(prev => prev.filter(i => i.product_id !== productId));
    }

    async function updateQuantity(productId: string, quantity: number) {
        if (!user) return;
        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        await supabase
            .from('carts')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);
        setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity } : i));
    }

    async function clearCart() {
        if (!user) return;
        await supabase.from('carts').delete().eq('user_id', user.id);
        setItems([]);
    }

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + (i.products?.price ?? 0) * i.quantity, 0);

    return (
        <CartContext.Provider value={{ items, loading, itemCount, total, addToCart, removeFromCart, updateQuantity, clearCart, refresh: fetchCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
