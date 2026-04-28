import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Package, LayoutDashboard, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const { itemCount } = useCart();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    }

    async function handleSignOut() {
        await signOut();
        navigate('/');
    }

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
                        <Package size={24} />
                        <span>DistriShop</span>
                    </Link>

                    {/* Search - desktop */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </form>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <Link to="/products" className="hidden md:block text-sm text-slate-600 hover:text-blue-600 px-3 py-2 transition-colors">
                            Products
                        </Link>

                        <Link to="/cart" className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors">
                            <ShoppingCart size={20} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-semibold">
                      {(user.full_name || user.username || user.email)[0].toUpperCase()}
                    </span>
                                    </div>
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-sm font-medium text-slate-900">{user.full_name || user.username}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                        <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                            <Package size={14} /> My Orders
                                        </Link>
                                        {user.role === 'admin' && (
                                            <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                                                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                                <LayoutDashboard size={14} /> Admin Panel
                                            </Link>
                                        )}
                                        <Link to="/distributed" onClick={() => setUserMenuOpen(false)}
                                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                            <Activity size={14} /> System Monitor
                                        </Link>
                                        <button
                                            onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                            <User size={14} /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                Sign In
                            </Link>
                        )}

                        <button
                            className="md:hidden p-2"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden py-3 border-t border-slate-100">
                        <form onSubmit={handleSearch} className="mb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                                />
                            </div>
                        </form>
                        <Link to="/products" className="block py-2 text-slate-700" onClick={() => setMobileOpen(false)}>Products</Link>
                        <Link to="/distributed" className="block py-2 text-slate-700" onClick={() => setMobileOpen(false)}>System Monitor</Link>
                        {user && <Link to="/orders" className="block py-2 text-slate-700" onClick={() => setMobileOpen(false)}>My Orders</Link>}
                    </div>
                )}
            </div>
        </nav>
    );
}
