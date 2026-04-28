import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ServiceHealth, InterServiceCall } from '../types';
import { Server, Activity, ArrowRight, RefreshCw, Wifi, WifiOff, AlertTriangle, Clock, CheckCircle2, TrendingUp, Database, GitBranch } from 'lucide-react';
import Badge from '../components/ui/Badge';

const SERVICE_COLORS: Record<string, string> = {
    'user-service': 'bg-blue-500',
    'product-service': 'bg-emerald-500',
    'order-service': 'bg-amber-500',
    'payment-service': 'bg-rose-500',
};

const SERVICE_LABELS: Record<string, string> = {
    'user-service': 'User Service',
    'product-service': 'Product Service',
    'order-service': 'Order Service',
    'payment-service': 'Payment Service',
};

const NODE_DESCRIPTIONS: Record<string, { port: number; desc: string; responsibilities: string[] }> = {
    'user-service': {
        port: 8081,
        desc: 'Handles user registration, login, authentication, and profile management.',
        responsibilities: ['User Registration', 'JWT Authentication', 'Profile Management', 'Session Tracking'],
    },
    'product-service': {
        port: 8082,
        desc: 'Manages product catalog, categories, inventory, and search functionality.',
        responsibilities: ['Product CRUD', 'Category Management', 'Stock Tracking', 'Search & Filter'],
    },
    'order-service': {
        port: 8083,
        desc: 'Coordinates cart management, order placement, and communicates with other services.',
        responsibilities: ['Cart Management', 'Order Placement', 'Stock Verification', 'Order History'],
    },
    'payment-service': {
        port: 8084,
        desc: 'Processes payment simulation, confirms transactions, and manages payment status.',
        responsibilities: ['Payment Processing', 'Transaction Management', 'Refund Handling', 'Payment History'],
    },
};

function StatusDot({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
    return (
        <span className={`inline-flex w-2.5 h-2.5 rounded-full ${status === 'healthy' ? 'bg-green-500' : status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'} animate-${status === 'healthy' ? 'pulse' : 'none'}`} />
    );
}

function formatUptime(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

export default function DistributedMonitorPage() {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [calls, setCalls] = useState<InterServiceCall[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [simulating, setSimulating] = useState(false);

    const load = useCallback(async () => {
        const [{ data: svc }, { data: callData }] = await Promise.all([
            supabase.from('service_health').select('*').order('service_name'),
            supabase.from('inter_service_calls').select('*').order('called_at', { ascending: false }).limit(20),
        ]);
        setServices(svc ?? []);
        setCalls(callData ?? []);
        setLastRefresh(new Date());
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [load]);

    async function simulateActivity() {
        setSimulating(true);

        // Simulate inter-service calls
        const newCalls = [
            { from_service: 'order-service', to_service: 'product-service', endpoint: '/api/products/stock/bulk-check', method: 'POST', status_code: 200, response_time_ms: Math.floor(Math.random() * 80 + 20), success: true },
            { from_service: 'order-service', to_service: 'user-service', endpoint: '/api/users/verify', method: 'GET', status_code: 200, response_time_ms: Math.floor(Math.random() * 50 + 10), success: true },
            { from_service: 'order-service', to_service: 'payment-service', endpoint: '/api/payments/initiate', method: 'POST', status_code: 200, response_time_ms: Math.floor(Math.random() * 150 + 50), success: true },
            { from_service: 'payment-service', to_service: 'order-service', endpoint: '/api/orders/confirm', method: 'PATCH', status_code: 200, response_time_ms: Math.floor(Math.random() * 40 + 15), success: true },
            { from_service: 'product-service', to_service: 'order-service', endpoint: '/api/orders/status', method: 'GET', status_code: 200, response_time_ms: Math.floor(Math.random() * 30 + 10), success: true },
        ];

        await supabase.from('inter_service_calls').insert(newCalls);

        // Update service health stats
        for (const service of services) {
            await supabase.from('service_health').update({
                uptime_seconds: service.uptime_seconds + 30,
                request_count: service.request_count + Math.floor(Math.random() * 10 + 1),
                last_ping: new Date().toISOString(),
                avg_response_ms: Math.floor(Math.random() * 60 + 25),
            }).eq('id', service.id);
        }

        await load();
        setSimulating(false);
    }

    async function simulateFault() {
        const productService = services.find(s => s.service_name === 'product-service');
        if (!productService) return;
        setSimulating(true);

        await supabase.from('service_health').update({ status: 'down' }).eq('id', productService.id);

        await supabase.from('inter_service_calls').insert([
            { from_service: 'order-service', to_service: 'product-service', endpoint: '/api/products/stock/check', method: 'GET', status_code: 503, response_time_ms: 5000, success: false, error_message: 'Connection timeout: Product Service unavailable' },
            { from_service: 'order-service', to_service: 'product-service', endpoint: '/api/products/stock/check', method: 'GET', status_code: 503, response_time_ms: 5000, success: false, error_message: 'Retry 1/3 failed: Service unavailable' },
        ]);

        await load();
        setTimeout(async () => {
            await supabase.from('service_health').update({ status: 'healthy' }).eq('id', productService.id);
            await supabase.from('inter_service_calls').insert([
                { from_service: 'order-service', to_service: 'product-service', endpoint: '/api/products/stock/check', method: 'GET', status_code: 200, response_time_ms: 65, success: true, error_message: null },
            ]);
            await load();
            setSimulating(false);
        }, 5000);
    }

    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const totalRequests = services.reduce((sum, s) => sum + s.request_count, 0);
    const avgResponseMs = services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.avg_response_ms, 0) / services.length) : 0;
    const failedCalls = calls.filter(c => !c.success).length;

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 space-y-4">
                <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity size={24} className="text-blue-600" />
                        Distributed System Monitor
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Real-time visibility across all 4 service nodes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Last refresh: {lastRefresh.toLocaleTimeString()}</span>
                    <button onClick={load} className="flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Services Online', value: `${healthyCount}/${services.length}`, icon: <Server size={18} />, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Total Requests', value: totalRequests.toLocaleString(), icon: <TrendingUp size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Avg Response', value: `${avgResponseMs}ms`, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Failed Calls (last 20)', value: failedCalls, icon: <AlertTriangle size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
                        <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>{stat.icon}</div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Service Nodes */}
            <div id="architecture">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Server size={18} className="text-slate-500" /> Service Nodes
                </h2>
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                    {['user-service', 'product-service', 'order-service', 'payment-service'].map(name => {
                        const svc = services.find(s => s.service_name === name);
                        const info = NODE_DESCRIPTIONS[name];
                        const statusVariant = svc?.status === 'healthy' ? 'success' : svc?.status === 'degraded' ? 'warning' : 'danger';

                        return (
                            <div key={name} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${SERVICE_COLORS[name]}`} />
                                        <span className="font-semibold text-slate-900 text-sm">{SERVICE_LABELS[name]}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <StatusDot status={svc?.status ?? 'down'} />
                                        <Badge variant={statusVariant}>{svc?.status ?? 'unknown'}</Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    {svc?.status === 'healthy' ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500" />}
                                    <span className="text-xs text-slate-500 font-mono">:{info.port}</span>
                                    <span className="text-xs text-slate-400">• {svc?.node_id}</span>
                                </div>

                                <p className="text-xs text-slate-500 leading-relaxed mb-4">{info.desc}</p>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                                        <p className="text-sm font-bold text-slate-900">{svc?.request_count.toLocaleString() ?? 0}</p>
                                        <p className="text-xs text-slate-400">Requests</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                                        <p className="text-sm font-bold text-slate-900">{svc?.avg_response_ms ?? 0}ms</p>
                                        <p className="text-xs text-slate-400">Avg Response</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                                        <p className="text-sm font-bold text-slate-900">{svc ? formatUptime(svc.uptime_seconds) : '0s'}</p>
                                        <p className="text-xs text-slate-400">Uptime</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                                        <p className="text-sm font-bold text-slate-900">{svc?.error_count ?? 0}</p>
                                        <p className="text-xs text-slate-400">Errors</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-2">Responsibilities</p>
                                    <div className="flex flex-wrap gap-1">
                                        {info.responsibilities.map(r => (
                                            <span key={r} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{r}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Architecture Diagram */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <GitBranch size={18} className="text-slate-500" /> Architecture & Inter-Node Communication
                </h2>
                <div className="overflow-x-auto">
                    <div className="flex items-center justify-center gap-3 min-w-fit mx-auto py-4">
                        {/* Client */}
                        <div className="bg-slate-100 rounded-xl p-4 text-center w-28">
                            <div className="w-10 h-10 bg-slate-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">UI</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700">React Client</p>
                            <p className="text-xs text-slate-400">:5173</p>
                        </div>

                        <ArrowRight size={20} className="text-slate-400 flex-shrink-0" />

                        {/* User Service */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center w-32">
                            <div className="w-10 h-10 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">N1</span>
                            </div>
                            <p className="text-xs font-semibold text-blue-800">User Service</p>
                            <p className="text-xs text-blue-500">:8081</p>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <ArrowRight size={20} className="text-slate-400" />
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">REST</span>
                        </div>

                        {/* Order Service */}
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center w-32">
                            <div className="w-10 h-10 bg-amber-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">N3</span>
                            </div>
                            <p className="text-xs font-semibold text-amber-800">Order Service</p>
                            <p className="text-xs text-amber-500">:8083</p>
                        </div>

                        {/* Bidirectional connections to Product and Payment */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <ArrowRight size={20} className="text-slate-400" />
                                {/* Product Service */}
                                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center w-32">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">N2</span>
                                    </div>
                                    <p className="text-xs font-semibold text-emerald-800">Product Service</p>
                                    <p className="text-xs text-emerald-500">:8082</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRight size={20} className="text-slate-400" />
                                {/* Payment Service */}
                                <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-center w-32">
                                    <div className="w-10 h-10 bg-rose-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">N4</span>
                                    </div>
                                    <p className="text-xs font-semibold text-rose-800">Payment Service</p>
                                    <p className="text-xs text-rose-500">:8084</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <ArrowRight size={20} className="text-slate-400" />
                        </div>

                        {/* Database */}
                        <div className="bg-slate-800 rounded-xl p-4 text-center w-32">
                            <div className="flex justify-center mb-2">
                                <Database size={28} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-semibold text-white">PostgreSQL</p>
                            <p className="text-xs text-slate-400">Shared DB</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                    <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Consistency Strategy</h4>
                        <p className="text-xs text-blue-700">
                            <strong>Strong Consistency</strong> — All 4 service nodes share a centralized PostgreSQL database.
                            Each service only reads/writes its own tables, simulating service isolation while maintaining data consistency.
                        </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-amber-800 mb-2">Fault Tolerance</h4>
                        <p className="text-xs text-amber-700">
                            If Product Service fails, Order Service returns: "Product Service unavailable, try again later."
                            Retry mechanisms apply with exponential backoff up to 3 attempts.
                        </p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-emerald-800 mb-2">Scalability</h4>
                        <p className="text-xs text-emerald-700">
                            Services run independently, allowing horizontal scaling. Multiple Product Service instances
                            can be deployed behind an Nginx load balancer with round-robin routing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Simulation Controls */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Distributed System Simulation</h2>
                <p className="text-sm text-slate-500 mb-5">Simulate inter-node communication and fault scenarios to see how the system responds.</p>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={simulateActivity}
                        disabled={simulating}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        <Activity size={16} />
                        {simulating ? 'Simulating...' : 'Simulate Normal Traffic'}
                    </button>
                    <button
                        onClick={simulateFault}
                        disabled={simulating}
                        className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        <WifiOff size={16} />
                        {simulating ? 'Simulating...' : 'Simulate Node Failure (Product Service)'}
                    </button>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw size={16} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* Inter-service call log */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <Activity size={18} className="text-slate-500" /> Inter-Node Communication Log
                    <span className="text-xs font-normal text-slate-400 ml-1">(last 20)</span>
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="text-xs text-slate-500 border-b border-slate-100">
                            <th className="text-left pb-3 pr-4 font-medium">From</th>
                            <th className="text-left pb-3 pr-4 font-medium">To</th>
                            <th className="text-left pb-3 pr-4 font-medium">Endpoint</th>
                            <th className="text-left pb-3 pr-4 font-medium">Method</th>
                            <th className="text-left pb-3 pr-4 font-medium">Status</th>
                            <th className="text-left pb-3 pr-4 font-medium">Latency</th>
                            <th className="text-left pb-3 font-medium">Time</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {calls.map(call => (
                            <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 pr-4">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${SERVICE_COLORS[call.from_service] ?? 'bg-slate-400'}`} />
                                    <span className="text-xs font-medium text-slate-700">{SERVICE_LABELS[call.from_service] ?? call.from_service}</span>
                                </td>
                                <td className="py-3 pr-4">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${SERVICE_COLORS[call.to_service] ?? 'bg-slate-400'}`} />
                                    <span className="text-xs font-medium text-slate-700">{SERVICE_LABELS[call.to_service] ?? call.to_service}</span>
                                </td>
                                <td className="py-3 pr-4">
                                    <span className="text-xs font-mono text-slate-600">{call.endpoint}</span>
                                </td>
                                <td className="py-3 pr-4">
                                    <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{call.method}</span>
                                </td>
                                <td className="py-3 pr-4">
                                    {call.success ? (
                                        <span className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle2 size={12} /> {call.status_code}
                      </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertTriangle size={12} /> {call.status_code}
                      </span>
                                    )}
                                </td>
                                <td className="py-3 pr-4">
                    <span className={`text-xs font-medium ${call.response_time_ms > 500 ? 'text-red-600' : call.response_time_ms > 200 ? 'text-amber-600' : 'text-green-600'}`}>
                      {call.response_time_ms}ms
                    </span>
                                </td>
                                <td className="py-3 text-xs text-slate-400">
                                    {new Date(call.called_at).toLocaleTimeString()}
                                </td>
                            </tr>
                        ))}
                        {calls.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                                    No inter-service calls logged yet. Simulate activity above.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
