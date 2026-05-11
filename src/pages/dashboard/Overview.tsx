import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Loader2, 
  Zap, 
  Sparkles, 
  ArrowUpRight, 
  Package, 
  Clock, 
  CheckCircle2, 
  Activity,
  LayoutGrid,
  Calendar,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { ForecastWidget } from '../../components/ForecastWidget';
import { Modal } from '../../components/Modal';

interface OverviewProps {
  storeId?: number;
  onTabChange?: (tab: string) => void;
}

export function Overview({ storeId, onTabChange }: OverviewProps) {
  const { t, language, currency, formatPrice } = useApp();
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (storeId) {
      loadOverviewData();
    }
  }, [storeId, period]);

  const loadOverviewData = async () => {
    if (!isRefreshing) setLoading(true);
    try {
      if (!storeId) return;

      const [statsData, ordersData, storeData] = await Promise.all([
        supabaseApi.orders.getStats(storeId),
        supabaseApi.orders.list(storeId),
        supabaseApi.stores.get(storeId),
      ]);

      setStats(statsData);
      const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData && Array.isArray((ordersData as any).data) ? (ordersData as any).data : []);
      setRecentOrders(ordersArray.slice(0, 5));
      setStoreInfo(storeData);
    } catch (error) {
      console.error('Failed to load overview data from Supabase:', error);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setIsRefreshing(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'confirmed': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'out_for_delivery': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-500 border-white/5';
    }
  };

  const statCards = [
    {
      label: t('totalSales'),
      value: formatPrice(stats?.total_revenue || 0),
      change: '+18.5%',
      icon: DollarSign,
      color: 'from-indigo-600 to-indigo-800',
      shadow: 'shadow-indigo-600/30'
    },
    {
      label: t('totalOrders'),
      value: stats?.total_orders || '0',
      change: '+12.3%',
      icon: ShoppingCart,
      color: 'from-fuchsia-600 to-fuchsia-800',
      shadow: 'shadow-fuchsia-600/30'
    },
    {
      label: t('pending'),
      value: stats?.pending || '0',
      change: 'Active Now',
      icon: Clock,
      color: 'from-amber-500 to-amber-700',
      shadow: 'shadow-amber-500/30'
    },
    {
      label: t('completed'),
      value: stats?.completed || '0',
      change: '+4.2%',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-700',
      shadow: 'shadow-emerald-500/30'
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-slate-950 animate-spin mb-6" />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Welcome Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12 relative">
        <div className="flex flex-col gap-6 relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-1 bg-slate-950 rounded-full shadow-xl shadow-slate-950/10" />
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.5em]">{t('commandCenter')}</span>
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                </div>
              </div>
          </div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase font-heading leading-none">
            {t('welcomeUser')} <br />
            <span className="text-indigo-600 inline-flex items-center gap-4">
              {user?.first_name || user?.username}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Sparkles size={32} className="text-indigo-600/20" />
              </motion.div>
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 p-3 bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border-2 border-slate-50 relative z-10 items-center">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-10 py-4 rounded-[20px] font-black uppercase tracking-widest text-[11px] transition-all relative z-10 ${
                period === p ? 'text-white' : 'text-slate-400 hover:text-slate-950'
              }`}
            >
              {p}
              {period === p && (
                <motion.div
                  layoutId="overviewPeriod"
                  className="absolute inset-0 bg-slate-950 rounded-[20px] shadow-2xl shadow-slate-950/20 -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
          
          <div className="w-px h-10 bg-slate-100 mx-2" />
          
          <button 
            onClick={() => setShowCalendar(true)}
            className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all hover:bg-white group"
          >
             <Calendar size={22} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-slate-100/50 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Quick Actions Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {[
          { id: 'products', label: t('addProduct'), icon: Plus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { id: 'marketing', label: t('createCampaign'), icon: Zap, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
          { id: 'banners', label: t('visualAds'), icon: Image, color: 'text-blue-600', bg: 'bg-blue-50' },
          { id: 'orders', label: t('orders'), icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50' },
          { id: 'customers', label: t('customers'), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { id: 'ai-studio', label: t('aiStudio'), icon: Sparkles, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => onTabChange?.(action.id)}
            className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white border border-slate-50 hover:border-slate-950 transition-all group shadow-sm hover:shadow-xl"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${action.bg} ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <action.icon size={18} />
            </div>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-950 text-center">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Grid - Ultra Premium Light Contrast */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {statCards.map((stat, index) => (
          <GlassCard 
            key={stat.label} 
            delay={index * 0.1} 
            className="p-10 bg-white border-2 border-slate-50 hover:border-slate-950/10 transition-all duration-700 shadow-xl shadow-slate-200/40 relative overflow-hidden group rounded-[48px]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full -mr-20 -mt-20 blur-[60px] group-hover:bg-slate-100 transition-all duration-700" />
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ${stat.shadow}`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                     <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                     <span className="text-[10px] text-emerald-600 font-black tracking-widest">{stat.change}</span>
                   </div>
                </div>
              </div>

              <div>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em] mb-2">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-950 tracking-tighter tabular-nums">
                  {stat.value}
                </h3>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <GlassCard delay={0.4} className="lg:col-span-2 p-12 bg-white border-2 border-slate-50 rounded-[56px] shadow-2xl shadow-slate-200/30 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
             <Activity size={200} className="text-slate-950" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 relative z-10 gap-8">
            <div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('revenueStream')}</h2>
              <div className="flex items-center gap-4 mt-3">
                 <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em]">
                   <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-xl shadow-indigo-600/50" />
                   {t('revenue')}
                 </div>
                 <div className="w-1 h-1 bg-slate-200 rounded-full" />
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{t('realTimeAnalytics')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setShowRevenueDetails(true)}
                className="px-6 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all"
               >
                 Details
               </button>
            </div>
          </div>

          <div className="h-[480px] w-full relative z-10">
            {mounted && stats?.history && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.history}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontWeight: '900', fill: '#64748b' }}
                    dy={15}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontWeight: '900', fill: '#64748b' }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid #f1f5f9',
                      borderRadius: '28px',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)',
                      padding: '24px'
                    }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'black', fontSize: '14px' }}
                    labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.3em' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={5}
                    fill="url(#salesGradient)"
                    animationDuration={2500}
                    activeDot={{ r: 8, fill: '#fff', stroke: '#6366f1', strokeWidth: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Top Products Sidebar */}
        <GlassCard delay={0.5} className="p-12 bg-white border-2 border-slate-50 rounded-[56px] shadow-2xl shadow-slate-200/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
             <LayoutGrid size={160} className="text-slate-950" />
          </div>
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
               <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">{t('topSales')}</h2>
               <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{t('bestSellingProducts')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
               <Zap size={24} className="animate-pulse" />
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {(stats?.top_products || []).map((product: any, index: number) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-6 p-6 rounded-[36px] bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group cursor-pointer shadow-sm hover:shadow-xl"
              >
                <div className="w-16 h-16 rounded-[20px] bg-white border-2 border-slate-50 flex items-center justify-center text-slate-950 font-black text-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                   {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-black text-slate-950 truncate uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h4>
                  <div className="flex items-center gap-4">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.sold} {t('sold')}</span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-lg font-black text-emerald-600 tabular-nums tracking-tighter">{product.revenue?.toLocaleString()}</p>
                   <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">{currency}</p>
                </div>
              </motion.div>
            ))}
            
            <button 
              onClick={() => onTabChange?.('products')}
              className="w-full py-6 bg-slate-950 text-white hover:bg-slate-800 rounded-[28px] text-[10px] font-black uppercase tracking-[0.4em] transition-all mt-6 flex items-center justify-center gap-4 group shadow-xl shadow-slate-950/20"
            >
               {t('allProducts')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Orders and AI Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <GlassCard delay={0.6} className="lg:col-span-2 p-12 bg-white border-2 border-slate-50 rounded-[56px] shadow-2xl shadow-slate-200/30 relative overflow-hidden group">
           <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('recentOrders')}</h2>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{t('latestTransactions')}</p>
            </div>
            <button 
              onClick={() => onTabChange?.('orders')}
              className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all shadow-sm"
            >
               <ChevronRight size={28} />
            </button>
          </div>
          
          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-50">
                  <th className="text-left py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('orderId')}</th>
                  <th className="text-left py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('customer')}</th>
                  <th className="text-left py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('status')}</th>
                  <th className="text-right py-8 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer">
                    <td className="py-8 px-6">
                       <span className="text-sm font-black text-indigo-600 tabular-nums">#{order.id}</span>
                    </td>
                    <td className="py-8 px-6">
                       <div className="flex flex-col">
                          <span className="text-base font-black text-slate-950 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{order.customer_name}</span>
                          <span className="text-[9px] text-slate-400 font-bold tracking-widest tabular-nums">{order.customer_phone}</span>
                       </div>
                    </td>
                    <td className="py-8 px-6">
                      <span className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl border backdrop-blur-xl ${getStatusColor(order.status)}`}>
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="py-6 px-6 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-slate-950 tabular-nums tracking-tighter">
                            {formatPrice(order.total)}
                          </span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* AI Prediction Widget */}
        <div className="flex flex-col gap-10">
           <ForecastWidget storeId={storeId} language={language} />
           
           <GlassCard className="p-10 bg-gradient-to-br from-indigo-50 to-fuchsia-50 border-2 border-white rounded-[48px] shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 transition-transform duration-700 shadow-sm">
                    <Sparkles size={24} className="animate-pulse" />
                 </div>
                 <h4 className="text-xl font-black text-slate-950 uppercase tracking-tighter mb-2">{t('growthEngineActive')}</h4>
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                    {t('premiumModeMsg')}
                 </p>
                 <button className="mt-10 w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-slate-950/20 hover:scale-105 transition-all active:scale-95">
                    {t('viewInsights')}
                 </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/50 rounded-full blur-3xl" />
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
