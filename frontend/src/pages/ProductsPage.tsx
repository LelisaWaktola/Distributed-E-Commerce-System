import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';
import ProductCard from '../components/product/ProductCard';

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const q = searchParams.get('q') || '';
    const categorySlug = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sortBy = searchParams.get('sort') || 'name';

    useEffect(() => {
        supabase.from('categories').select('*').eq('is_active', true).then(({ data }) => {
            setCategories(data ?? []);
        });
    }, []);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            let query = supabase
                .from('products')
                .select('*, categories(*)')
                .eq('is_active', true);

            if (q) query = query.ilike('name', `%${q}%`);
            if (categorySlug) {
                const cat = categories.find(c => c.slug === categorySlug);
                if (cat) query = query.eq('category_id', cat.id);
            }
            if (minPrice) query = query.gte('price', Number(minPrice));
            if (maxPrice) query = query.lte('price', Number(maxPrice));

            if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
            else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
            else if (sortBy === 'rating') query = query.order('rating', { ascending: false });
            else query = query.order('name', { ascending: true });

            const { data } = await query;
            setProducts(data ?? []);
            setLoading(false);
        }
        fetchProducts();
    }, [q, categorySlug, minPrice, maxPrice, sortBy, categories.length]);

    function updateParam(key: string, value: string) {
        const p = new URLSearchParams(searchParams);
        if (value) p.set(key, value);
        else p.delete(key);
        setSearchParams(p);
    }

    const activeCategory = categories.find(c => c.slug === categorySlug);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {q ? `Results for "${q}"` : activeCategory?.name || 'All Products'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{products.length} products</p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <SlidersHorizontal size={14} />
                    Filters
                </button>
            </div>

            <div className="flex gap-6">
                {/* Sidebar filters */}
                <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-56 flex-shrink-0`}>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20">
                        <h3 className="font-semibold text-slate-900 mb-4">Filters</h3>

                        {/* Categories */}
                        <div className="mb-5">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Category</p>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => updateParam('category', '')}
                                        className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${!categorySlug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        All
                                    </button>
                                </li>
                                {categories.map(cat => (
                                    <li key={cat.id}>
                                        <button
                                            onClick={() => updateParam('category', cat.slug)}
                                            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${categorySlug === cat.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Range */}
                        <div className="mb-5">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Price Range</p>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={e => updateParam('minPrice', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={e => updateParam('maxPrice', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Sort By</p>
                            <select
                                value={sortBy}
                                onChange={e => updateParam('sort', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="name">Name A-Z</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="rating">Best Rated</option>
                            </select>
                        </div>

                        {(q || categorySlug || minPrice || maxPrice) && (
                            <button
                                onClick={() => setSearchParams({})}
                                className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-red-600 hover:text-red-700"
                            >
                                <X size={12} /> Clear all filters
                            </button>
                        )}
                    </div>
                </aside>

                {/* Products grid */}
                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                            {Array(9).fill(0).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <Search size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">No products found</p>
                            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search term</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                            {products.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
