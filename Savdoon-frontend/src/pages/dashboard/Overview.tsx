import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, TrendingUp, Users, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { orderApi, storeApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { ForecastWidget } from '../../components/ForecastWidget';

interface OverviewProps {
  storeId?: number;
}

export function Overview({ storeId }: OverviewProps) {
  const { t, language, currency } = useApp();
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadOverviewData();
    }
  }, [storeId, period]);

  const loadOverviewData = async () => {
    if (!isRefreshing) setLoading(true);
    try {
      const [statsRes, ordersRes, storeRes] = await Promise.all([
        orderApi.getStats(storeId, period),
        orderApi.list({ store: storeId }),
        storeId ? storeApi.get(storeId) : Promise.resolve({ data: null }),
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
      setStoreInfo(storeRes.data);
    } catch (error) {
      console.error('Failed to load overview data:', error);
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
      case 'pending': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'confirmed': return 'bg-[var(--brand-primary-glow)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20';
      case 'out_for_delivery': return 'bg-[var(--brand-secondary-glow)] text-[var(--brand-secondary)] border border-[var(--brand-secondary)]/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-[var(--color-surface-raised)] text-[var(--text-muted)] border border-[var(--color-border)]';
    }
  };

  const statCards = [
    {
      label: t('totalSales'),
      value: stats?.total_revenue?.toLocaleString() + ' ' + currency || '0 ' + currency,
      change: '+12.5%',
      icon: DollarSign,
      color: 'from-[var(--brand-primary)] to-[var(--brand-secondary)]'
    },
    {
      label: t('totalOrders'),
      value: stats?.total_orders || '0',
      change: '+8.2%',
      icon: ShoppingCart,
      color: 'from-[var(--brand-secondary)] to-[var(--brand-accent)]'
    },
    {
      label: t('pending'),
      value: stats?.pending || '0',
      change: t('today') || 'bugun',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600'
    },
    {
      label: t('completed'),
      value: stats?.completed || '0',
      change: '+5.4%',
      icon: Users,
      color: 'from-emerald-500 to-teal-600'
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-[var(--brand-primary)] animate-spin mb-6" />
        <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase font-heading">
          {t('welcomeUser')} <span className="text-[var(--brand-primary)]">{user?.first_name || user?.username}</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="h-0.5 w-12 bg-[var(--brand-primary)] rounded-full opacity-50" />
          <p className="text-[var(--text-secondary)] uppercase tracking-[0.2em] text-[10px] font-bold">
            {t('happeningToday')} <span className="text-[var(--brand-primary)]">{storeInfo?.name || 'Savdoon'}</span>
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <GlassCard key={stat.label} delay={index * 0.1} className="p-8 group hover:bg-[var(--color-surface-raised)] border-[var(--color-border)] hover:border-[var(--brand-primary)] transition-all duration-500 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent -mr-8 -mt-8 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.25em] mb-4">{stat.label}</p>
                <motion.p
                  className="text-3xl font-black text-[var(--text-primary)] tracking-tight font-heading"
                >
                  {stat.value}
                </motion.p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">{stat.change}</p>
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t('vsLast', { period })}</span>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ring-2 ring-[var(--color-border-bright)]/20`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* AI Insights & Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ForecastWidget storeId={storeId} language={language} />
        {/* You could add another AI widget here later */}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard delay={0.3} className="lg:col-span-2 p-8 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight font-heading uppercase">
                {t('salesOverview')}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] mt-2">{t('monthlyPerformance')}</p>
            </div>

            <div className="flex p-1.5 bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] relative shadow-inner">
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all relative z-10 ${period === p ? 'text-[var(--primary-foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  {p}
                  {period === p && (
                    <motion.div
                      layoutId="overviewPeriod"
                      className="absolute inset-0 bg-[var(--brand-primary)] rounded-xl shadow-lg shadow-[var(--brand-primary-glow)] -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
              <AreaChart data={stats?.history || []}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontWeight: 'bold' }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontWeight: 'bold' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--color-border-bright)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-premium)',
                    padding: '16px'
                  }}
                  itemStyle={{ color: 'var(--brand-primary)', fontWeight: 'bold', fontSize: '13px' }}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.2em' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand-primary)"
                  strokeWidth={4}
                  fill="url(#salesGradient)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Top Products */}
        <GlassCard delay={0.4} className="p-8 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight font-heading uppercase mb-2">{t('topProducts')}</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] mb-10">{t('unitsSold')}</p>
          <div className="space-y-4">
            {(stats?.top_products || []).map((product: any, index: number) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-5 p-4 rounded-2xl hover:bg-[var(--color-surface-raised)] border border-transparent hover:border-[var(--color-border)] transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--brand-primary)] font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{product.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">{product.sold} {t('unitsSold')}</p>
                </div>
                <p className="text-sm font-black text-[var(--text-primary)] tabular-nums">
                  {product.revenue?.toLocaleString()} <span className="text-[10px] text-[var(--text-muted)]">{currency}</span>
                </p>
              </motion.div>
            ))}
            {(!stats?.top_products || stats.top_products.length === 0) && (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] opacity-30">
                <ShoppingCart className="w-16 h-16 mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('noData')}</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent Orders & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <GlassCard delay={0.5} className="p-8 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight font-heading uppercase">{t('recentOrders')}</h2>
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] hover:brightness-125 transition-all underline underline-offset-8">
              {t('viewAll')}
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-5 px-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('orderId')}</th>
                  <th className="text-left py-5 px-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('customer')}</th>
                  <th className="text-left py-5 px-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('status')}</th>
                  <th className="text-right py-5 px-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--color-surface-raised)] transition-all group">
                    <td className="py-5 px-3 text-sm font-black text-[var(--brand-primary)] group-hover:scale-105 transition-transform origin-left tabular-nums">#{order.id}</td>
                    <td className="py-5 px-3 text-sm font-bold text-[var(--text-secondary)]">{order.customer_name}</td>
                    <td className="py-5 px-3">
                      <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${getStatusColor(order.status)}`}>
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="py-5 px-3 text-sm font-black text-[var(--text-primary)] text-right tabular-nums">
                      {order.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-[var(--text-muted)] opacity-30">
                        <ShoppingCart className="w-16 h-16 mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('noRecentOrders')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Orders Chart */}
        <GlassCard delay={0.6} className="p-8 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight font-heading uppercase mb-2">
            {t('dailyOrders')}
          </h2>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] mb-10">{t('orderTotalCount')}</p>
          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={stats?.history || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
                <Tooltip
                  cursor={{ fill: 'var(--color-surface-raised)', opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--color-border-bright)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-premium)',
                  }}
                  itemStyle={{ color: 'var(--brand-secondary)', fontWeight: 'bold' }}
                />
                <Bar dataKey="orders" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={24} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-secondary)" />
                    <stop offset="100%" stopColor="var(--brand-primary)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
