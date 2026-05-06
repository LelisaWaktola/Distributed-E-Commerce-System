import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Server, GitBranch } from 'lucide-react';
import type { Product, Category } from '../types';
import ProductCard from '../components/product/ProductCard';

const PRODUCT_API = "http://localhost:8082/api/products";
const CATEGORY_API = "http://localhost:8082/api/categories";

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [productsRes, catsRes] = await Promise.all([
                    fetch(`${PRODUCT_API}?page=0&size=8`),
                    fetch(CATEGORY_API)
                ]);

                const productsData = productsRes.ok ? await productsRes.json() : null;
                const catsData = catsRes.ok ? await catsRes.json() : null;

                // backend: { products: [...] }
                const products = productsData?.products ?? [];

                // categories endpoint returns array directly
                const cats = catsData ?? [];

                setFeaturedProducts(Array.isArray(products) ? products : []);
                setCategories(Array.isArray(cats) ? cats : []);
            } catch (err) {
                console.error("Home load error:", err);
                setFeaturedProducts([]);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    return (
        <div>
            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-blue-500/30 text-blue-200 text-xs font-medium px-3 py-1 rounded-full">
                                Distributed System Demo
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                            E-Commerce on<br />
                            <span className="text-blue-300">Microservices</span>
                        </h1>

                        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                            A fully distributed e-commerce platform demonstrating inter-node communication,
                            fault tolerance, scalability, and eventual consistency across 4 independent services.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/products"
                                className="flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                            >
                                Shop Now <ArrowRight size={16} />
                            </Link>

                            <Link
                                to="/distributed"
                                className="flex items-center gap-2 border border-blue-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700/50 transition-colors"
                            >
                                System Monitor
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture */}
            <section className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Server, title: '4 Service Nodes', desc: 'User, Product, Order, Payment' },
                            { icon: GitBranch, title: 'REST Inter-Node Comm', desc: 'HTTP APIs between services' },
                            { icon: Shield, title: 'Fault Tolerant', desc: 'Graceful service failure handling' },
                            { icon: Zap, title: 'Horizontally Scalable', desc: 'Load-balanced service instances' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                                    <Icon size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
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
                                    src={cat.image_url}
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

            {/* CTA */}
            <section className="bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
                    <h2 className="text-3xl font-bold mb-4">Explore the Distributed Architecture</h2>
                    <Link
                        to="/distributed"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-500 transition-colors"
                    >
                        View System Monitor <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
}