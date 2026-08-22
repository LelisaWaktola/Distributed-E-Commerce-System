import { useState, useRef, useEffect } from 'react';
import { Sparkles, Search, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AI_SERVICE = import.meta.env.VITE_API_AI_SERVICE || 'http://localhost:8085';

const SUGGESTIONS = [
    'Best headphones for music',
    'Gaming laptop under $1500',
    'Fitness gear for home workout',
    'Kitchen essentials for cooking',
    'Gifts under $100',
];

export default function AISearchBar() {
    const [query, setQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (query.length >= 3) {
            const timer = setTimeout(() => fetchAISuggestions(), 400);
            return () => clearTimeout(timer);
        }
        setAiSuggestions([]);
    }, [query]);

    async function fetchAISuggestions() {
        setAiLoading(true);
        try {
            const res = await fetch(`${AI_SERVICE}/api/products/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setAiSuggestions((data.products || []).slice(0, 3).map((p: any) => p.name));
        } catch {
            setAiSuggestions([]);
        } finally {
            setAiLoading(false);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/products?q=${encodeURIComponent(query.trim())}`);
            setShowDropdown(false);
        }
    }

    function handleSuggestionClick(s: string) {
        setQuery(s);
        navigate(`/products?q=${encodeURIComponent(s)}`);
        setShowDropdown(false);
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <form onSubmit={handleSubmit}>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search with AI... try 'best fitness gear' or 'gifts under $50'"
                        className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
              <Sparkles size={10} /> AI
            </span>
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                            Search
                        </button>
                    </div>
                </div>
            </form>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                    {/* AI suggestions */}
                    {(aiSuggestions.length > 0 || aiLoading) && query.length >= 3 && (
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Sparkles size={10} /> AI Suggestions
                            </p>
                            {aiLoading ? (
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" /> Thinking...
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {aiSuggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSuggestionClick(s)}
                                            className="w-full flex items-center justify-between text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors"
                                        >
                      <span className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-blue-400" />
                          {s}
                      </span>
                                            <ArrowRight size={12} className="text-slate-300" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Default suggestions */}
                    <div className="px-4 py-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Popular Searches</p>
                        <div className="flex flex-wrap gap-1.5">
                            {SUGGESTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
