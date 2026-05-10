import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  Star, 
  ArrowUpRight,
  MessageCircle,
  Clock,
  Check,
  X,
  Loader2,
  ChevronRight,
  UserCheck,
  UserMinus,
  AlertCircle,
  Zap,
  ShieldCheck,
  Target,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface Customer {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  status: 'active' | 'new' | 'loyal';
}

export function Customers() {
  const { t, language, currentStore, formatPrice } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const loadCustomers = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const orders = await supabaseApi.orders.list(currentStore.id);
      
      const customerMap = new Map<string, Customer>();
      orders.forEach((o: any) => {
        const phone = o.customer_phone || o.phone || 'Unknown';
        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            id: o.user || Math.random(),
            full_name: o.customer_name || o.name || 'Anonymous',
            phone: phone,
            email: o.customer_email || o.email,
            total_orders: 1,
            total_spent: parseFloat(o.total_amount || 0),
            last_order_date: o.created_at,
            status: 'new'
          });
        } else {
          const c = customerMap.get(phone)!;
          c.total_orders += 1;
          c.total_spent += parseFloat(o.total_amount || 0);
          if (new Date(o.created_at) > new Date(c.last_order_date)) {
            c.last_order_date = o.created_at;
          }
          if (c.total_orders > 3) c.status = 'loyal';
        }
      });
      
      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, [currentStore?.id]);

  const filteredCustomers = customers.filter(c => 
    (c.full_name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) &&
    (selectedFilter === 'all' || c.status === selectedFilter)
  );

  if (loading && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-slate-950 animate-spin mb-6" />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-slate-950 rounded-full shadow-xl shadow-slate-950/20" />
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Retention Engine</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase font-heading leading-tight">Mijozlar Bazasi</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-[9px] font-black leading-none">Sodiq mijozlaringiz bilan munosabatlarni mustahkamlang</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <button className="h-16 px-10 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-950 rounded-[24px] font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-4 shadow-xl shadow-slate-200/50">
             <Download size={18} />
             Export CSV
           </button>
            <div className="h-14 px-8 bg-slate-950 text-white rounded-[20px] flex items-center gap-3 shadow-xl shadow-slate-950/20">
               <Users size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] tabular-nums">{customers.length} Jami</span>
            </div>
        </div>
      </div>

      {/* Modern Filter & Search Bar */}
      <div className="p-3 bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border-2 border-slate-50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group bg-slate-50 rounded-[24px] border border-slate-100 focus-within:border-slate-950 transition-all">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-950" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-5 rounded-[24px] border-none bg-transparent focus:ring-0 text-slate-950 placeholder:text-slate-300 font-bold text-sm"
              placeholder="Ism, telefon yoki email orqali qidiruv..."
            />
          </div>
          <div className="flex gap-2 p-2 bg-slate-50 rounded-[24px] border border-slate-100">
            {['all', 'new', 'loyal'].map(f => (
              <button 
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedFilter === f ? 'bg-white text-slate-950 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-950'}`}
              >
                {f === 'all' ? 'Hammasi' : f === 'new' ? 'Yangi' : 'Sodiq'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 gap-8">
        {filteredCustomers.length === 0 ? (
          <div className="p-40 text-center rounded-[56px] bg-slate-50 border-2 border-slate-100 border-dashed flex flex-col items-center justify-center text-slate-200">
            <Users className="w-24 h-24 mb-10 opacity-20 animate-pulse" />
            <h2 className="text-xl font-black text-slate-300 mb-2 uppercase tracking-[0.3em]">Hech kim topilmadi</h2>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Qidiruv natijalari bo'sh</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.phone}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="bg-white border-2 border-slate-50 hover:border-slate-950/10 transition-all duration-700 shadow-xl shadow-slate-200/30 rounded-[40px] overflow-hidden flex flex-col lg:flex-row lg:items-stretch">
                    {/* Primary Identity Section */}
                    <div className="p-10 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-50 relative overflow-hidden bg-slate-50/30">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                          <LayoutGrid size={120} className="text-slate-950" />
                       </div>
                       <div className="flex items-center gap-8 relative z-10">
                          <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 border-2 transition-all duration-700 ${customer.status === 'loyal' ? 'bg-slate-950 text-white border-slate-950 shadow-xl shadow-slate-950/20' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}>
                             <Users size={32} />
                          </div>
                          <div className="min-w-0">
                             <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${customer.status === 'loyal' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                  {customer.status}
                                </span>
                                 {customer.total_spent > 1000000 && <ShieldCheck size={12} className="text-emerald-500" />}
                             </div>
                             <h4 className="font-black text-slate-950 uppercase tracking-tight truncate text-lg group-hover:text-indigo-600 transition-colors">{customer.full_name}</h4>
                          </div>
                       </div>
                    </div>
                    
                    {/* Activity Metrics Section */}
                    <div className="p-10 lg:w-2/5 flex flex-wrap items-center gap-16 relative bg-white">
                       <div className="space-y-3">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Kommunikatsiya</p>
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-3 text-sm font-black text-slate-950 tabular-nums tracking-widest">
                                <Phone size={14} className="text-indigo-600" /> {customer.phone}
                             </div>
                             {customer.email && (
                               <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                 <Mail size={14} /> {customer.email}
                               </div>
                             )}
                          </div>
                       </div>
                       <div className="space-y-3">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Statistika</p>
                          <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2.5 text-xs font-black text-slate-950 uppercase tracking-tight">
                                 <ShoppingBag size={12} className="text-indigo-600" /> {customer.total_orders} <span className="text-[9px] text-slate-400">Orders</span>
                              </div>
                              <div className="w-px h-5 bg-slate-100" />
                              <div className="text-lg font-black text-slate-950 tabular-nums tracking-tighter">
                                 {formatPrice(customer.total_spent)}
                              </div>
                          </div>
                       </div>
                    </div>

                    {/* Actions Section */}
                    <div className="p-10 lg:w-1/4 bg-slate-50/50 flex items-center justify-between border-t lg:border-t-0 lg:border-l border-slate-50">
                       <div className="space-y-3">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Lifecycle</p>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest mb-1">So'nggi Xarid</span>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tabular-nums">{new Date(customer.last_order_date).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button className="w-14 h-14 flex items-center justify-center bg-white text-slate-400 rounded-2xl hover:bg-slate-950 hover:text-white border border-slate-100 transition-all shadow-xl shadow-slate-200/50 group/msg">
                             <MessageCircle size={22} className="group-hover/msg:scale-110 transition-transform" />
                          </button>
                          <button className="w-14 h-14 flex items-center justify-center bg-white text-slate-400 rounded-2xl hover:bg-slate-950 hover:text-white border border-slate-100 transition-all shadow-xl shadow-slate-200/50 group/go">
                             <ChevronRight size={28} className="group-hover/go:translate-x-1 transition-transform" />
                          </button>
                       </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Premium Growth Banner */}
      <div className="p-12 rounded-[56px] bg-slate-950 text-white shadow-2xl shadow-slate-950/20 overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-[50%] h-full bg-white/5 skew-x-[-30deg] translate-x-40 group-hover:translate-x-20 transition-transform duration-1000" />
         <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-white/5 rounded-full blur-[120px] animate-pulse" />
         
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[32px] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-700">
                    <Target size={40} className="text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400">Loyalty Strategy</span>
                     <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Mijozlarni Jalb Qiling</h3>
                  </div>
               </div>
               <p className="text-lg font-bold text-slate-300 leading-relaxed">
                  Sodiq mijozlaringiz uchun maxsus promo-kodlar yoki eksklyuziv aksiyalar yarating. 
                  AI tahlillarimizga ko'ra, sodiqlik dasturi qayta sotuvlarni <strong>42% gacha</strong> oshirishi mumkin.
               </p>
            </div>
            <div className="flex flex-col gap-6">
               <button className="h-20 px-12 bg-white text-slate-950 rounded-[32px] font-black uppercase tracking-widest text-xs flex items-center gap-4 border-none shadow-2xl hover:scale-105 active:scale-95 transition-all group/btn">
                  Aksiya yaratish <ArrowUpRight size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
               </button>
               <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                  <TrendingUp size={16} className="text-white" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Conversion Boost: +12%</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
