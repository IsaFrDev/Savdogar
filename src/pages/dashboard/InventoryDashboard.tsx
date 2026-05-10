import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Warehouse as WarehouseIcon, 
  BarChart3, 
  DollarSign, 
  Plus, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  AlertTriangle,
  History,
  LayoutDashboard,
  Box,
  RefreshCcw,
  Search,
  Eye,
  Loader2,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  ArrowRightLeft,
  Navigation,
  Globe
} from 'lucide-react';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Modal } from '../../components/Modal';

interface Warehouse {
  id: number;
  name: string;
  code: string;
  is_primary: boolean;
  is_active: boolean;
  capacity?: number;
  current_stock?: number;
  city: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  price: string;
  category: string;
}

interface Transfer {
  id: number;
  transfer_number: string;
  source_warehouse_name: string;
  destination_warehouse_name: string;
  status: string;
  created_at: string;
  total_items: number;
}

export function InventoryDashboard() {
  const { formatPrice, t, currentStore } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'warehouses' | 'transfers' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    if (currentStore?.id) {
      loadData();
    }
  }, [currentStore]);

  const loadData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [prodData, whData, transData] = await Promise.all([
        supabaseApi.products.list(currentStore.id),
        supabaseApi.warehouses.list(currentStore.id),
        supabaseApi.transfers.list(currentStore.id)
      ]);

      const fetchedProducts = (prodData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || `SKU-${p.id}`,
        stock: p.stock_quantity || 0,
        price: p.price,
        category: p.category_name || 'General'
      }));

      setProducts(fetchedProducts);
      setWarehouses(whData || []);
      setTransfers(transData || []);

    } catch (error) {
      console.error('Failed to load inventory data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white">
        <Loader2 className="w-16 h-16 text-slate-950 animate-spin mb-6 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Inventory Engine Initializing</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Monitor', icon: LayoutDashboard },
    { id: 'warehouses', label: 'Omborlar', icon: Navigation }
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-slate-950 rounded-full shadow-xl shadow-slate-950/20" />
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Inventory Intelligence</span>
          </div>
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('inventory')}</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black flex items-center gap-2">
            <Navigation size={14} /> {warehouses.length} Faol Logistika Nuqtalari
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="h-20 px-10 bg-slate-100 text-slate-950 rounded-[28px] font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center gap-4">
            <ArrowDownToLine size={20} /> Kirim
          </button>
          <button 
            onClick={() => setShowTransferModal(true)}
            className="h-20 px-12 bg-slate-950 text-white rounded-[28px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-950/20 hover:scale-105 transition-all flex items-center gap-4"
          >
            <Plus size={22} /> Yangi Transfer
          </button>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        {[
          { label: 'Jami Tovar', value: products.reduce((sum, p) => sum + p.stock, 0).toLocaleString(), color: 'slate', icon: Box },
          { label: 'Faol Omborlar', value: warehouses.length, color: 'slate', icon: WarehouseIcon },
          { label: 'O\'tkazmalar', value: transfers.length, color: 'slate', icon: RefreshCcw },
          { label: 'Kritik Qoldiq', value: products.filter(p => p.stock < 10).length, color: 'rose', icon: AlertTriangle }
        ].map((stat, i) => (
          <div key={i} className="bg-white border-2 border-slate-50 p-10 rounded-[48px] hover:border-slate-200 transition-all group relative overflow-hidden">
             <div className="absolute top-[-20px] right-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <stat.icon size={150} className="text-slate-900" />
             </div>
             <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white mb-8 shadow-xl">
                   <stat.icon size={24} />
                </div>
                <h3 className={`text-4xl font-black ${stat.color === 'rose' ? 'text-rose-600' : 'text-slate-950'} tracking-tighter mb-2 tabular-nums`}>{stat.value}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Navigation Matrix */}
      <div className="flex gap-4 p-2 bg-slate-50 rounded-[32px] w-fit border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-4 px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 border ${
              activeTab === tab.id
                ? 'bg-white text-slate-950 border-white shadow-2xl shadow-slate-200'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={3} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-12"
          >
            {/* Warehouse Capacity Visualization */}
            <div className="xl:col-span-8 space-y-12">
              <div className="bg-white border-2 border-slate-50 p-12 rounded-[56px]">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-5">
                    <WarehouseIcon className="text-slate-950" size={32} />
                    Ombor Quvvati
                  </h3>
                </div>
                <div className="space-y-12">
                  {warehouses.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                       <Globe size={48} className="mx-auto text-slate-200 mb-6" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hozircha omborlar mavjud emas</p>
                    </div>
                  ) : (
                    warehouses.map(w => (
                      <div key={w.id} className="space-y-6 group cursor-pointer">
                        <div className="flex justify-between items-end">
                          <div className="space-y-2">
                            <div className="text-slate-950 font-black uppercase tracking-widest text-lg group-hover:text-slate-600 transition-colors">{w.name} <span className="text-slate-300 ml-3 font-bold tracking-tight">#{w.code}</span></div>
                            <div className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">{w.city} • Faol Nuqta</div>
                          </div>
                          <div className="text-right">
                             <div className="text-slate-950 font-black text-2xl tracking-tighter tabular-nums">
                              85% <span className="text-slate-300 text-sm font-bold uppercase tracking-widest ml-2">Utilized</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-5 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `85%` }}
                            className="h-full rounded-full bg-slate-950 shadow-[0_0_20px_rgba(0,0,0,0.1)]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Transfers List */}
              <div className="bg-white border-2 border-slate-50 p-12 rounded-[56px] overflow-hidden">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-5">
                    <RefreshCcw className="text-slate-950" size={32} />
                    Logistika Harakati
                  </h3>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="text-left py-8 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Transfer ID</th>
                        <th className="text-left py-8 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Yo'nalish</th>
                        <th className="text-center py-8 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Holat</th>
                        <th className="text-right py-8 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Sana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transfers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">O'tkazmalar mavjud emas</p>
                          </td>
                        </tr>
                      ) : (
                        transfers.map(m => (
                          <tr key={m.id} className="group hover:bg-slate-50 transition-all duration-500">
                            <td className="py-10 px-8 font-black text-slate-950 text-sm tracking-widest uppercase">{m.transfer_number}</td>
                            <td className="py-10 px-8">
                              <div className="flex items-center gap-4 text-slate-950 font-black text-xs uppercase tracking-tight">
                                 {m.source_warehouse_name} <ArrowRightLeft size={12} className="text-slate-300" /> {m.destination_warehouse_name}
                              </div>
                            </td>
                            <td className="py-10 px-8 text-center">
                               <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                  m.status === 'received' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                               }`}>{m.status}</span>
                            </td>
                            <td className="py-10 px-8 text-right text-slate-400 font-bold text-[10px] uppercase">{new Date(m.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Side Column: Intelligent Alerts */}
            <div className="xl:col-span-4 space-y-12">
               <div className="bg-slate-950 p-12 rounded-[56px] text-white relative overflow-hidden h-fit">
                  <div className="absolute top-0 right-0 p-10 opacity-20 rotate-12">
                     <AlertTriangle size={120} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-10 leading-tight">Stock<br/>Intelligence</h3>
                  
                  <div className="space-y-8">
                    {products.filter(p => p.stock < 10).length === 0 ? (
                       <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-[40px]">
                          <ShieldCheck size={48} className="mx-auto text-white/20 mb-6" />
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Barcha qoldiqlar me'yorda</p>
                       </div>
                    ) : (
                      products.filter(p => p.stock < 10).slice(0, 5).map(p => (
                        <div key={p.id} className="bg-white/5 border border-white/5 rounded-[32px] p-8 group hover:bg-white hover:border-white transition-all duration-700">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="text-white font-black text-sm uppercase tracking-tight group-hover:text-slate-950 transition-colors">{p.name}</div>
                              <div className="text-white/40 font-black text-[9px] uppercase tracking-widest mt-2 group-hover:text-slate-400">SKU: {p.sku}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-rose-500 font-black text-3xl tracking-tighter tabular-nums">{p.stock}</div>
                              <div className="text-[9px] text-white/20 font-black uppercase tracking-widest group-hover:text-slate-300">Dona Qoldi</div>
                            </div>
                          </div>
                          <button className="w-full py-5 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl group-hover:bg-slate-950 group-hover:text-white transition-all flex items-center justify-center gap-3">
                            To'ldirish <ChevronRight size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
               </div>

               <div className="bg-white border-2 border-slate-50 p-12 rounded-[56px]">
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-widest mb-8">Resurslar</h3>
                  <div className="space-y-4">
                     <button className="w-full h-20 px-8 bg-slate-50 border border-slate-100 text-slate-950 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-950 hover:text-white transition-all flex items-center justify-between group">
                        <span className="flex items-center gap-4"><Box size={18} /> Tovar Hisoboti</span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-white" />
                     </button>
                     <button className="w-full h-20 px-8 bg-slate-50 border border-slate-100 text-slate-950 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-950 hover:text-white transition-all flex items-center justify-between group">
                        <span className="flex items-center gap-4"><History size={18} /> Harakatlar Tarixi</span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-white" />
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'warehouses' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {warehouses.map(w => (
                 <div key={w.id} className="bg-white border-2 border-slate-50 p-12 rounded-[56px] hover:shadow-2xl transition-all duration-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-all">
                       <WarehouseIcon size={120} />
                    </div>
                    <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center font-black text-3xl text-slate-950 mb-10">
                       {w.name[0]}
                    </div>
                    <h4 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-2">{w.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">{w.code} • {w.city}</p>
                    
                    <div className="space-y-4 pt-10 border-t border-slate-50 mb-10">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kategoriya</span>
                          <span className="text-xs font-black text-slate-950 uppercase tracking-widest">Asosiy Ombor</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Holat</span>
                          <span className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Faol
                          </span>
                       </div>
                    </div>

                    <button className="w-full h-18 bg-slate-950 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all">
                       Batafsil Monitor
                    </button>
                 </div>
              ))}
           </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Yangi Tovar O'tkazmasi">
         <div className="p-12 space-y-10 bg-white">
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Qaysi Ombordan</label>
                  <select className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 font-black text-slate-950 uppercase tracking-tight outline-none focus:border-slate-950 transition-all appearance-none">
                     <option>Tanlang</option>
                     {warehouses.map(w => <option key={w.id}>{w.name}</option>)}
                  </select>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Qaysi Omborga</label>
                  <select className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 font-black text-slate-950 uppercase tracking-tight outline-none focus:border-slate-950 transition-all appearance-none">
                     <option>Tanlang</option>
                     {warehouses.map(w => <option key={w.id}>{w.name}</option>)}
                  </select>
               </div>
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Mahsulot</label>
               <input type="text" placeholder="Qidirish..." className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 font-black text-slate-950 uppercase tracking-tight outline-none focus:border-slate-950 transition-all" />
            </div>
            <button className="w-full h-24 bg-slate-950 text-white rounded-[32px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl shadow-slate-950/20 hover:scale-[1.02] transition-all">
               Transferni Tasdiqlash
            </button>
         </div>
      </Modal>
    </div>
  );
}
