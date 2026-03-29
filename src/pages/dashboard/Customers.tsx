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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { orderApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

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
  const { t, language, currentStore } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const loadCustomers = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      // In a real app, we'd have a customers endpoint.
      // Here we derive from orders if endpoint doesn't exist, 
      // but let's assume we have it or use a mock for Robosell parity.
      const res = await orderApi.list({ store: currentStore.id });
      const orders = res.data.results || res.data || [];
      
      // Derive customers from orders
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Mijozlar Bazasi' : 'Customer Database'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Sodiq mijozlaringiz bilan ishlash" : "Engage with your loyal customers"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-white text-slate-600 border border-slate-200">
             Export CSV
          </Button>
          <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100">
             {customers.length} Jami mijozlar
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 h-14 rounded-2xl bg-white border border-slate-100 focus:border-rose-500/30 transition-all font-bold text-sm shadow-sm"
            placeholder={language === 'uz' ? "Ism yoki telefon orqali qidirish..." : "Search by name or phone..."}
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
          {['all', 'new', 'loyal'].map(f => (
            <button 
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedFilter === f ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'all' ? 'Hammasi' : f === 'new' ? 'Yangi' : 'Sodiq'}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.length === 0 ? (
          <GlassCard className="p-20 text-center border-dashed border-2">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">Mijozlar topilmadi</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Bu do'kondan hali hech kim xarid qilmagan yoki qidiringiz natijasiz.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map(customer => (
              <GlassCard key={customer.phone} className="p-0 border-none bg-white shadow-xl hover:shadow-2xl transition-all group overflow-hidden border border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center">
                  <div className="p-6 lg:w-1/4 border-b lg:border-b-0 lg:border-r border-slate-50">
                    <div className="flex items-center gap-4">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${customer.status === 'loyal' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          <Users className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight truncate">{customer.full_name}</h4>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${customer.status === 'loyal' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            {customer.status}
                          </span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-6 lg:w-1/2 flex items-center gap-12">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kontakt</p>
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2 text-xs font-black text-slate-700"><Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}</div>
                           {customer.email && <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}</div>}
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buyurtmalar</p>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                           <ShoppingBag className="w-3.5 h-3.5 text-rose-400" /> {customer.total_orders} ta
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jami xarid</p>
                        <div className="text-xs font-black text-emerald-600">
                           {customer.total_spent.toLocaleString()} UZS
                        </div>
                     </div>
                  </div>

                  <div className="p-6 lg:w-1/4 bg-slate-50/50 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oxirgi xarid</p>
                        <p className="text-xs font-bold text-slate-600">{new Date(customer.last_order_date).toLocaleDateString()}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button className="p-3 bg-white text-slate-400 rounded-xl hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"><MessageCircle className="w-4 h-4" /></button>
                        <button className="p-3 bg-white text-slate-400 rounded-xl hover:text-rose-600 border border-slate-100 shadow-sm transition-all"><ChevronRight className="w-4 h-4" /></button>
                     </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Retention Card */}
      <GlassCard className="p-10 border-none bg-rose-600 text-white shadow-2xl overflow-hidden relative group">
         <div className="absolute top-[-20px] right-[-20px] w-60 h-60 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4 max-w-lg">
               <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center"><Star className="w-7 h-7 text-rose-200" /></div>
               <h3 className="text-2xl font-black uppercase tracking-tight">Mijozlarni jalb qiling</h3>
               <p className="text-sm font-medium text-rose-100 leading-relaxed">
                  Sodiq mijozlaringiz uchun maxsus promo-kodlar yoki aksiyalar yuboring. Bu qayta sotuvlarni 30% gacha oshirishi mumkin.
               </p>
            </div>
            <Button className="rounded-2xl h-14 px-10 bg-white text-rose-600 font-black uppercase tracking-widest text-xs flex items-center gap-3 border-none shadow-xl shadow-rose-900/20">
               Aksiya yaratish <ArrowUpRight className="w-4 h-4" />
            </Button>
         </div>
      </GlassCard>
    </div>
  );
}
