import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Loader2, Brain } from 'lucide-react';
import api from '../services/api';

interface ForecastWidgetProps {
    storeId?: number;
    language: string;
}

export function ForecastWidget({ storeId, language }: ForecastWidgetProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const labels = {
        title: language === 'uz' ? '📊 Savdo Prognozi' : language === 'ru' ? '📊 Прогноз продаж' : '📊 Sales Forecast',
        trend: language === 'uz' ? 'Trend' : language === 'ru' ? 'Тренд' : 'Trend',
        avgDaily: language === 'uz' ? 'O\'rtacha kunlik' : language === 'ru' ? 'Среднее за день' : 'Avg. Daily',
        forecast7d: language === 'uz' ? '7 kunlik prognoz' : language === 'ru' ? 'Прогноз на 7 дней' : '7-Day Forecast',
        up: language === 'uz' ? 'Oshmoqda' : language === 'ru' ? 'Растёт' : 'Growing',
        down: language === 'uz' ? 'Tushmoqda' : language === 'ru' ? 'Падает' : 'Declining',
        stable: language === 'uz' ? 'Barqaror' : language === 'ru' ? 'Стабильно' : 'Stable',
    };

    useEffect(() => {
        loadForecast();
    }, [storeId]);

    const loadForecast = async () => {
        setLoading(true);
        try {
            const params = storeId ? `?store_id=${storeId}` : '';
            const response = await api.get(`/analytics/forecast/${params}`);
            setData(response.data);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-card rounded-3xl p-6 flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!data) return null;

    const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
    const trendColor = data.trend === 'up' ? 'text-emerald-500' : data.trend === 'down' ? 'text-red-500' : 'text-amber-500';
    const trendBg = data.trend === 'up' ? 'bg-emerald-500/10' : data.trend === 'down' ? 'bg-red-500/10' : 'bg-amber-500/10';
    const trendLabel = data.trend === 'up' ? labels.up : data.trend === 'down' ? labels.down : labels.stable;

    // Calculate max for chart scaling
    const allValues = [
        ...(data.historical || []).map((h: any) => h.sales),
        ...(data.forecast || []).map((f: any) => f.projected_sales)
    ];
    const maxVal = Math.max(...allValues, 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6 space-y-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-500" />
                    {labels.title}
                </h3>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${trendBg} ${trendColor}`}>
                    <TrendIcon className="w-3 h-3" />
                    {trendLabel} {data.change_pct > 0 ? '+' : ''}{data.change_pct}%
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--bg-surface)]">
                    <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase">{labels.avgDaily}</p>
                    <p className="text-lg font-black text-[var(--text-main)]">{Number(data.avg_daily).toLocaleString()} <span className="text-xs text-[var(--text-dim)]">UZS</span></p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-surface)]">
                    <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase">30d Total</p>
                    <p className="text-lg font-black text-[var(--text-main)]">{Number(data.total_period).toLocaleString()} <span className="text-xs text-[var(--text-dim)]">UZS</span></p>
                </div>
            </div>

            {/* Mini Chart */}
            <div className="h-24 flex items-end gap-[2px]">
                {/* Historical bars */}
                {(data.historical || []).slice(-14).map((h: any, i: number) => (
                    <motion.div
                        key={`h-${i}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(4, (h.sales / maxVal) * 100)}%` }}
                        transition={{ delay: i * 0.03 }}
                        className="flex-1 bg-[var(--brand-primary)]/40 rounded-t-sm min-h-[4px]"
                        title={`${h.date}: ${Number(h.sales).toLocaleString()} UZS`}
                    />
                ))}
                {/* Forecast bars (dashed look) */}
                {(data.forecast || []).map((f: any, i: number) => (
                    <motion.div
                        key={`f-${i}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(4, (f.projected_sales / maxVal) * 100)}%` }}
                        transition={{ delay: (14 + i) * 0.03 }}
                        className="flex-1 bg-violet-500/30 rounded-t-sm min-h-[4px] border-l border-dashed border-violet-500/20"
                        title={`${f.date}: ~${Number(f.projected_sales).toLocaleString()} UZS`}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between text-[9px] text-[var(--text-dim)]">
                <span>30 days ago</span>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--brand-primary)]/40 rounded-sm" /> Historical</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-500/30 rounded-sm" /> Forecast</span>
                </div>
                <span>+7 days</span>
            </div>

            {/* AI Insight */}
            {data.insight && (
                <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                    <p className="text-xs text-[var(--text-main)]">{data.insight}</p>
                </div>
            )}
        </motion.div>
    );
}
