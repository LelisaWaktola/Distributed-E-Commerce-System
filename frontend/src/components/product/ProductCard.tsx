import { Link } from 'react-router-dom';
import { ShoppingCart, Star, AlertCircle } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const { addToCart } = useCart();
    const { user } = useAuth();

    async function handleAddToCart(e: React.MouseEvent) {
        e.preventDefault();
        if (!user) {
            toast.error('Please sign in to add items to cart');
            return;
        }
        await addToCart(product.id);
        toast.success(`${product.name} added to cart`);
    }

    const discount = product.original_price
        ? Math.round((1 - product.price / product.original_price) * 100)
        : null;

    return (
        <Link to={`/products/${product.slug}`} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
            <div className="relative overflow-hidden aspect-square bg-slate-50">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
                {discount && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            -{discount}%
          </span>
                )}
                {product.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="flex items-center gap-1 text-slate-600 text-sm font-medium">
              <AlertCircle size={14} /> Out of Stock
            </span>
                    </div>
                )}
                {product.is_featured && (
                    <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Featured
          </span>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-slate-400 mb-1">{product.categories?.name}</p>
                <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>

                <div className="flex items-center gap-1 mb-3">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-600">{product.rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">({product.review_count})</span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div>
                        <span className="font-bold text-slate-900">${product.price.toFixed(2)}</span>
                        {product.original_price && (
                            <span className="text-xs text-slate-400 line-through ml-2">${product.original_price.toFixed(2)}</span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock_quantity === 0}
                        className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ShoppingCart size={12} />
                        Add
                    </button>
                </div>
            </div>
        </Link>
    );
}
