import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Package, ArrowLeft, Tag, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { productApi } from '../lib/api';
import { mapProduct } from './HomePage';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const { addToCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        if (!slug) return;
        productApi
            .getBySlug(slug)
            .then((data) => {
                setProduct(mapProduct(data));
            })
            .catch(() => setProduct(null))
            .finally(() => setLoading(false));
    }, [slug]);

    async function handleAddToCart() {
        if (!user) { toast.error('Please sign in'); return; }
        if (!product) return;
        try {
            await addToCart(product.id, quantity);
            toast.success('Added to cart!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to add to cart');
        }
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-2 gap-10 animate-pulse">
                    <div className="aspect-square bg-slate-200 rounded-2xl" />
                    <div className="space-y-4">
                        <div className="h-6 bg-slate-200 rounded w-1/3" />
                        <div className="h-10 bg-slate-200 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 rounded w-1/4" />
                        <div className="h-20 bg-slate-200 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <Package size={64} className="mx-auto text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Product not found</h1>
                <Link to="/products" className="text-blue-600 hover:underline">Back to products</Link>
            </div>
        );
    }

    const images = product.images?.length ? product.images : [product.image_url];
    const inStock = product.stock_quantity > 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/products" className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft size={14} /> Back to products
            </Link>

            <div className="grid md:grid-cols-2 gap-10">
                {/* Images */}
                <div>
                    <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-3">
                        <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${selectedImage === i ? 'border-blue-500' : 'border-transparent'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div>
                    {product.categories && (
                        <Link to={`/products?category=${product.categories.slug}`} className="text-sm text-blue-600 hover:underline">
                            {product.categories.name}
                        </Link>
                    )}
                    <h1 className="text-3xl font-bold text-slate-900 mt-2 mb-4">{product.name}</h1>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center gap-1">
                            {Array(5).fill(0).map((_, i) => (
                                <Star key={i} size={16} className={i < Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                            ))}
                        </div>
                        <span className="text-sm text-slate-600">{product.rating.toFixed(1)} ({product.review_count} reviews)</span>
                    </div>

                    <div className="flex items-baseline gap-3 mb-5">
                        <span className="text-4xl font-bold text-slate-900">${product.price.toFixed(2)}</span>
                        {product.original_price && (
                            <>
                                <span className="text-xl text-slate-400 line-through">${product.original_price.toFixed(2)}</span>
                                <span className="bg-red-100 text-red-600 text-sm font-semibold px-2 py-0.5 rounded-full">
                  -{Math.round((1 - product.price / product.original_price) * 100)}%
                </span>
                            </>
                        )}
                    </div>

                    <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>

                    <div className="flex items-center gap-2 mb-6">
                        {inStock ? (
                            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle size={16} /> In Stock ({product.stock_quantity} available)
              </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                <AlertCircle size={16} /> Out of Stock
              </span>
                        )}
                    </div>

                    {inStock && (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 text-slate-600 hover:bg-slate-100 transition-colors">-</button>
                                <span className="px-4 py-2 border-x border-slate-200 font-medium">{quantity}</span>
                                <button onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))} className="px-4 py-2 text-slate-600 hover:bg-slate-100 transition-colors">+</button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <ShoppingCart size={18} /> Add to Cart
                            </button>
                        </div>
                    )}

                    {/* Tags */}
                    {product.tags?.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tag size={14} className="text-slate-400" />
                            {product.tags.map(tag => (
                                <span key={tag} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
                        <p><span className="font-medium">SKU:</span> {product.sku}</p>
                        <p className="mt-1 text-blue-600">
                            Product data served by <strong>Product Service (Node 2)</strong> via REST API
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
