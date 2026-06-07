import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { orderApi, productApi } from '../lib/api';
import type { CartItem, Product } from '../types';
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
        try {
            const data = await orderApi.getCart(Number(user.id));
            const cartItems: CartItem[] = (data.items || []).map((item: any) => ({
                id: String(item.id),
                user_id: user.id,
                product_id: String(item.productId),
                quantity: item.quantity,
                added_at: item.addedAt || '',
                product: {
                    id: String(item.productId),
                    name: item.productName || '',
                    price: Number(item.unitPrice),
                    image_url: '',
                    slug: '',
                    sku: '',
                } as any,
            }));
            setItems(cartItems);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    async function addToCart(productId: string, quantity = 1) {
        if (!user) return;
        try {
            await orderApi.addToCart(Number(user.id), Number(productId), quantity);
            await fetchCart();
        } catch (err: any) {
            throw new Error(err.message || 'Failed to add to cart');
        }
    }

    async function removeFromCart(productId: string) {
        if (!user) return;
        try {
            await orderApi.removeFromCart(Number(user.id), Number(productId));
            setItems(prev => prev.filter(i => i.product_id !== productId));
        } catch (err: any) {
            console.error('Remove from cart failed:', err);
        }
    }

    async function updateQuantity(productId: string, quantity: number) {
        if (!user) return;
        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        try {
            await orderApi.addToCart(Number(user.id), Number(productId), quantity);
            await fetchCart();
        } catch (err: any) {
            console.error('Update quantity failed:', err);
        }
    }

    async function clearCart() {
        if (!user) return;
        for (const item of items) {
            await orderApi.removeFromCart(Number(user.id), Number(item.product_id));
        }
        setItems([]);
    }

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0);

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
