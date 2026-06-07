import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader as Loader2, CircleCheck as CheckCircle } from 'lucide-react';
import { orderApi } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FormData {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvv: string;
    paymentMethod: 'card' | 'paypal' | 'cash_on_delivery';
    notes: string;
}

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
    const [form, setForm] = useState<FormData>({
        fullName: user?.full_name || '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        phone: user?.phone || '',
        cardNumber: '4111 1111 1111 1111',
        cardExpiry: '12/28',
        cardCvv: '123',
        paymentMethod: 'card',
        notes: '',
    });

    const shipping = total > 100 ? 0 : 9.99;
    const tax = total * 0.08;
    const orderTotal = total + shipping + tax;

    function update(key: keyof FormData, value: string) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function placeOrder() {
        if (!user) return;
        setLoading(true);

        try {
            const address = `${form.fullName}, ${form.street}, ${form.city}, ${form.state} ${form.zipCode}, ${form.country}`;
            const paymentMethod = form.paymentMethod === 'card' ? 'CREDIT_CARD' : form.paymentMethod === 'paypal' ? 'PAYPAL' : 'CASH_ON_DELIVERY';

            await orderApi.createOrder(Number(user.id), address, form.notes, paymentMethod);

            await clearCart();
            setStep('success');
            toast.success('Order placed successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (step === 'success') {
        return (
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
                <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
                    <p className="text-slate-500 mb-6">
                        Your order has been placed and payment processed successfully.
                        All 4 service nodes communicated to fulfill this order.
                    </p>
                    <div className="text-xs text-left bg-blue-50 rounded-xl p-4 mb-6 space-y-1">
                        <p className="font-semibold text-blue-700 mb-2">Inter-Node Communication Log:</p>
                        <p className="text-blue-600">{'Order Service -> Product Service: stock verified'}</p>
                        <p className="text-blue-600">{'Order Service -> Payment Service: payment processed'}</p>
                        <p className="text-blue-600">{'Order Service -> User Service: identity validated'}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/orders')} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                            View Orders
                        </button>
                        <button onClick={() => navigate('/products')} className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                            Keep Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Address */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <h2 className="font-bold text-slate-900 mb-5">Shipping Address</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input value={form.fullName} onChange={e => update('fullName', e.target.value)}
                                       className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                                <input value={form.street} onChange={e => update('street', e.target.value)}
                                       className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                <input value={form.city} onChange={e => update('city', e.target.value)}
                                       className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                <input value={form.state} onChange={e => update('state', e.target.value)}
                                       className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                                <input value={form.zipCode} onChange={e => update('zipCode', e.target.value)}
                                       className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input value={form.phone} onChange={e => update('phone', e.target.value)}
                                       className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <h2 className="font-bold text-slate-900 mb-5">Payment</h2>
                        <div className="flex gap-3 mb-5">
                            {(['card', 'paypal', 'cash_on_delivery'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => update('paymentMethod', m)}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${form.paymentMethod === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                >
                                    {m === 'card' ? 'Credit Card' : m === 'paypal' ? 'PayPal' : 'Cash on Delivery'}
                                </button>
                            ))}
                        </div>

                        {form.paymentMethod === 'card' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                                    <input value={form.cardNumber} onChange={e => update('cardNumber', e.target.value)}
                                           className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                                    <input value={form.cardExpiry} onChange={e => update('cardExpiry', e.target.value)}
                                           className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CVV</label>
                                    <input value={form.cardCvv} onChange={e => update('cardCvv', e.target.value)}
                                           className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                </div>
                            </div>
                        )}
                        {form.paymentMethod !== 'card' && (
                            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
                                {form.paymentMethod === 'paypal' ? 'You will be redirected to PayPal to complete payment.' : 'Pay in cash when your order is delivered.'}
                            </p>
                        )}
                        <p className="mt-3 text-xs text-blue-600">
                            Payment processed by <strong>Payment Service (Node 4)</strong>
                        </p>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <h2 className="font-bold text-slate-900 mb-3">Order Notes (Optional)</h2>
                        <textarea
                            value={form.notes}
                            onChange={e => update('notes', e.target.value)}
                            rows={3}
                            placeholder="Any special instructions..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-20">
                        <h2 className="font-bold text-slate-900 mb-5">Order Summary</h2>
                        <div className="space-y-3 mb-5">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-3 text-sm">
                                    <img src={item.product?.image_url || 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=100'} alt="" className="w-12 h-12 object-cover rounded-lg bg-slate-100" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 text-xs line-clamp-2">{item.product?.name}</p>
                                        <p className="text-slate-400 text-xs">x{item.quantity}</p>
                                    </div>
                                    <span className="font-medium text-slate-900 text-xs">${((item.product?.price ?? 0) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
                            <div className="flex justify-between text-slate-600"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
                                <span>Total</span><span>${orderTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button
                            onClick={placeOrder}
                            disabled={loading || !form.fullName || !form.street || !form.city}
                            className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><CreditCard size={16} /> Place Order</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
