import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ShoppingCart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    products?: AIProduct[];
    intent?: string;
}

interface AIProduct {
    id: number;
    name: string;
    price: number;
    category: string;
    slug: string;
    image_url: string;
    in_stock: boolean;
}

const AI_SERVICE = import.meta.env.VITE_API_AI_SERVICE || 'http://localhost:8085';

const QUICK_ACTIONS = [
    { label: 'Recommend me something', icon: '🎯' },
    { label: 'Products under $100', icon: '💰' },
    { label: 'Show me electronics', icon: '💻' },
    { label: 'How does the system work?', icon: '🏗️' },
];

export default function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hi! I'm your **DistriShop AI assistant**. I can help you find products, get recommendations, compare items, or learn about our distributed architecture. What can I help you with?", intent: 'greeting' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { addToCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        function handleOpenChat() { setOpen(true); }
        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    async function sendMessage(text?: string) {
        const msg = text || input.trim();
        if (!msg || loading) return;
        setInput('');
        setShowQuickActions(false);
        setLoading(true);

        const userMsg: ChatMessage = { role: 'user', content: msg };
        const updated = [...messages, userMsg];
        setMessages(updated);

        try {
            const res = await fetch(`${AI_SERVICE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updated }),
            });
            const data = await res.json();
            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: data.reply || "I'm having trouble right now. Please try again.",
                products: (data.products || []).map((p: any) => ({
                    ...p,
                    imageUrl: p.image_url,
                    inStock: p.in_stock,
                })),
                intent: data.intent,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having connection issues. Please try again in a moment.",
            }]);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddToCart(productId: string) {
        if (!user) { toast.error('Please sign in'); return; }
        try {
            await addToCart(productId);
            toast.success('Added to cart!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to add');
        }
    }

    function renderMarkdown(text: string) {
        return text.split('\n').map((line, i) => {
            const isBold = /\*\*(.+?)\*\*/.test(line);
            const isItalic = /\*(.+?)\*/.test(line) && !isBold;
            const isBullet = /^[-•]\s/.test(line);
            const isHeading = /^#{1,3}\s/.test(line);

            let content = line
                .replace(/^#{1,3}\s/, '')
                .replace(/^[-•]\s/, '')
                .replace(/\*\*(.+?)\*\*/g, '$1')
                .replace(/\*(.+?)\*/g, '$1');

            if (isHeading) {
                return <p key={i} className="font-semibold text-slate-900 mt-2 mb-1">{content}</p>;
            }
            if (isBullet) {
                return (
                    <div key={i} className="flex gap-2 ml-1">
                        <span className="text-blue-400 mt-0.5">&#8226;</span>
                        <span>{content}</span>
                    </div>
                );
            }
            if (isBold || isItalic) {
                return <p key={i} className="leading-relaxed font-medium">{content}</p>;
            }
            if (!line.trim()) return <div key={i} className="h-2" />;
            return <p key={i} className="leading-relaxed">{content}</p>;
        });
    }

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={() => setOpen(!open)}
                className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 ${
                    open
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:scale-105'
                }`}
            >
                {open ? <X size={20} /> : <><Sparkles size={18} /> <span className="text-sm font-semibold hidden sm:inline">AI Assistant</span> <MessageCircle size={18} /></>}
            </button>

            {/* Chat panel */}
            {open && (
                <div className="fixed bottom-20 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden ai-chat-enter"
                     style={{ height: 'min(560px, calc(100vh - 8rem))' }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 flex items-center gap-3 flex-shrink-0">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">DistriShop AI</p>
                            <p className="text-blue-100 text-xs">Smart shopping assistant</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5'
                                    : 'bg-slate-50 text-slate-800 rounded-2xl rounded-bl-md px-4 py-2.5'
                                }`}>
                                    <div className="text-sm">{renderMarkdown(msg.content)}</div>

                                    {/* Product cards */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {msg.products.map(p => (
                                                <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-2.5 flex gap-2.5 group hover:border-blue-200 transition-colors">
                                                    <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <Link to={`/products/${p.slug}`} onClick={() => setOpen(false)}
                                                              className="text-xs font-semibold text-slate-900 hover:text-blue-600 line-clamp-1 transition-colors">
                                                            {p.name}
                                                        </Link>
                                                        <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                                                        <div className="flex items-center justify-between mt-1.5">
                                                            <span className="text-xs font-bold text-slate-900">${p.price.toFixed(2)}</span>
                                                            <div className="flex gap-1.5">
                                                                <button
                                                                    onClick={() => handleAddToCart(String(p.id))}
                                                                    className="flex items-center gap-1 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-md hover:bg-blue-700 transition-colors"
                                                                >
                                                                    <ShoppingCart size={10} /> Add
                                                                </button>
                                                                <Link
                                                                    to={`/products/${p.slug}`}
                                                                    onClick={() => setOpen(false)}
                                                                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                                                                >
                                                                    <ExternalLink size={10} /> View
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick actions */}
                    {showQuickActions && messages.length <= 1 && (
                        <div className="px-4 pb-2 flex-shrink-0">
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_ACTIONS.map(a => (
                                    <button
                                        key={a.label}
                                        onClick={() => sendMessage(a.label)}
                                        className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        <span>{a.icon}</span> {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t border-slate-100 px-4 py-3 flex-shrink-0">
                        <form
                            onSubmit={e => { e.preventDefault(); sendMessage(); }}
                            className="flex items-center gap-2"
                        >
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
