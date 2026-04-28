import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; icon: React.ReactNode }> = {
    pending: { label: 'Pending', variant: 'warning', icon: <Clock size={12} /> },
    confirmed: { label: 'Confirmed', variant: 'info', icon: <CheckCircle size={12} /> },
    processing: { label: 'Processing', variant: 'info', icon: <AlertCircle size={12} /> },
    shipped: { label: 'Shipped', variant: 'info', icon: <Truck size={12} /> },
    delivered: { label: 'Delivered', variant: 'success', icon: <CheckCircle size={12} /> },
    cancelled: { label: 'Cancelled', variant: 'danger', icon: <XCircle size={12} /> },
    refunded: { label: 'Refunded', variant: 'neutral', icon: <XCircle size={12} /> },
};

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', user.id)
            .order('placed_at', { ascending: false })
            .then(({ data }) => {
                setOrders(data ?? []);
                setLoading(false);
            });
    }, [user]);

    if (!user) {
        return (
            <div className="max-w-xl mx-auto px-4 py-24 text-center">
                <Package size={64} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">Sign in to view your orders</p>
                <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors">Sign In</Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
                {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse" />
                ))}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="max-w-xl mx-auto px-4 py-24 text-center">
                <Package size={64} className="mx-auto text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold mb-2">No orders yet</h1>
                <p className="text-slate-500 mb-6">Start shopping to see your orders here.</p>
                <Link to="/products" className="bg-blue-600 text-white px-6 py-3 rounded-xl inline-block hover:bg-blue-700 transition-colors font-semibold">Shop Now</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">My Orders</h1>
            <div className="space-y-4">
                {orders.map(order => {
                    const cfg = statusConfig[order.status];
                    return (
                        <div key={order.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="font-semibold text-slate-900">{order.order_number}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {new Date(order.placed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <Badge variant={cfg.variant}>
                                    <span className="flex items-center gap-1">{cfg.icon} {cfg.label}</span>
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                {(order.order_items ?? []).slice(0, 4).map((item, i) => (
                                    <div key={i} className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                                        {item.product_image && (
                                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                ))}
                                {(order.order_items?.length ?? 0) > 4 && (
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500">
                                        +{(order.order_items?.length ?? 0) - 4}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-500">
                                    {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-slate-900">${order.total_amount.toFixed(2)}</span>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-blue-600">
                                ↗ Order data served by <strong>Order Service (Node 3)</strong>
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
