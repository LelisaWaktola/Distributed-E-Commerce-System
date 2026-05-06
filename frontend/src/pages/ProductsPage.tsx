import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Product, Category } from '../types';
import ProductCard from '../components/product/ProductCard';

const PRODUCT_API = "http://localhost:8082/api/products";
const CATEGORY_API = "http://localhost:8082/api/categories";

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const q = searchParams.get('q') || '';
    const categorySlug = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sortBy = searchParams.get('sort') || 'name';

    // Load categories
    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch(CATEGORY_API);
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            }
        }

        loadCategories();
    }, []);

    // Load products (from Spring Boot)
    useEffect(() => {
        async function loadProducts() {
            setLoading(true);

            try {
                const res = await fetch(`${PRODUCT_API}?page=0&size=100`);
                const data = await res.json();

                const list = Array.isArray(data?.products)
                    ? data.products
                    : [];

                setAllProducts(list);
            } catch (err) {
                console.error("Product fetch error:", err);
                setAllProducts([]);
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    // Apply filtering locally (replaces Supabase query builder)
    useEffect(() => {
        let filtered = [...allProducts];

        // search
        if (q) {
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(q.toLowerCase())
            );
        }

        // category
        if (categorySlug) {
            const cat = categories.find(c => c.slug === categorySlug);
            if (cat) {
                filtered = filtered.filter(p => p.category_id === cat.id);
            }
        }

        // price
        if (minPrice) {
            filtered = filtered.filter(p => p.price >= Number(minPrice));
        }
        if (maxPrice) {
            filtered = filtered.filter(p => p.price <= Number(maxPrice));
        }

        // sorting
        if (sortBy === 'price_asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        } else {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        setProducts(filtered);
    }, [allProducts, q, categorySlug, minPrice, maxPrice, sortBy, categories]);

    function updateParam(key: string, value: string) {
        const p = new URLSearchParams(searchParams);
        if (value) p.set(key, value);
        else p.delete(key);
        setSearchParams(p);
    }

    const activeCategory = categories.find(c => c.slug === categorySlug);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {q ? `Results for "${q}"` : activeCategory?.name || 'All Products'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {products.length} products
                    </p>
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                >
                    <SlidersHorizontal size={14} />
                    Filters
                </button>
            </div>

            <div className="flex gap-6">

                {/* Filters */}
                <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-56`}>
                    <div className="bg-white rounded-2xl border p-5 sticky top-20">

                        <h3 className="font-semibold mb-4">Filters</h3>

                        {/* Categories */}
                        <div className="mb-5">
                            <p className="text-xs uppercase mb-2">Category</p>

                            <button
                                onClick={() => updateParam('category', '')}
                                className={`block w-full text-left text-sm p-2 rounded-lg ${!categorySlug ? 'bg-blue-50 text-blue-700' : ''}`}
                            >
                                All
                            </button>

                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => updateParam('category', cat.slug)}
                                    className={`block w-full text-left text-sm p-2 rounded-lg ${
                                        categorySlug === cat.slug ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                            <p className="text-xs uppercase mb-2">Price</p>
                            <input
                                placeholder="Min"
                                value={minPrice}
                                onChange={e => updateParam('minPrice', e.target.value)}
                                className="w-full border p-2 rounded mb-2"
                            />
                            <input
                                placeholder="Max"
                                value={maxPrice}
                                onChange={e => updateParam('maxPrice', e.target.value)}
                                className="w-full border p-2 rounded"
                            />
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={e => updateParam('sort', e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            <option value="name">Name</option>
                            <option value="price_asc">Price ↑</option>
                            <option value="price_desc">Price ↓</option>
                            <option value="rating">Rating</option>
                        </select>

                        {(q || categorySlug || minPrice || maxPrice) && (
                            <button
                                onClick={() => setSearchParams({})}
                                className="mt-4 text-red-600 text-xs flex items-center gap-1"
                            >
                                <X size={12} /> Clear filters
                            </button>
                        )}
                    </div>
                </aside>

                {/* Products */}
                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                            {Array(9).fill(0).map((_, i) => (
                                <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <Search size={48} className="mx-auto text-slate-300 mb-4" />
                            <p>No products found</p>
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