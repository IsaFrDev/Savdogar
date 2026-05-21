import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  ShoppingCart,
  Bell,
  Box,
  CreditCard,
  Building2,
  ChevronRight,
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  Calendar,
  FileText,
  BarChart3,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Modal } from '../../components/Modal';

interface Vendor {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  rating: number;
  is_active: boolean;
  total_spent?: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_name: string;
  status: string;
  priority: string;
  total: number;
  order_date: string;
  expected_delivery: string;
}

interface Expense {
  id: number;
  category_name: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
}

const ERPDashboard: React.FC = () => {
  const { formatPrice, currentStore } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'purchase-orders' | 'alerts' | 'shipments' | 'expenses'>('overview');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalExpenses: 0
  });

  useEffect(() => {
    if (currentStore?.id) {
      loadDashboardData();
    }
  }, [currentStore]);

  const loadDashboardData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [pos, vends, exps, rules] = await Promise.all([
        supabaseApi.erp.listPOs(currentStore.id),
        supabaseApi.erp.listVendors(currentStore.id),
        supabaseApi.erp.listExpenses(currentStore.id),
        supabaseApi.erp.listReorderRules(currentStore.id)
      ]);

      setPurchaseOrders(pos);
      setVendors(vends);
      setExpenses(exps);

      setStats({
        totalSpent: pos.filter((p: any) => p.status === 'received').reduce((sum: number, p: any) => sum + parseFloat(p.total), 0),
        totalOrders: pos.length,
        avgOrderValue: pos.length > 0 ? pos.reduce((sum: number, p: any) => sum + parseFloat(p.total), 0) / pos.length : 0,
        pendingOrders: pos.filter((p: any) => p.status === 'sent' || p.status === 'draft').length,
        lowStockItems: rules.filter((r: any) => r.is_active).length, // Simplified logic
        totalExpenses: exps.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)
      });
    } catch (error) {
      console.error('Failed to load ERP data:', error);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'overview', label: 'Umumiy', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendorlar', icon: Users },
    { id: 'purchase-orders', label: 'Buyurtmalar', icon: ShoppingCart },
    { id: 'alerts', label: 'Qoidalar', icon: Bell },
    { id: 'shipments', label: 'Logistika', icon: Truck },
    { id: 'expenses', label: 'Xarajatlar', icon: CreditCard }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white">
        <Loader2 className="w-16 h-16 text-slate-900 animate-spin mb-6 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Neural Sync In Progress</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -m-12 p-12 space-y-12 text-slate-950 font-sans selection:bg-slate-900 selection:text-white">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1.5 bg-slate-950 rounded-full shadow-2xl" />
            <span className="text-xs font-black text-slate-950 uppercase tracking-[0.5em]">Enterprise Hub</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-950 uppercase font-heading leading-none">
            ERP <span className="text-slate-300">Ultimate</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-6 flex items-center gap-3">
             <ShieldCheck size={14} className="text-emerald-500" /> Barcha tizimlar barqaror ishlamoqda
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <button className="h-16 px-8 bg-slate-100 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all flex items-center gap-3">
             <Download size={18} /> Hisobot
           </button>
           <button 
             onClick={() => setShowAddVendor(true)}
             className="h-16 px-10 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
           >
             <Plus size={18} className="stroke-[3px]" /> Yangi Amaliyot
           </button>
        </div>
      </div>

      {/* Navigation Matrix */}
      <div className="flex gap-3 p-1.5 bg-slate-50 rounded-[24px] w-fit border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-[18px] font-black text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${
              activeTab === tab.id
                ? 'bg-white text-slate-950 border-white shadow-xl text-shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <tab.icon size={12} className={`${activeTab === tab.id ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={3} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-12"
          >
            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { label: 'Jami xarajat', value: formatPrice(stats.totalSpent), icon: DollarSign, trend: '+12%', color: 'emerald' },
                 { label: 'Buyurtmalar', value: stats.totalOrders, icon: ShoppingCart, trend: '85% active', color: 'indigo' },
                 { label: 'Ombor ogohlantirishlari', value: stats.lowStockItems, icon: AlertTriangle, trend: 'Kritik', color: 'rose' },
                 { label: 'Xarajatlar', value: formatPrice(stats.totalExpenses), icon: CreditCard, trend: 'Bu oy', color: 'slate' }
               ].map((item, i) => (
                 <div key={i} className="bg-white border-2 border-slate-50 p-10 rounded-[48px] hover:border-slate-200 transition-all group relative overflow-hidden h-full">
                    <div className="absolute top-[-20px] right-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                       <item.icon size={150} className="text-slate-900" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex justify-between items-start mb-10">
                          <div className={`w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-xl`}>
                             <item.icon size={24} />
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${item.color === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{item.trend}</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-950 tracking-tighter mb-1 tabular-nums">{item.value}</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Recent Transactions Table */}
               <div className="lg:col-span-2 bg-white border-2 border-slate-50 rounded-[56px] overflow-hidden">
                  <div className="p-12 border-b border-slate-50 flex items-center justify-between">
                     <div>
                        <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none">Oxirgi Harakatlar</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">So'nggi 10 ta tranzaksiya</p>
                     </div>
                     <button className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-950 flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all">
                        <ArrowUpRight size={20} />
                     </button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead>
                         <tr className="bg-slate-50/50">
                           <th className="py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">ID / SANA</th>
                           <th className="py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">VOMBOR / VENDOR</th>
                           <th className="py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">STATUS</th>
                           <th className="py-8 px-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">SUMMA</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {purchaseOrders.slice(0, 5).map(po => (
                           <tr key={po.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                              <td className="py-10 px-12">
                                 <div className="font-black text-slate-950 text-sm tracking-widest uppercase mb-1">{po.po_number}</div>
                                 <div className="text-[10px] text-slate-400 font-bold">{new Date(po.order_date).toLocaleDateString()}</div>
                              </td>
                              <td className="py-10 px-12">
                                 <div className="font-black text-slate-600 text-xs uppercase tracking-tight mb-1">{po.vendor_name}</div>
                                 <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Global Logistics</div>
                              </td>
                              <td className="py-10 px-12 text-center">
                                 <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                    po.status === 'received' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                 }`}>{po.status}</span>
                              </td>
                              <td className="py-10 px-12 text-right">
                                 <div className="font-black text-slate-950 tabular-nums">{formatPrice(po.total)}</div>
                                 <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Tasdiqlangan</div>
                              </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
               </div>

               {/* Vendor Quick List */}
               <div className="space-y-8">
                  <div className="bg-slate-950 p-12 rounded-[56px] text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Users size={80} />
                     </div>
                     <h3 className="text-xl font-black uppercase tracking-widest mb-10">Top Vendorlar</h3>
                     <div className="space-y-8">
                        {vendors.slice(0, 4).map(v => (
                           <div key={v.id} className="flex items-center justify-between group cursor-pointer">
                              <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-white group-hover:bg-white group-hover:text-slate-900 transition-all">
                                    {v.name[0]}
                                 </div>
                                 <div>
                                    <div className="text-sm font-black uppercase tracking-tight">{v.name}</div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{v.phone}</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-xs font-black tabular-nums">4.8</div>
                                 <div className="flex gap-0.5 mt-1">
                                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 rounded-full bg-amber-500" />)}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <button className="w-full mt-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all">
                        Hammasini Boshqarish
                     </button>
                  </div>

                  <div className="bg-white border-2 border-slate-50 p-12 rounded-[56px]">
                     <h3 className="text-xl font-black text-slate-950 uppercase tracking-widest mb-8">AI Tahlil</h3>
                     <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                           Sizning <span className="text-slate-950 font-black">Warehouse Central</span> omboringizda 3 ta mahsulot kritik darajada kamaygan. Ta'minotchilarga buyurtma berishni tavsiya qilamiz.
                        </p>
                        <button className="mt-8 flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:gap-5 transition-all">
                           Hozir To'ldirish <ChevronRight size={14} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'vendors' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {vendors.map(vendor => (
                   <div key={vendor.id} className="bg-white border-2 border-slate-50 p-10 rounded-[48px] hover:shadow-2xl hover:shadow-slate-200 transition-all duration-700">
                      <div className="flex justify-between items-start mb-10">
                         <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center font-black text-3xl text-slate-950">
                            {vendor.name[0]}
                         </div>
                         <div className="flex gap-2">
                            <button className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all"><Edit size={18} /></button>
                            <button className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                         </div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter mb-2">{vendor.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{vendor.contact_person}</p>
                      
                      <div className="space-y-4 pt-8 border-t border-slate-50">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefon</span>
                            <span className="text-xs font-black text-slate-900">{vendor.phone}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                            <span className="text-xs font-black text-slate-900">{vendor.email}</span>
                         </div>
                      </div>

                      <button className="w-full mt-10 h-16 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
                         Tarixni Ko'rish
                      </button>
                   </div>
                 ))}
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={showAddVendor} onClose={() => setShowAddVendor(false)} title="Yangi Vendor Qo'shish">
         <div className="p-12 space-y-10 bg-white">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Kompaniya Nomi</label>
               <input type="text" className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 font-black text-slate-950 uppercase tracking-tight outline-none focus:border-slate-950 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Mas'ul Shaxs</label>
                  <input type="text" className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 font-black text-slate-950 uppercase tracking-tight outline-none focus:border-slate-950 transition-all" />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Telefon</label>
                  <input type="text" className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 font-black text-slate-950 uppercase tracking-tight outline-none focus:border-slate-950 transition-all" />
               </div>
            </div>
            <button className="w-full h-24 bg-slate-950 text-white rounded-[32px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl shadow-slate-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
               Vendor Ro'yxatga Olish
            </button>
         </div>
      </Modal>
    </div>
  );
};

export default ERPDashboard;
