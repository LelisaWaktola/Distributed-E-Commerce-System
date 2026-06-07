import { Link } from 'react-router-dom';
import { Package, Activity } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl mb-3">
                            <Package size={24} className="text-blue-400" />
                            DistriShop
                        </Link>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Shop</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
                            <li><Link to="/products?category=electronics" className="hover:text-white transition-colors">Electronics</Link></li>
                            <li><Link to="/products?category=clothing" className="hover:text-white transition-colors">Clothing</Link></li>
                            <li><Link to="/products?category=home-kitchen" className="hover:text-white transition-colors">Home & Kitchen</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">System</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/distributed" className="hover:text-white transition-colors">System Monitor</Link></li>
                            <li><Link to="/distributed#architecture" className="hover:text-white transition-colors">Architecture</Link></li>
                            <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                            <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                        © 2026 DistriShop — Distributed E-Commerce System
                    </p>
                </div>
            </div>
        </footer>
    );
}
