import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem } from '../types';
import { useAuth } from './AuthContext';

const API_URL = "http://localhost:8083/api/cart";

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
        if (user?.id) {
            fetchCart();
        } else {
            setItems([]);
        }
    }, [user]);

    async function fetchCart() {
        if (!user?.id) return;

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/${user.id}`);

            if (!res.ok) {
                console.error("Failed to fetch cart:", res.status);
                setItems([]);
                return;
            }

            const data = await res.json();

            // IMPORTANT: Your backend returns CartResponse, not array directly
            // Assume response structure: { items: [...] }
            const cartItems = data?.items ?? [];

            setItems(Array.isArray(cartItems) ? cartItems : []);
        } catch (err) {
            console.error("Fetch cart error:", err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    async function addToCart(productId: string, quantity = 1) {
        if (!user?.id) return;

        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    productId: Number(productId),
                    quantity
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                console.error("Add to cart failed:", res.status, errData);
                return;
            }

            const data = await res.json();

            // Backend returns CartResponse
            const cartItems = data?.items ?? [];
            setItems(Array.isArray(cartItems) ? cartItems : []);
        } catch (err) {
            console.error("Add to cart error:", err);
        }
    }

    async function removeFromCart(productId: string) {
        if (!user?.id) return;

        try {
            const res = await fetch(`${API_URL}/${user.id}/${productId}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                console.error("Remove from cart failed:", res.status, errData);
                return;
            }

            setItems(prev => prev.filter(i => String(i.product_id) !== String(productId)));
        } catch (err) {
            console.error("Remove error:", err);
        }
    }

    async function updateQuantity(productId: string, quantity: number) {
        if (!user?.id) return;

        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }

        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST", // backend uses POST for add/update
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    productId: Number(productId),
                    quantity
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                console.error("Update quantity failed:", res.status, errData);
                return;
            }

            const data = await res.json();
            const cartItems = data?.items ?? [];
            setItems(Array.isArray(cartItems) ? cartItems : []);
        } catch (err) {
            console.error("Update quantity error:", err);
        }
    }

    async function clearCart() {
        if (!user?.id) return;

        try {
            // No backend endpoint for clearing cart directly
            // So we remove each item one by one
            for (const item of items) {
                await fetch(`${API_URL}/${user.id}/${item.product_id}`, {
                    method: "DELETE"
                });
            }

            setItems([]);
        } catch (err) {
            console.error("Clear cart error:", err);
        }
    }

    const safeItems = Array.isArray(items) ? items : [];

    const itemCount = safeItems.reduce(
        (sum, i) => sum + (i.quantity || 0),
        0
    );

    const total = safeItems.reduce(
        (sum, i) =>
            sum + ((i.products?.price ?? 0) * (i.quantity || 0)),
        0
    );

    return (
        <CartContext.Provider
            value={{
                items: safeItems,
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