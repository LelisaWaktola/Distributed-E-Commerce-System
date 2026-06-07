import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { signIn, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        if (user.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    }, [user, navigate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const { error } = await signIn(email, password);
        if (error) {
            toast.error(error);
        } else {
            toast.success('Welcome back!');
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-2xl">
                        <Package size={28} /> DistriShop
                    </Link>
                    <p className="text-slate-500 text-sm mt-2">Distributed E-Commerce System</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h1 className="text-xl font-bold text-slate-900 mb-6">Sign In</h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 font-medium hover:underline">Create one</Link>
                    </p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                        <p className="font-medium mb-1">Demo admin account:</p>
                        <p>Email: admin@distrishop.com</p>
                        <p>Password: (register to test)</p>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Authentication handled by <strong>User Service (Node 1)</strong>
                </p>
            </div>
        </div>
    );
}
