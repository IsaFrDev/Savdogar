import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Loader2, 
  Navigation, 
  Printer, 
  Users,
  Box,
  ChevronRight,
  ArrowRight,
  Zap,
  LayoutGrid,
  Calendar,
  Phone,
  Check,
  Ban
} from 'lucide-react';
import { DeliveryTracking } from '../../components/DeliveryTracking';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface OrdersProps {
  storeId?: number;
}

export function Orders({ storeId }: OrdersProps) {
  const { t, currency, language, formatPrice } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadOrders();
      loadCouriers();
    }
  }, [storeId]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await supabaseApi.orders.list(storeId!);
      const ordersArray = Array.isArray(data) ? data : (data && Array.isArray((data as any).data) ? (data as any).data : []);
      setOrders(ordersArray.sort((a: any, b: any) => (b.id || 0) - (a.id || 0)));
    } catch (error) {
      console.error('Failed to load orders from Supabase:', error);
    }
    setLoading(false);
  };

  const loadCouriers = async () => {
    try {
      const data = await supabaseApi.staff.list(storeId!);
      setCouriers(data);
    } catch (error) {
      console.error('Failed to load couriers from Supabase:', error);
    }
  };

  const handleAssignCourier = async (orderId: number, courierId: number) => {
    setIsAssigning(true);
    try {
      const updatedOrder = await supabaseApi.orders.assignCourier(orderId, { courier_id: courierId });
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to assign courier in Supabase:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toString().includes(searchTerm) ||
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const statuses = ['pending', 'confirmed', 'out_for_delivery', 'completed', 'cancelled'] as const;

  const statusTimeline = [
    { status: 'pending', icon: Clock, label: t('orderPlaced') },
    { status: 'confirmed', icon: Package, label: t('confirmedOrder') },
    { status: 'out_for_delivery', icon: Truck, label: t('out_for_delivery') },
    { status: 'completed', icon: CheckCircle, label: t('completed') },
  ];

  const getStatusIndex = (status: string) => {
    const index = statusTimeline.findIndex(s => s.status === status);
    return index === -1 ? 0 : index;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: number) => {
    e.dataTransfer.setData('orderId', orderId.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      const id = parseInt(orderId);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      try {
        await supabaseApi.orders.updateStatus(id, newStatus);
        if (selectedOrder?.id === id) {
          setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        }
      } catch (error) {
        console.error('Failed to update status in Supabase:', error);
        await loadOrders();
      }
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
      case 'confirmed': return 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]';
      case 'out_for_delivery': return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
      case 'completed': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      case 'cancelled': return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]';
      default: return 'bg-slate-700';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && orders.length === 0) {
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
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Operations Center</span>
          </div>
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('orders')}</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black">{orders.length} ta buyurtma mavjud</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 p-3 bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border-2 border-slate-50">
          <div className="relative group bg-slate-50 rounded-[20px] border border-slate-100 focus-within:border-slate-950 transition-all px-6 py-3 flex items-center gap-4">
             <Search size={18} className="text-slate-300 group-focus-within:text-slate-950" />
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Qidiruv..."
               className="bg-transparent border-none outline-none text-xs font-bold text-slate-950 placeholder:text-slate-300 w-48"
             />
          </div>
          
          <div className="h-8 w-px bg-slate-100" />
          
          <div className="flex items-center gap-3 pr-4">
             <Filter size={16} className="text-slate-400" />
             <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:text-slate-950 transition-all outline-none"
              >
                <option value="all">{t('allStatuses')}</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{t(status)}</option>
                ))}
              </select>
          </div>
        </div>
      </div>

      {/* Kanban Board - Premium Horizontal Flow */}
      <div className="flex gap-10 overflow-x-auto pb-12 snap-x custom-scrollbar">
        {statuses.map((status) => {
          const colOrders = filteredOrders.filter((o) => o.status === status);
          return (
            <div
              key={status}
              className="min-w-[400px] max-w-[400px] flex-shrink-0 flex flex-col snap-start group/col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3.5 h-3.5 rounded-full ${getStatusDotColor(status)}`} />
                  <h3 className="font-black text-slate-950 uppercase tracking-[0.3em] text-[11px] group-hover/col:text-indigo-600 transition-colors">
                    {t(status)}
                  </h3>
                </div>
                <div className="px-4 py-1.5 text-[10px] font-black bg-slate-50 text-slate-400 rounded-full border border-slate-100 shadow-sm">
                  {colOrders.length}
                </div>
              </div>

              <div className="flex-1 min-h-[650px] p-8 rounded-[48px] bg-slate-50 border-2 border-slate-50 shadow-inner space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-100/50 to-transparent pointer-events-none" />
                
                {colOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    onClick={() => setSelectedOrder(order)}
                    className="group bg-white p-8 rounded-[36px] border-2 border-transparent hover:border-slate-950/10 transition-all cursor-grab active:cursor-grabbing shadow-xl shadow-slate-200/20 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-700">
                       <LayoutGrid size={80} className="text-slate-950" />
                    </div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">ID: #{order.id}</span>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                           <Calendar size={12} />
                           {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all`}>
                        {order.delivery_type === 'delivery' ? <Truck size={18} /> : <MapPin size={18} />}
                      </div>
                    </div>

                    <div className="space-y-2 mb-8 relative z-10">
                      <h4 className="font-black text-slate-950 text-xl tracking-tighter uppercase group-hover:text-indigo-600 transition-colors truncate">{order.customer_name}</h4>
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                         <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 tabular-nums uppercase">{order.customer_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-slate-50 relative z-10">
                      <div className="flex flex-col">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2">Total Sum</p>
                        <span className="text-xl font-black text-slate-950 tabular-nums tracking-tighter">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                         <ChevronRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Detail Slide-over - Premium Overlay */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-3xl z-[100]"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 40, stiffness: 400 }}
              className="fixed right-0 top-0 h-full w-full max-w-3xl bg-white border-l-4 border-slate-50 shadow-[-40px_0_100px_rgba(0,0,0,0.1)] z-[101] overflow-hidden flex flex-col"
            >
              {/* Detail Header */}
              <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600/10 to-transparent" />
                <div>
                  <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase font-heading">Buyurtma Ma'lumoti</h2>
                  <div className="flex items-center gap-4 mt-3">
                     <p className="text-indigo-600 font-black uppercase tracking-[0.4em] text-[11px] flex items-center gap-3">
                        <Zap size={16} className="animate-pulse" />
                        ORDER #{selectedOrder.id}
                     </p>
                     <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(selectedOrder.status)}`}>
                        {t(selectedOrder.status)}
                     </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePrint}
                    className="w-16 h-16 bg-white hover:bg-slate-950 text-slate-400 hover:text-white rounded-[24px] border border-slate-100 transition-all flex items-center justify-center shadow-xl group"
                  >
                    <Printer size={24} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-16 h-16 bg-white border border-slate-100 rounded-[24px] text-slate-400 hover:text-slate-950 transition-all flex items-center justify-center shadow-xl group"
                  >
                    <X size={32} className="group-hover:rotate-90 transition-transform duration-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar">
                {/* Status Selection Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                   {statuses.map(s => (
                     <button
                       key={s}
                       onClick={() => handleDrop({ preventDefault: () => {} } as any, s)}
                       className={`px-6 py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                         selectedOrder.status === s 
                           ? 'bg-slate-950 border-slate-950 text-white shadow-2xl shadow-slate-950/20' 
                           : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-950 hover:bg-white'
                       }`}
                     >
                       {t(s)}
                     </button>
                   ))}
                </div>

                {/* Timeline Progress */}
                <div className="bg-slate-50 p-12 rounded-[56px] border border-slate-100 relative overflow-hidden group shadow-inner">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                      <Clock size={160} className="text-slate-950" />
                   </div>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                      <div className="w-10 h-px bg-slate-200" /> Lifecycle Status
                   </h3>
                   <div className="relative pl-4">
                      <div className="absolute left-[31px] top-4 bottom-4 w-1 bg-slate-200 rounded-full" />
                      {statusTimeline.map((step, index) => {
                        const currentIndex = getStatusIndex(selectedOrder.status);
                        const isCancelled = selectedOrder.status === 'cancelled';
                        const isActive = index <= currentIndex && !isCancelled;
                        const isCurrent = index === currentIndex && !isCancelled;

                        return (
                          <div key={step.status} className="relative flex items-center gap-12 pb-16 last:pb-0">
                            <div className={`relative z-10 w-16 h-16 rounded-[24px] border-4 transition-all duration-1000 flex items-center justify-center ${
                              isActive 
                                ? isCurrent 
                                  ? 'bg-slate-950 text-white border-white shadow-2xl scale-110' 
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm'
                                : 'bg-white text-slate-200 border-slate-50 opacity-40'
                            }`}>
                              <step.icon size={28} className={isCurrent ? 'animate-pulse' : ''} />
                            </div>
                            <div className="flex flex-col">
                               <p className={`text-xl font-black tracking-tighter uppercase ${isActive ? 'text-slate-950' : 'text-slate-300'}`}>
                                 {step.label}
                               </p>
                               {isCurrent && <p className="text-[9px] text-indigo-600 font-black uppercase tracking-[0.3em] mt-2">Hozirgi holat</p>}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Customer Info */}
                   <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 group hover:bg-white transition-all duration-500 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                         <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                            <Users size={24} />
                         </div>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Mijoz ma'lumotlari</p>
                      <h4 className="text-2xl font-black text-slate-950 tracking-tighter uppercase mb-4">{selectedOrder.customer_name}</h4>
                      <div className="flex items-center gap-4 text-indigo-600 bg-white w-fit px-4 py-2 rounded-xl border border-slate-100">
                         <Phone size={14} />
                         <span className="text-sm font-black tabular-nums tracking-widest">{selectedOrder.customer_phone}</span>
                      </div>
                   </div>

                   {/* Shipping Info */}
                   <div className="p-10 bg-slate-50 rounded-[48px] border border-slate-100 group hover:bg-white transition-all duration-500 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                         <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                            <MapPin size={24} />
                         </div>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Yetkazib berish</p>
                      <p className="text-lg font-bold text-slate-950 leading-snug">
                        {selectedOrder.delivery_address || 'Do\'kondan olib ketish (Self-pickup)'}
                      </p>
                   </div>
                </div>

                {/* Items List */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Buyurtma Tarkibi</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedOrder.items?.length || 0} Mahsulotlar</span>
                   </div>
                   <div className="grid grid-cols-1 gap-6">
                      {selectedOrder.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-8 p-8 bg-white rounded-[40px] border-2 border-slate-50 group hover:border-slate-100 transition-all duration-500 shadow-sm">
                           <div className="w-24 h-24 rounded-[32px] bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 shadow-inner">
                              {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-100">
                                   <Package size={40} />
                                </div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-black text-slate-950 truncate uppercase tracking-tight mb-2">{item.product_name}</h4>
                              <div className="flex items-center gap-4">
                                 <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                    {item.quantity} Dona
                                 </div>
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">x {formatPrice(item.price_at_order)}</span>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Subtotal</p>
                              <p className="text-2xl font-black text-slate-950 tabular-nums tracking-tighter">
                                 {formatPrice(item.price_at_order * item.quantity)}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="px-12 py-12 border-t-4 border-slate-50 bg-white sticky bottom-0 shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-indigo-600 font-black uppercase tracking-[0.5em] text-[12px] mb-4">Yakuniy Summa</p>
                       <h4 className="text-6xl font-black text-slate-950 tabular-nums tracking-tighter drop-shadow-xl">
                          {formatPrice(selectedOrder.total)}
                       </h4>
                    </div>
                    <div className="flex flex-col gap-4 items-end">
                       <button className="px-12 py-6 bg-slate-950 text-white rounded-[28px] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-slate-950/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                          <Check size={20} /> Tasdiqlash
                       </button>
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">To'lov usuli: Naqd pul / Karta</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTracking && selectedOrder && (
          <DeliveryTracking
            orderId={selectedOrder.id}
            status={selectedOrder.status}
            courierInfo={selectedOrder.courier_details}
            onClose={() => setIsTracking(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          .no-print, nav, aside, .glass-card:not(.print-slip) { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          #root { display: none !important; }
        }
      `}</style>
    </div>
  );
}
