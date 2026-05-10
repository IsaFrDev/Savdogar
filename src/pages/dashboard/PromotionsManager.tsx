import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Gift, 
  Package, 
  Truck, 
  BarChart3, 
  Plus, 
  TrendingUp, 
  Users, 
  Clock, 
  Loader2, 
  Edit3, 
  Eye, 
  Tag,
  ChevronRight,
  Target,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface Promotion {
  id: number;
  name: string;
  promotion_type: string;
  discount_value: string;
  discount_percent: number;
  usage_count: number;
  usage_limit: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export function PromotionsManager() {
  const { formatPrice, language } = useApp();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled'>('all');

  useEffect(() => {
    loadPromotions();
  }, []);

    const loadPromotions = async () => {
        try {
            const data = await supabaseApi.marketing.listPromotions();
            setPromotions(data);
        } catch (error) {
            console.error('Error loading promotions:', error);
        } finally {
            setLoading(false);
        }
    };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Flame size={24} className="text-orange-500" />;
      case 'fixed': return <Tag size={24} className="text-emerald-500" />;
      case 'bogo': return <Gift size={24} className="text-fuchsia-500" />;
      case 'bundle': return <Package size={24} className="text-indigo-500" />;
      case 'flash_sale': return <Zap size={24} className="text-amber-500" />;
      case 'free_shipping': return <Truck size={24} className="text-blue-500" />;
      case 'tiered': return <BarChart3 size={24} className="text-indigo-400" />;
      default: return <Sparkles size={24} className="text-indigo-500" />;
    }
  };

  const filteredPromotions = promotions.filter(promo => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return promo.is_active;
    if (activeTab === 'scheduled') return !promo.is_active && new Date(promo.starts_at) > new Date();
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6 opacity-50" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Loading Campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-1 bg-indigo-500 rounded-full" />
            <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Marketing</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading">
            Promotions
          </h1>
          <p className="text-slate-400 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
            Manage your sales campaigns and viral growth engines
          </p>
        </div>
        <button 
          className="h-16 px-10 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
        >
          <Plus size={18} />
          {language === 'uz' ? "Yangi Kampaniya" : "New Campaign"}
        </button>
      </div>

      {/* Stats Section - Premium Glass realization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        {[
          { label: 'Total Campaigns', value: promotions.length, icon: LayoutGrid, color: 'indigo' },
          { label: 'Active Now', value: promotions.filter(p => p.is_active).length, icon: Zap, color: 'emerald' },
          { label: 'Total Engagement', value: promotions.reduce((sum, p) => sum + p.usage_count, 0).toLocaleString(), icon: Target, color: 'amber' },
          { label: 'Viral Growth', value: '24%', icon: TrendingUp, color: 'fuchsia' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            <GlassCard className="p-10 border-slate-200 bg-white transition-all duration-700 rounded-[40px] hover:border-indigo-200 shadow-xl relative overflow-hidden h-full">
              <div className="absolute top-[-20px] right-[-10px] opacity-5 group-hover:scale-110 transition-transform duration-700">
                <stat.icon size={120} className={`text-${stat.color}-500`} />
              </div>
              <div className="relative z-10">
                <div className="text-4xl font-black text-slate-900 mb-3 tracking-tighter group-hover:text-indigo-600 transition-colors">{stat.value}</div>
                <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">{stat.label}</div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 p-2 bg-slate-50 rounded-[24px] border border-slate-100 w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-xl border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
        >
          {language === 'uz' ? 'Hammasi' : 'All'} ({promotions.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-xl border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
        >
          {language === 'uz' ? 'Faol' : 'Active'} ({promotions.filter(p => p.is_active).length})
        </button>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {filteredPromotions.map((promotion) => (
          <motion.div
            layout
            key={promotion.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group"
          >
            <GlassCard 
              className={`p-10 border-slate-200 bg-white transition-all duration-700 h-full flex flex-col relative overflow-hidden rounded-[48px] border shadow-xl group-hover:border-indigo-500/30 ${!promotion.is_active && 'opacity-40 grayscale'}`}
            >
              <div className="absolute top-[-30px] right-[-20px] text-[160px] font-black text-slate-50 select-none pointer-events-none italic font-heading">
                {promotion.id}
              </div>

              <div className="flex items-start justify-between mb-10 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-[24px] border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-700 shadow-2xl">
                    {getTypeIcon(promotion.promotion_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1.5 group-hover:text-indigo-600 transition-colors leading-tight">
                      {promotion.name}
                    </h3>
                    <div className="text-slate-400 font-black uppercase tracking-[0.2em] text-[9px]">{promotion.promotion_type.replace('_', ' ')}</div>
                  </div>
                </div>
                {promotion.is_active && (
                  <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse shadow-2xl shadow-emerald-500/10">
                    LIVE
                  </div>
                )}
              </div>

              {/* Discount Impact Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 mb-10 text-center relative z-10 overflow-hidden group-hover:bg-indigo-50 transition-colors duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">
                  {promotion.promotion_type === 'percentage' 
                    ? `${promotion.discount_percent}% DISCOUNT`
                    : promotion.promotion_type === 'fixed'
                    ? `${formatPrice(parseFloat(promotion.discount_value))} OFF`
                    : 'Special Deal'
                  }
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="space-y-4 mb-10 relative z-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <span>Campaign Impact</span>
                  <span className="text-slate-900 tabular-nums">
                    {promotion.usage_count} / {promotion.usage_limit || '∞'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-100 shadow-inner p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: promotion.usage_limit
                        ? `${Math.min(100, (promotion.usage_count / promotion.usage_limit) * 100)}%`
                        : '65%'
                    }}
                    className="bg-indigo-600 h-full rounded-full shadow-[0_0_20px_rgba(79,70,229,0.2)]"
                  />
                </div>
              </div>

              {/* Timeline */}
               <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                <div className="py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Start Date</span>
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest tabular-nums">{new Date(promotion.starts_at).toLocaleDateString()}</span>
                </div>
                <div className="py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expiry Date</span>
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest tabular-nums">{new Date(promotion.ends_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-auto pt-8 border-t border-slate-100 flex gap-4 relative z-10">
                <button className="flex-1 h-14 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all duration-500 border border-slate-100 flex items-center justify-center gap-2">
                  <Edit3 size={14} /> Edit
                </button>
                <button className="flex-1 h-14 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all duration-500 border border-indigo-100 flex items-center justify-center gap-2">
                  <BarChart3 size={14} /> Insights
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {filteredPromotions.length === 0 && (
        <GlassCard className="py-32 text-center border-dashed border-2 border-slate-100 bg-slate-50 flex flex-col items-center rounded-[56px]">
          <div className="w-24 h-24 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center mb-8 text-slate-300 shadow-sm">
            <Gift size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">No Campaigns Active</h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] max-w-sm">Create your first viral promotion to skyrocket your sales and engagement.</p>
          <button className="mt-12 h-16 px-12 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all">
            Launch First Campaign
          </button>
        </GlassCard>
      )}
    </div>
  );
}
