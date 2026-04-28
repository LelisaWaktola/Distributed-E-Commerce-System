import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CartPage() {
    const { items, itemCount, total, removeFromCart, updateQuantity } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <ShoppingCart size={64} className="mx-auto text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Sign in to view your cart</h1>
                <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-xl inline-block mt-4 hover:bg-blue-700 transition-colors">
                    Sign In
                </Link>
            </div>
        );
    }

    if (itemCount === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <Package size={64} className="mx-auto text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
                <p className="text-slate-500 mb-6">Browse our products and add items to your cart.</p>
                <Link to="/products" className="bg-blue-600 text-white px-6 py-3 rounded-xl inline-block hover:bg-blue-700 transition-colors font-semibold">
                    Shop Now
                </Link>
            </div>
        );
    }

    const shipping = total > 100 ? 0 : 9.99;
    const tax = total * 0.08;
    const orderTotal = total + shipping + tax;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Shopping Cart ({itemCount} items)</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4">
                            <img
                                src={item.products?.image_url}
                                alt={item.products?.name}
                                className="w-20 h-20 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/products/${item.products?.slug}`}
                                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 text-sm"
                                >
                                    {item.products?.name}
                                </Link>
                                <p className="text-xs text-slate-400 mt-0.5">SKU: {item.products?.sku}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                            className="px-3 py-1 text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                                        >-</button>
                                        <span className="px-3 py-1 border-x border-slate-200 text-sm font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                            className="px-3 py-1 text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                                        >+</button>
                                    </div>
                                    <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900">
                      ${((item.products?.price ?? 0) * item.quantity).toFixed(2)}
                    </span>
                                        <button
                                            onClick={async () => {
                                                await removeFromCart(item.product_id);
                                                toast.success('Item removed');
                                            }}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-20">
                        <h2 className="font-bold text-slate-900 text-lg mb-5">Order Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal ({itemCount} items)</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span>
                                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax (8%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900">
                                <span>Total</span>
                                <span>${orderTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {shipping > 0 && (
                            <p className="text-xs text-slate-400 mt-3">
                                Add ${(100 - total).toFixed(2)} more for free shipping
                            </p>
                        )}

                        <button
                            onClick={() => navigate('/checkout')}
                            className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Proceed to Checkout <ArrowRight size={16} />
                        </button>
                        <Link to="/products" className="mt-3 block text-center text-sm text-blue-600 hover:underline">
                            Continue Shopping
                        </Link>

                        <p className="mt-4 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                            ↗ Cart managed by <strong>Order Service (Node 3)</strong> via REST API
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
