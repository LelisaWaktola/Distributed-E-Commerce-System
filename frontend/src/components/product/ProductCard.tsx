import { Link } from 'react-router-dom';
import { ShoppingCart, Star, AlertCircle } from 'lucide-react';
import type { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CART_API = "http://localhost:8083/api/cart";

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const { user } = useAuth();

    async function handleAddToCart(e: React.MouseEvent) {
        e.preventDefault();

        if (!user) {
            toast.error('Please sign in to add items to cart');
            return;
        }

        try {
            await fetch(CART_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    productId: product.id,
                    quantity: 1
                })
            });

            toast.success(`${product.name} added to cart`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to add to cart");
        }
    }

    // ✅ SAFE values (prevents crashes from backend nulls)
    const price = product.price ?? 0;
    const originalPrice = product.original_price ?? 0;
    const rating = product.rating ?? 0;
    const stock = product.stock_quantity ?? 0;

    const discount =
        originalPrice > 0
            ? Math.round((1 - price / originalPrice) * 100)
            : null;

    return (
        <Link
            to={`/products/${product.slug}`}
            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
        >
            {/* IMAGE */}
            <div className="relative aspect-square bg-slate-50">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />

                {discount && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        -{discount}%
                    </span>
                )}

                {stock === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="flex items-center gap-1 text-slate-600 text-sm">
                            <AlertCircle size={14} /> Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-slate-400">
                    {product.categories?.name || 'Uncategorized'}
                </p>

                <h3 className="font-semibold text-sm mb-2 group-hover:text-blue-600">
                    {product.name}
                </h3>

                {/* RATING (SAFE) */}
                <div className="flex items-center gap-1 mb-3">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs">{rating.toFixed(1)}</span>
                </div>

                {/* PRICE + CART */}
                <div className="flex justify-between mt-auto items-center">
                    <div>
                        <span className="font-bold">
                            ${price.toFixed(2)}
                        </span>

                        {originalPrice > 0 && (
                            <span className="text-xs text-slate-400 line-through ml-2">
                                ${originalPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={stock === 0}
                        className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                        <ShoppingCart size={12} />
                        Add
                    </button>
                </div>
            </div>
        </Link>
    );
}