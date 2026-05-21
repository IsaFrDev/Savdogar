import { useState, useEffect } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    TrendingUp, DollarSign, ShoppingBag,
    ArrowUpRight, Download,
    Loader2, Award
} from 'lucide-react';
import { analyticsApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface AnalyticsDashboardProps {
    storeId: number;
}

export function AnalyticsDashboard({ storeId }: AnalyticsDashboardProps) {
    const { t, language, currency } = useApp();
    const [loading, setLoading] = useState(true);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        growth: 12.5
    });

    useEffect(() => {
        loadData();
    }, [storeId, period]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesRes, topRes] = await Promise.all([
                analyticsApi.getSales(storeId, period),
                analyticsApi.getTopProducts(storeId, 5)
            ]);

            const formattedSales = salesRes.data.data.map((item: any) => ({
                date: new Date(item.date).toLocaleDateString(language === 'uz' ? 'uz-UZ' : 'ru-RU', {
                    day: 'numeric', month: 'short'
                }),
                revenue: parseFloat(item.revenue),
                orders: item.count
            }));

            setSalesData(formattedSales);
            setTopProducts(topRes.data);

            // Simple totals calculation
            const revenue = salesRes.data.data.reduce((sum: number, item: any) => sum + parseFloat(item.revenue), 0);
            const orders = salesRes.data.data.reduce((sum: number, item: any) => sum + item.count, 0);

            setStats({
                totalRevenue: revenue,
                totalOrders: orders,
                avgOrderValue: orders > 0 ? revenue / orders : 0,
                growth: 15.2 // Mock growth
            });
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
        setLoading(false);
    };

    const handleExport = async (type: 'orders' | 'products' | 'customers') => {
        try {
            const response = await analyticsApi.exportData(storeId, type);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loadingAnalytics')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header & Period Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">{t('analyticsTitle')}</h1>
                    <p className="text-slate-400 font-medium tracking-wide">{t('trackPerformance')}</p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px - 4 py - 2 rounded - xl text - xs font - black uppercase tracking - widest transition - all ${period === p
                                ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]'
                                : 'text-slate-400 hover:text-white'
                                } `}
                        >
                            {t(p)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('totalRevenueTitle'), value: stats.totalRevenue, icon: DollarSign, color: 'indigo', format: true },
                    { label: t('totalOrders'), value: stats.totalOrders, icon: ShoppingBag, color: 'purple', format: false },
                    { label: t('averageOrderValue'), value: stats.avgOrderValue, icon: TrendingUp, color: 'emerald', format: true },
                    { label: t('growth'), value: stats.growth + '%', icon: Award, color: 'amber', format: false },
                ].map((item, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl border-white/5 relative overflow-hidden group">
                        <div className={`absolute top - 0 right - 0 w - 24 h - 24 bg - ${item.color} -500 / 5 blur - 3xl rounded - full - mr - 8 - mt - 8`} />
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className={`p - 3 rounded - 2xl bg - ${item.color} -500 / 10 text - ${item.color} -400`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 font-black text-xs">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+8%</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{item.label}</p>
                        <h3 className="text-2xl font-black text-white tracking-tight">
                            {item.format ? item.value.toLocaleString() : item.value}
                            {item.format && <span className="text-xs text-slate-500 ml-1.5">{currency}</span>}
                        </h3>
                    </div>
                ))}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-white/5 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            {t('salesDynamics')}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleExport('orders')}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="h-[300px] w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#ffffff20"
                                    fontSize={10}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#ffffff20"
                                    fontSize={10}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v / 1000} k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 shadow-2xl">
                    <h3 className="font-black text-white uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        {t('topProductsTitle')}
                    </h3>
                    <div className="space-y-6">
                        {topProducts.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--primary-foreground)] transition-all shadow-lg border border-white/10 shadow-[var(--brand-primary-glow)]">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate uppercase tracking-tight">{p.product_name}</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        {p.total_sold} {t('unitsSoldAnalytics')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white">
                                        {(parseFloat(p.total_revenue) / 1000).toFixed(1)}k
                                    </p>
                                    <p className="text-[10px] text-emerald-400 font-bold">+{i < 2 ? '12%' : '5%'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handleExport('products')}
                        className="w-full mt-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-2 group shadow-xl"
                    >
                        {t('allReports')}
                        <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
