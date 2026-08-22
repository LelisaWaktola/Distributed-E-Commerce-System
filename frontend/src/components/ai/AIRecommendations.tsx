import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../product/ProductCard';
import type { Product } from '../../types';

const AI_SERVICE = import.meta.env.VITE_API_AI_SERVICE || 'http://localhost:8085';

function aiRecToProduct(p: any): Product {
    return {
        id: String(p.id),
        category_id: '',
        name: p.name,
        slug: p.slug,
        description: p.description || '',
        price: p.price,
        original_price: null,
        stock_quantity: p.stock_quantity || 0,
        sku: '',
        image_url: p.image_url,
        images: [],
        tags: [],
        rating: 4.0,
        review_count: Math.floor(Math.random() * 80 + 10),
        is_active: p.in_stock,
        is_featured: false,
        created_at: '',
        categories: { id: '', name: p.category, slug: '', description: '', image_url: '', is_active: true },
    };
}

export default function AIRecommendations({ context, title, limit = 4 }: { context: string; title?: string; limit?: number }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchRecommendations();
    }, [context]);

    async function fetchRecommendations() {
        setLoading(true);
        try {
            const res = await fetch(`${AI_SERVICE}/api/products/recommendations?context=${encodeURIComponent(context)}`);
            const data = await res.json();
            if (data.products && data.products.length > 0) {
                setProducts(data.products.slice(0, limit).map(aiRecToProduct));
                setReason('Hand-picked based on your interests');
            }
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

    if (!loading && products.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Sparkles size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{title || 'AI Recommendations'}</h2>
                        {reason && <p className="text-xs text-slate-500 mt-0.5">{reason}</p>}
                    </div>
                </div>
                <Link to="/products" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                    View all <ArrowRight size={14} />
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(limit).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </section>
    );
}
