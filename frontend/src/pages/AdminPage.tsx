import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Product, Order } from '../types';
import { Package, ShoppingBag, Users, DollarSign, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'overview' | 'products' | 'orders'>('overview');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);
    const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadData();
    }, [user]);

    async function loadData() {
        setLoading(true);
        const [{ data: prods }, { data: ords }, { data: usrs }, { data: pays }] = await Promise.all([
            supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false }),
            supabase.from('orders').select('*, order_items(*)').order('placed_at', { ascending: false }).limit(50),
            supabase.from('users').select('id'),
            supabase.from('payments').select('amount').eq('status', 'completed'),
        ]);
        setProducts(prods ?? []);
        setOrders(ords ?? []);
        setStats({
            products: prods?.length ?? 0,
            orders: ords?.length ?? 0,
            users: usrs?.length ?? 0,
            revenue: (pays ?? []).reduce((sum, p) => sum + Number(p.amount), 0),
        });
        setLoading(false);
    }

    async function saveProduct() {
        if (!editProduct) return;
        setSaving(true);
        if (editProduct.id) {
            await supabase.from('products').update(editProduct).eq('id', editProduct.id);
            toast.success('Product updated');
        } else {
            await supabase.from('products').insert({ ...editProduct, slug: editProduct.name?.toLowerCase().replace(/\s+/g, '-') ?? '' });
            toast.success('Product created');
        }
        setEditProduct(null);
        await loadData();
        setSaving(false);
    }

    async function deleteProduct(id: string) {
        if (!confirm('Delete this product?')) return;
        await supabase.from('products').update({ is_active: false }).eq('id', id);
        toast.success('Product deactivated');
        await loadData();
    }

    async function updateOrderStatus(orderId: string, status: string) {
        await supabase.from('orders').update({ status, [`${status}_at`]: new Date().toISOString() }).eq('id', orderId);
        toast.success('Order status updated');
        await loadData();
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="max-w-xl mx-auto px-4 py-24 text-center">
                <Package size={64} className="mx-auto text-slate-300 mb-4" />
                <h1 className="text-xl font-bold">Admin access required</h1>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Panel — Product Service (Node 2)</h1>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-8">
                {(['overview', 'products', 'orders'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <>
                    {tab === 'overview' && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Total Products', value: stats.products, icon: <Package size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Total Orders', value: stats.orders, icon: <ShoppingBag size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { label: 'Total Users', value: stats.users, icon: <Users size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: <DollarSign size={20} />, color: 'text-rose-600', bg: 'bg-rose-50' },
                                ].map(s => (
                                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
                                        <div className={`${s.bg} ${s.color} p-3 rounded-xl`}>{s.icon}</div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                                            <p className="text-xs text-slate-500">{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-blue-50 rounded-2xl p-5 text-sm text-blue-700">
                                <p className="font-semibold mb-1">Admin Panel — Node Assignments</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• <strong>Product management</strong> → Product Service (Node 2, port 8082)</li>
                                    <li>• <strong>Order management</strong> → Order Service (Node 3, port 8083)</li>
                                    <li>• <strong>User management</strong> → User Service (Node 1, port 8081)</li>
                                    <li>• <strong>Payment reports</strong> → Payment Service (Node 4, port 8084)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {tab === 'products' && (
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-bold text-slate-900">Products ({products.length})</h2>
                                <button onClick={() => setEditProduct({ is_active: true, price: 0, stock_quantity: 0 })}
                                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                                    <Plus size={14} /> Add Product
                                </button>
                            </div>

                            {editProduct !== null && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                                    <h3 className="font-bold mb-4">{editProduct.id ? 'Edit Product' : 'New Product'}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Name</label>
                                            <input value={editProduct.name ?? ''} onChange={e => setEditProduct(p => ({ ...p!, name: e.target.value }))}
                                                   className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Price ($)</label>
                                            <input type="number" value={editProduct.price ?? ''} onChange={e => setEditProduct(p => ({ ...p!, price: Number(e.target.value) }))}
                                                   className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Stock</label>
                                            <input type="number" value={editProduct.stock_quantity ?? ''} onChange={e => setEditProduct(p => ({ ...p!, stock_quantity: Number(e.target.value) }))}
                                                   className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
                                            <textarea value={editProduct.description ?? ''} onChange={e => setEditProduct(p => ({ ...p!, description: e.target.value }))}
                                                      rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={saveProduct} disabled={saving}
                                                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save
                                        </button>
                                        <button onClick={() => setEditProduct(null)} className="border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">Product</th>
                                        <th className="text-left px-4 py-3 font-medium">Price</th>
                                        <th className="text-left px-4 py-3 font-medium">Stock</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                    {products.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                                    <div>
                                                        <p className="font-medium text-slate-900">{p.name}</p>
                                                        <p className="text-xs text-slate-400">{p.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">${p.price.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <span className={p.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}>{p.stock_quantity}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditProduct(p)} className="text-blue-500 hover:text-blue-700 transition-colors"><Edit size={15} /></button>
                                                    <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'orders' && (
                        <div>
                            <h2 className="font-bold text-slate-900 mb-5">Orders ({orders.length})</h2>
                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">Order</th>
                                        <th className="text-left px-4 py-3 font-medium">Date</th>
                                        <th className="text-left px-4 py-3 font-medium">Items</th>
                                        <th className="text-left px-4 py-3 font-medium">Total</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Action</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                    {orders.map(o => (
                                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{o.order_number}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.placed_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-slate-600">{o.order_items?.length ?? 0}</td>
                                            <td className="px-4 py-3 font-bold">${o.total_amount.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : o.status === 'pending' ? 'warning' : 'info'}>
                                                    {o.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={o.status}
                                                    onChange={e => updateOrderStatus(o.id, e.target.value)}
                                                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                                                >
                                                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
