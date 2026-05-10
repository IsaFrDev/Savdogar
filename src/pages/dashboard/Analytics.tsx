import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Eye, 
  Loader2, 
  Sparkles, 
  Download,
  Calendar,
  ChevronRight,
  ArrowRight,
  Zap,
  LayoutGrid,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  MousePointer2
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface AnalyticsProps {
  storeId?: number;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export function Analytics({ storeId }: AnalyticsProps) {
  const { t, language, currency, formatPrice } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (storeId) {
      loadStats();
    }
  }, [storeId, period]);

  const loadStats = async () => {
    if (!isRefreshing) setLoading(true);
    try {
      const data = await supabaseApi.orders.getStats(storeId!, period);
      setStats(data);
      if (data.history) generateForecast(data.history);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setLoading(false);
    setLoading(false);
    setIsRefreshing(false);
  };

  const exportToCSV = () => {
    if (!stats) return;
    const headers = ['Period', 'Revenue', 'Orders'];
    const data = (stats.history || []).map((h: any) => [h.month, h.revenue, h.orders]);
    const csvContent = [headers, ...data].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateForecast = (history: any[]) => {
    if (history.length < 2) return;
    const lastPoint = history[history.length - 1];
    const prevPoint = history[history.length - 2];
    
    // Improved logic with some random variance (AI simulation)
    const revenueGrowth = (lastPoint.revenue - prevPoint.revenue) / (prevPoint.revenue || 1);
    const ordersGrowth = (lastPoint.orders - prevPoint.orders) / (prevPoint.orders || 1);
    
    const noise = () => (Math.random() * 0.1 - 0.05); // +/- 5% random variance
    
    const projectedRevenue = Math.max(0, lastPoint.revenue * (1 + (revenueGrowth + noise()) * 0.5));
    const projectedOrders = Math.max(0, Math.round(lastPoint.orders * (1 + (ordersGrowth + noise()) * 0.5)));

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
    { label: t('totalRevenue'), value: formatPrice(stats?.total_revenue || 0), change: '+18.2%', up: true, icon: DollarSign, color: 'from-indigo-600 to-indigo-700' },
    { label: 'Tashriflar', value: '2.4K', change: '+5.4%', up: true, icon: Eye, color: 'from-fuchsia-600 to-fuchsia-700' },
    { label: t('totalOrders'), value: stats?.total_orders || '0', change: '+12.3%', up: true, icon: ShoppingBag, color: 'from-blue-600 to-blue-700' },
    { label: 'Konversiya', value: '4.2%', change: '+0.2%', up: true, icon: Activity, color: 'from-emerald-600 to-emerald-700' },
  ];

  const trafficSources = [
    { name: 'Direct', value: 45, color: '#6366f1' },
    { name: 'Social', value: 25, color: '#a855f7' },
    { name: 'Search', value: 20, color: '#ec4899' },
    { name: 'Ads', value: 10, color: '#f43f5e' },
  ];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  const categoryStats = (stats?.category_stats || []).map((item: any, idx: number) => ({
    ...item,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
             <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Intelligence Hub</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase font-heading">{t('analytics')}</h1>
          <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] font-black">Biznesingiz o'sishini real vaqtda kuzating</p>
        </div>
        
        <div className="flex flex-wrap gap-4 p-2 bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[28px] shadow-2xl items-center">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center gap-3 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${showForecast
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Sparkles className={`w-4 h-4 ${showForecast ? 'animate-pulse' : ''}`} />
            AI Bashorat
          </button>

          <div className="w-px h-8 bg-white/10" />

          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-[20px] transition-all relative z-10 ${period === p ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {p}
              {period === p && (
                <motion.div
                  layoutId="analyticsPeriod"
                  className="absolute inset-0 bg-indigo-600 rounded-[20px] shadow-xl shadow-indigo-600/30 -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
          
          <div className="w-px h-8 bg-white/10" />
          
          <button 
            onClick={exportToCSV}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10 group"
          >
             <Download size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats Grid - High Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, index) => (
          <GlassCard key={stat.label} delay={index * 0.1} className="p-10 border-white/5 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/30 transition-all duration-700 shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all duration-700" />
            <div className="flex items-start justify-between relative z-10">
              <div className="flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <div>
                   <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                   <h3 className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">{stat.value}</h3>
                   <div className={`flex items-center gap-2 mt-3 text-[10px] font-black uppercase tracking-widest ${stat.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                     {stat.change}
                   </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                 <ArrowUpRight size={20} className="text-indigo-500" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Revenue Chart - Large Format */}
      <GlassCard delay={0.4} className="p-12 border-white/5 bg-slate-900/60 rounded-[56px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
           <BarChart3 size={240} className="text-indigo-500" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 relative z-10 gap-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-heading">Sotuvlar Dinamikasi</h2>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
               Haqiqiy vaqt rejimidagi ma'lumotlar
            </p>
          </div>
          
          <div className="flex items-center gap-10">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.8)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('revenue')}</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-fuchsia-600 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('orders')}</span>
             </div>
          </div>
        </div>

        <div className="h-[450px] w-full relative z-10">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={showForecast ? forecastData : (stats?.history || [])}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontWeight: '900', fill: '#64748b' }}
                  dy={15}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontWeight: '900', fill: '#64748b' }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    padding: '24px'
                  }}
                  itemStyle={{ fontWeight: 'black', fontSize: '14px' }}
                  labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.2em' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  animationDuration={2500}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#a855f7"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {showForecast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-8 rounded-[36px] bg-indigo-600/10 border border-indigo-500/20 flex items-center gap-8 group"
          >
            <div className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1">AI Intelligence Insight</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-2xl">
                Tahlillar shuni ko'rsatmoqdaki, keyingi haftada sotuvlar hajmi <strong>~18%</strong> ga o'sishi kutilmoqda. 
                Tavsiya: Marketing kampaniyalari va zaxirani oldindan tayyorlang.
              </p>
            </div>
          </motion.div>
        )}
      </GlassCard>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <GlassCard delay={0.5} className="p-12 border-white/5 bg-slate-900/60 rounded-[56px] shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-heading">Kategoriyalar</h2>
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] mt-1.5">Sotuvlarning ulushi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               <PieIcon size={24} />
            </div>
          </div>
          <div className="flex flex-col xl:flex-row items-center gap-12">
            <div className="w-full xl:w-1/2 h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '20px',
                      padding: '16px'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-white tracking-tighter">100%</span>
                 <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Ulush</span>
              </div>
            </div>
            <div className="w-full xl:w-1/2 space-y-5">
              {categoryStats.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between group p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="text-base font-black text-white tabular-nums tracking-tighter">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.6} className="p-12 border-white/5 bg-slate-900/60 rounded-[56px] shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-heading">Tashriflar Oqimi</h2>
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] mt-1.5">Traffic manbalari</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
               <MousePointer2 size={24} />
            </div>
          </div>
          <div className="flex flex-col xl:flex-row items-center gap-12">
             <div className="w-full xl:w-1/2 h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                      {trafficSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                      }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Activity size={32} className="text-fuchsia-500 animate-pulse" />
                </div>
             </div>
             <div className="w-full xl:w-1/2 space-y-5">
              {trafficSources.map((item) => (
                <div key={item.name} className="flex items-center justify-between group p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-base font-black text-white tabular-nums tracking-tighter">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

const ArrowUpRight = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 17L17 7M17 7H7M17 7V17" />
  </svg>
);
