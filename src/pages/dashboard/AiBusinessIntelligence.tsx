import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, TrendingUp, Users, DollarSign,
    Sparkles, Check
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area, Line
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import AICompetitorMonitor from '../../components/AICompetitorMonitor';

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-6 ${className}`}
    >
        {children}
    </motion.div>
);

const AiBusinessIntelligence = () => {
    const { t, language, currentStore, formatPrice } = useApp();
    const [activeTab, setActiveTab] = useState<'forecast' | 'pricing' | 'customers' | 'competitors'>('forecast');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (currentStore) {
            fetchAiData();
        }
    }, [activeTab, currentStore]);

    const fetchAiData = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'forecast' && currentStore) {
                res = await supabaseApi.products.getAiAnalytics(String(currentStore.id));
                setData(parseAiJson(res.data.forecast));
            } else if (activeTab === 'pricing' && currentStore) {
                res = await supabaseApi.products.getAiDynamicPricing(String(currentStore.id));
                setData(parseAiJson(res.data.suggestions));
            } else if (activeTab === 'customers' && currentStore) {
                res = await supabaseApi.products.getAiCustomerInsights(String(currentStore.id));
                setData(parseAiJson(res.data.insights));
            }
        } catch (error) {
            console.error("AI Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPricing = async (item: any) => {
        if (!item.product_id) return;
        try {
            await supabaseApi.products.update(item.product_id, {
                price: item.suggested_price || item.suggested
            });
            alert(language === 'uz' ? "Narx muvaffaqiyatli yangilandi" : "Price updated successfully");
            fetchAiData(); // Refresh
        } catch (error) {
            console.error("Failed to apply pricing:", error);
            alert("Error applying price");
        }
    };

    const parseAiJson = (text: string) => {
        try {
            // Clean up potential markdown formatting from Gemini
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (e) {
            return text;
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-primary)] to-[var(--brand-primary)] bg-clip-text text-transparent flex items-center gap-3 tracking-tight">
                        <Brain className="w-10 h-10 text-[var(--brand-primary)] animate-pulse" />
                        {t('aiBusinessIntel')}
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">
                        {t('geminiAnalysis')}
                    </p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    {(['forecast', 'pricing', 'customers', 'competitors'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-[var(--brand-primary-glow)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t(tab)}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-[500px] flex flex-col items-center justify-center gap-4"
                    >
                        <div className="w-16 h-16 border-4 border-[var(--brand-primary)]/10 border-t-[var(--brand-primary)] rounded-full animate-spin" />
                        <p className="text-[var(--brand-primary)] animate-pulse font-black uppercase tracking-widest text-xs">
                            {t('miningInsights')}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {activeTab === 'forecast' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <GlassCard className="lg:col-span-2">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2 uppercase tracking-tight">
                                            <TrendingUp className="text-emerald-500 w-5 h-5" />
                                            {t('revenuePrediction')}
                                        </h3>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-3 py-1.5 rounded-full border border-[var(--brand-primary)]/20">
                                            {t('confidence')}: {data?.confidence_score ? Math.round(data.confidence_score * 100) : '0'}%
                                        </div>
                                    </div>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <AreaChart data={data?.forecast_data || [
                                                { day: 'Mon', revenue: 0, pred: 0 },
                                            ]}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                                <XAxis dataKey="day" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                                    itemStyle={{ color: 'var(--text-main)' }}
                                                />
                                                <Area type="monotone" dataKey="pred" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeDasharray="5 5" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </GlassCard>

                                <div className="space-y-6">
                                    <GlassCard className="border-[var(--brand-primary)]/10 bg-[var(--brand-primary)]/5">
                                        <h4 className="text-[var(--brand-primary)] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            {t('aiInsight')}
                                        </h4>
                                        <p className="text-slate-400 leading-relaxed text-xs font-medium">
                                            {data?.forecast_summary || "..."}
                                        </p>
                                    </GlassCard>

                                    <GlassCard className="border-white/5">
                                        <h4 className="text-slate-400 font-black text-xs uppercase tracking-widest mb-4">{t('trendingNow')}</h4>
                                        <div className="space-y-3">
                                            {(data?.trending_products || ['Product A', 'Product B']).map((p: string, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                    <span className="text-sm">{p}</span>
                                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pricing' && (
                            <GlassCard>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(Array.isArray(data) ? data : [
                                        { name: 'Red T-Shirt', original: 150000, suggested: 125000, reason: 'High stock for 2 months' },
                                        { name: 'Blue Jeans', original: 450000, suggested: 420000, reason: 'Seasonal clearance' },
                                        { name: 'Leather Belt', original: 85000, suggested: 95000, reason: 'Low stock & high demand' }
                                    ]).map((item: any, i: number) => (
                                        <div key={i} className="group p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2 bg-[var(--brand-primary)]/20 rounded-xl">
                                                    <DollarSign className="w-5 h-5 text-[var(--brand-primary)]" />
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${item.suggested < item.original ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {item.suggested < item.original ? 'Discount' : 'Increase'}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{item.reason}</p>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500 line-through">{formatPrice(item.original)}</p>
                                                    <p className="text-xl font-bold text-[var(--brand-primary)]">{formatPrice(item.suggested)}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleApplyPricing(item)}
                                                    className="p-2 bg-[var(--brand-primary)] text-[var(--primary-foreground)] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title={language === 'uz' ? "Qo'shish" : "Apply"}
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        )}

                        {activeTab === 'customers' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {Object.entries(data?.segments || {
                                    'Loyal': 'Top 10% spenders. Offer VIP membership.',
                                    'At Risk': 'Have not ordered in 30 days. Send "We miss you" promo.',
                                    'Potential': 'Active browsers. Show similar high-rated products.',
                                    'New': 'First-time buyers. Give 10% discount for next order.'
                                }).map(([segment, action]: any, i: number) => (
                                    <GlassCard key={i} className="flex flex-col h-full">
                                        <div className="mb-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${segment === 'Loyal' ? 'bg-yellow-500/20 text-yellow-500' :
                                                segment === 'At Risk' ? 'bg-red-500/20 text-red-500' :
                                                    segment === 'New' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                                                }`}>
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-xl font-bold">{segment}</h4>
                                        </div>
                                        <p className="text-gray-400 text-sm flex-grow">
                                            {action}
                                        </p>
                                        <button className="mt-6 w-full py-3 bg-white/5 hover:bg-[var(--brand-primary)] border border-white/5 hover:border-[var(--brand-primary)]/50 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[var(--primary-foreground)]">
                                            {t('executeCampaign')}
                                        </button>
                                    </GlassCard>
                                ))}
                            </div>
                        )}

                        {activeTab === 'competitors' && (
                            <AICompetitorMonitor storeId={currentStore?.id || 0} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiBusinessIntelligence;
