import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Server, GitBranch } from 'lucide-react';
import { productApi } from '../lib/api';
import type { Product, Category } from '../types';
import ProductCard from '../components/product/ProductCard';

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [prodData, catData] = await Promise.all([
                    productApi.getAll(0, 8),
                    productApi.getCategories(),
                ]);
                const prods = (prodData.products || []).map(mapProduct);
                const cats = (Array.isArray(catData) ? catData : []).map(mapCategory);
                setFeaturedProducts(prods);
                setCategories(cats);
            } catch (err) {
                console.error('Failed to load homepage data:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
                    <Link to="/products" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                        View all <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map(cat => (
                        <Link
                            key={cat.id}
                            to={`/products?category=${cat.slug}`}
                            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all"
                        >
                            <div className="aspect-square overflow-hidden bg-slate-50">
                                <img
                                    src={cat.image_url || 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=300'}
                                    alt={cat.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-3 text-center">
                                <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
                    <Link to="/products" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                        View all <ArrowRight size={14} />
                    </Link>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {featuredProducts.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// Mappers: Spring Boot DTOs -> frontend types
function mapProduct(p: any): Product {
    return {
        id: String(p.id),
        category_id: String(p.categoryId || ''),
        name: p.name || '',
        slug: p.slug || '',
        description: p.description || '',
        price: Number(p.price) || 0,
        original_price: null,
        stock_quantity: p.stockQuantity || 0,
        sku: p.sku || '',
        image_url: p.imageUrl || 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=400',
        images: [],
        tags: [],
        rating: p.averageRating || 0,
        review_count: 0,
        is_active: p.status !== 'INACTIVE',
        is_featured: false,
        created_at: p.createdAt || '',
        categories: p.categoryName ? { id: String(p.categoryId || ''), name: p.categoryName, slug: '', description: '', image_url: '', is_active: true } : undefined,
    };
}

function mapCategory(c: any): Category {
    return {
        id: String(c.id),
        name: c.name || '',
        slug: c.slug || '',
        description: c.description || '',
        image_url: c.imageUrl || '',
        is_active: true,
    };
}

export { mapProduct, mapCategory };
