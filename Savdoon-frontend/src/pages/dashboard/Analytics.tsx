import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Eye, Loader2, Sparkles, Download } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { orderApi, analyticsApi } from '../../services/api';
import { Button } from '../../components/Button';
import { GlassCard } from '../../components/GlassCard';

interface AnalyticsProps {
  storeId?: number;
}

const COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];

export function Analytics({ storeId }: AnalyticsProps) {
  const { t, language, currency } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);

  const trafficSources = [
    { name: language === 'uz' ? 'To\'g\'ridan-to\'g\'ri' : language === 'ru' ? 'Прямой' : 'Direct', value: 40, color: '#818cf8' },
    { name: language === 'uz' ? 'Qidiruv' : language === 'ru' ? 'Поиск' : 'Search', value: 30, color: '#a78bfa' },
    { name: language === 'uz' ? 'Ijtimoiy tarmoqlar' : language === 'ru' ? 'Соцсети' : 'Social', value: 20, color: '#c084fc' },
    { name: language === 'uz' ? 'Yo\'llanmalar' : language === 'ru' ? 'Рефералы' : 'Referral', value: 10, color: '#e879f9' },
  ];

  useEffect(() => {
    if (storeId) {
      loadStats();
    }
  }, [storeId, period]);

  const loadStats = async () => {
    if (!isRefreshing) setLoading(true);
    try {
      const response = await orderApi.getStats(storeId, period);
      const data = response.data;
      setStats(data);
      if (data.history) generateForecast(data.history);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  const generateForecast = (history: any[]) => {
    if (history.length < 2) return;

    // Simple velocity-based forecasting
    const lastPoint = history[history.length - 1];
    const prevPoint = history[history.length - 2];

    const revenueGrowth = (lastPoint.revenue - prevPoint.revenue) / (prevPoint.revenue || 1);
    const ordersGrowth = (lastPoint.orders - prevPoint.orders) / (prevPoint.orders || 1);

    const projectedRevenue = Math.max(0, lastPoint.revenue * (1 + revenueGrowth * 0.5));
    const projectedOrders = Math.max(0, Math.round(lastPoint.orders * (1 + ordersGrowth * 0.5)));

    setForecastData([
      ...history.map(h => ({ ...h, isForecast: false })),
      {
        month: language === 'uz' ? 'Bashorat' : language === 'ru' ? 'Прогноз' : 'Forecast',
        revenue: projectedRevenue,
        orders: projectedOrders,
        isForecast: true
      }
    ]);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setIsRefreshing(true);
  };

  const statCards = [
    { label: t('totalRevenue'), value: stats?.total_revenue?.toLocaleString() + ' ' + currency || '0 ' + currency, change: '+18.2%', up: true, icon: DollarSign },
    { label: t('totalVisitors'), value: '1.2K', change: '+5.4%', up: true, icon: Eye },
    { label: t('totalOrders'), value: stats?.total_orders || '0', change: '+12.3%', up: true, icon: ShoppingBag },
    { label: t('conversionRate'), value: '3.8%', change: '+0.2%', up: true, icon: Users },
  ];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
        <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">{t('loading') || 'Yuklanmoqda...'}</p>
      </div>
    );
  }

  const categoryStats = (stats?.category_stats || []).map((item: any, idx: number) => ({
    ...item,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase">{t('analytics')}</h1>
          <p className="text-[var(--text-muted)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">{t('trackStorePerformance')}</p>
        </div>

        <div className="flex flex-wrap gap-3 p-1 bg-slate-50 rounded-xl border border-[var(--color-border)] relative h-fit self-end items-center shadow-sm">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showForecast
              ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100'
              }`}
          >
            <Sparkles className={`w-3 h-3 ${showForecast ? 'animate-pulse' : ''}`} />
            {language === 'uz' ? 'Bashorat' : language === 'ru' ? 'Прогноз' : 'AI Forecast'}
          </button>

          <div className="w-[1px] h-4 bg-[var(--color-border)] hidden sm:block" />

          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all relative z-10 ${period === p ? 'text-[var(--primary-foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              {p}
              {period === p && (
                <motion.div
                  layoutId="analyticsPeriod"
                  className="absolute inset-0 bg-[var(--brand-primary)] rounded-lg shadow-lg shadow-[var(--brand-primary-glow)] -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
          {isRefreshing && (
            <div className="absolute -top-10 right-0 flex items-center gap-2 bg-[var(--brand-primary)]/10 px-3 py-1.5 rounded-lg border border-[var(--brand-primary)]/20">
              <Loader2 className="w-3 h-3 text-[var(--brand-primary)] animate-spin" />
              <span className="text-[9px] text-[var(--brand-primary)] uppercase font-black tracking-widest">Yangilanmoqda...</span>
            </div>
          )}
        </div>
      </div>

      {/* Export Reports Section */}
      <GlassCard delay={0.2} className="p-4 border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">{t('downloadReports') || 'Hisobotlar'}</h3>
          <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Excel formatida yuklab oling</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="w-3 h-3" />}
            onClick={() => {
              if (storeId) {
                analyticsApi.exportData(storeId, 'orders').then(response => {
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `orders_report_${storeId}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                });
              }
            }}
            className="text-[10px] h-9 px-4 border-[var(--color-border)] hover:border-[var(--brand-primary)]/50"
          >
            {t('orders') || 'Buyurtmalar'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="w-3 h-3" />}
            onClick={() => {
              if (storeId) {
                analyticsApi.exportData(storeId, 'products').then(response => {
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `products_report_${storeId}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                });
              }
            }}
            className="text-[10px] h-9 px-4 border-[var(--color-border)] hover:border-[var(--brand-primary)]/50"
          >
            {t('products') || 'Mahsulotlar'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="w-3 h-3" />}
            onClick={() => {
              if (storeId) {
                analyticsApi.exportData(storeId, 'customers').then(response => {
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `customers_report_${storeId}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                });
              }
            }}
            className="text-[10px] h-9 px-4 border-[var(--color-border)] hover:border-[var(--brand-primary)]/50"
          >
            {t('customers') || 'Mijozlar'}
          </Button>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <GlassCard key={stat.label} delay={index * 0.1} className="p-6 group hover:bg-slate-50 border-[var(--color-border)] hover:border-[var(--brand-primary)]/20 transition-all duration-500 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-[var(--text-primary)] mt-1.5 truncate tracking-tight">{stat.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-wider ${stat.up ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                  {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex-shrink-0 shadow-lg shadow-[var(--brand-primary-glow)] group-hover:scale-110 transition-transform">
                <stat.icon className="w-5 h-5 text-[var(--brand-primary)]" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Revenue Chart */}
      <GlassCard delay={0.3} className="p-6 lg:p-8 border-[var(--color-border)] shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">{t('revenueAndOrders')}</h2>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{t('monthlyPerformance')}</p>
          </div>
          <div className="hidden sm:flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] shadow-[0_0_10px_var(--brand-primary-glow)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('revenue')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-secondary)] shadow-[0_0_10px_rgba(237,28,36,0.3)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('orders')}</span>
            </div>
          </div>
        </div>
        <div className="h-80 min-h-[320px] w-full relative">
          <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
            <LineChart data={showForecast ? forecastData : (stats?.history || [])}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-primary)' }}
                labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900' }}
              />
              <Legend verticalAlign="top" height={36} content={(props) => {
                const { payload } = props;
                return (
                  <ul className="flex justify-end gap-6 mb-8 sm:hidden">
                    {payload?.map((entry: any, index: number) => (
                      <li key={`item-${index}`} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                );
              }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name={t('revenue')}
                stroke="#6366f1"
                strokeWidth={4}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isForecast) return null;
                  return <circle cx={cx} cy={cy} r={4} fill="#6366f1" strokeWidth={2} />;
                }}
                strokeDasharray={showForecast ? "5 5" : "0"}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                animationDuration={2000}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name={t('orders')}
                stroke="#a855f7"
                strokeWidth={4}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isForecast) return null;
                  return <circle cx={cx} cy={cy} r={4} fill="#a855f7" strokeWidth={2} />;
                }}
                strokeDasharray={showForecast ? "5 5" : "0"}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {
          showForecast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-[var(--brand-primary)]/10 to-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center gap-6 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)]/20 flex items-center justify-center text-[var(--brand-primary)] group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-1">
                  {language === 'uz' ? 'AI Bashorat Insight' : language === 'ru' ? 'AI Прогноз Инсайт' : 'AI Forecast Insight'}
                </h4>
                <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
                  {language === 'uz'
                    ? `Sotuvlar tendensiyasi keyingi hafta davomida taxminan ${stats?.history ? Math.round(((forecastData[forecastData.length - 1]?.revenue / stats.history[stats.history.length - 1]?.revenue) - 1) * 100) : 15}% o'sishi kutilmoqda.`
                    : language === 'ru'
                      ? `Ожидается рост продаж примерно на ${stats?.history ? Math.round(((forecastData[forecastData.length - 1]?.revenue / stats.history[stats.history.length - 1]?.revenue) - 1) * 100) : 15}% в течение следующей недели.`
                      : `Sales are expected to grow by approximately ${stats?.history ? Math.round(((forecastData[forecastData.length - 1]?.revenue / stats.history[stats.history.length - 1]?.revenue) - 1) * 100) : 15}% over the next week.`}
                </p>
              </div>
            </motion.div>
          )
        }
      </GlassCard >

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.4} className="p-6 lg:p-8 border-[var(--color-border)] shadow-sm">
          <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight mb-2 uppercase">{t('salesByCategory')}</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-8">{t('monthlyPerformance')}</p>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-full sm:w-1/2 h-64 min-h-[256px] relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
                <PieChart>
                  <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid var(--color-border)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-4">
              {categoryStats.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                    <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-[var(--text-primary)] tabular-nums">{item.value}%</span>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                  <ShoppingBag className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('noData') || 'Ma\'lumotlar yo\'q'}</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.5} className="p-6 lg:p-8 border-[var(--color-border)] shadow-sm">
          <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight mb-2 uppercase">{t('trafficSources')}</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-8">{t('today')}</p>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-full sm:w-1/2 h-64 min-h-[256px] relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
                <PieChart>
                  <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-4">
              {trafficSources.map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                    <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-[var(--text-primary)] tabular-nums">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
