import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem } from '../types';
import { useAuth } from './AuthContext';

const API_URL = "http://localhost:8081/api/cart";

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
        if (user) fetchCart();
        else setItems([]);
    }, [user]);

    async function fetchCart() {
        if (!user) return;
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/${user.id}`);
            const data = await res.json();
            setItems(data ?? []);
        } catch (err) {
            console.error("Fetch cart error:", err);
        } finally {
            setLoading(false);
        }
    }

    async function addToCart(productId: string, quantity = 1) {
        if (!user) return;

        const existing = items.find(i => i.product_id === productId);

        try {
            if (existing) {
                await fetch(`${API_URL}/update`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        productId,
                        quantity: existing.quantity + quantity
                    })
                });
            } else {
                await fetch(`${API_URL}/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        productId,
                        quantity
                    })
                });
            }

            await fetchCart();
        } catch (err) {
            console.error("Add to cart error:", err);
        }
    }

    async function removeFromCart(productId: string) {
        if (!user) return;

        try {
            await fetch(`${API_URL}/remove`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    productId
                })
            });

            setItems(prev => prev.filter(i => i.product_id !== productId));
        } catch (err) {
            console.error("Remove error:", err);
        }
    }

    async function updateQuantity(productId: string, quantity: number) {
        if (!user) return;

        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }

        try {
            await fetch(`${API_URL}/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    productId,
                    quantity
                })
            });

            setItems(prev =>
                prev.map(i =>
                    i.product_id === productId ? { ...i, quantity } : i
                )
            );
        } catch (err) {
            console.error("Update quantity error:", err);
        }
    }

    async function clearCart() {
        if (!user) return;

        try {
            await fetch(`${API_URL}/clear/${user.id}`, {
                method: "DELETE"
            });

            setItems([]);
        } catch (err) {
            console.error("Clear cart error:", err);
        }
    }

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce(
        (sum, i) => sum + (i.products?.price ?? 0) * i.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                loading,
                itemCount,
                total,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                refresh: fetchCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}