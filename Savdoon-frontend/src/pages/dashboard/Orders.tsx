import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Package, Truck, MapPin, Clock, CheckCircle, Loader2, Navigation, Printer, Users } from 'lucide-react';
import { DeliveryTracking } from '../../components/DeliveryTracking';
import { useApp } from '../../context/AppContext';
import { orderApi, deliveryApi } from '../../services/api';

interface OrdersProps {
  storeId?: number;
}

export function Orders({ storeId }: OrdersProps) {
  const { t, currency, language } = useApp();
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
      const response = await orderApi.list({ store: storeId });
      setOrders(response.data.sort((a: any, b: any) => (b.id || 0) - (a.id || 0)));
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
    setLoading(false);
  };

  const loadCouriers = async () => {
    try {
      const response = await deliveryApi.getCouriers({ store: storeId });
      setCouriers(response.data);
    } catch (error) {
      console.error('Failed to load couriers:', error);
    }
  };

  const handleAssignCourier = async (orderId: number, courierId: number) => {
    setIsAssigning(true);
    try {
      const response = await orderApi.assignCourier(orderId, { courier_id: courierId });
      await loadOrders();
      const updatedOrder = response.data;
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to assign courier:', error);
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
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'confirmed': return 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20';
      case 'out_for_delivery': return 'bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] border-[var(--brand-secondary)]/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default: return 'bg-slate-50 text-[var(--text-muted)] border-[var(--color-border)]';
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
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      try {
        await orderApi.updateStatus(id, newStatus);
        if (selectedOrder?.id === id) {
          setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        }
      } catch (error) {
        console.error('Failed to drop status:', error);
        await loadOrders(); // Revert on failure
      }
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
      case 'confirmed': return 'bg-[var(--brand-primary)] shadow-[0_0_10px_var(--brand-primary-glow)]';
      case 'out_for_delivery': return 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]';
      case 'completed': return 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]';
      case 'cancelled': return 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]';
      default: return 'bg-slate-400';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
        <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">{t('loading') || 'Yuklanmoqda...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase">{t('orders')}</h1>
        <p className="text-[var(--text-muted)] mt-1 uppercase tracking-[0.2em] text-[10px] font-black">{orders.length} {t('orderTotalCount')}</p>
      </div>

      {/* Filters */}
      <div className="p-1.5 bg-white/[0.03] rounded-2xl border border-[var(--color-border)] shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchOrders') || 'Buyurtmalarni izlash...'}
              className="w-full pl-14 pr-4 py-4 rounded-xl border-none bg-transparent focus:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-bold text-sm"
            />
          </div>
          <div className="h-10 w-[1px] bg-[var(--color-border)] self-center hidden sm:block opacity-50" />
          <div className="flex items-center gap-2 px-4">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-4 rounded-xl border-none bg-transparent focus:ring-0 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:text-[var(--text-primary)] transition-all"
            >
              <option value="all" className="bg-white text-[var(--text-primary)]">{t('allStatuses') || 'Barcha holatlar'}</option>
              {statuses.map((status) => (
                <option key={status} value={status} className="bg-white text-[var(--text-primary)]">{t(status)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x relative z-10 custom-scrollbar">
        {statuses.map((status) => {
          const colOrders = filteredOrders.filter((o) => o.status === status);
          return (
            <div
              key={status}
              className="min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col snap-start"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(status)}`} />
                  <h3 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs">
                    {t(status)}
                  </h3>
                </div>
                <span className="px-3 py-1 text-[10px] font-black bg-white rounded-xl border border-[var(--color-border)] shadow-sm text-[var(--text-muted)]">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 min-h-[500px] p-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 backdrop-blur-md shadow-inner transition-colors duration-300">
                <div className="flex flex-col gap-4">
                  {colOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm hover:shadow-2xl hover:shadow-[var(--brand-primary)]/10 cursor-grab active:cursor-grabbing hover:border-[var(--brand-primary)]/30 transition-all group select-none"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-black text-[var(--brand-primary)] bg-[var(--brand-primary)]/5 px-2.5 py-1.5 rounded-lg border border-[var(--brand-primary)]/10">
                            #{order.id}
                          </span>
                          <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="font-black text-[var(--text-primary)] text-sm mb-1 leading-tight">{order.customer_name}</p>
                        <p className="text-[10px] font-black tracking-widest text-[var(--text-muted)] mb-5 opacity-70">{order.customer_phone}</p>

                        <div className="flex items-end justify-between mt-auto">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{t('totalAmount') || 'Summa'}</p>
                            <span className="text-sm font-black text-[var(--text-primary)] tabular-nums tracking-tight">
                              {order.total?.toLocaleString()} <span className="text-[9px] text-[var(--text-muted)]">{currency}</span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-[var(--color-border)] text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] group-hover:border-[var(--brand-primary)]/30 transition-colors shadow-sm">
                              {order.delivery_type === 'delivery' ? <Truck className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {colOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-40">
                      <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center mb-4">
                        <Package className="w-6 h-6 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] text-center">{t('noOrdersFound')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Detail Slide-over */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 350 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white !rounded-none sm:!rounded-l-[3rem] border-l border-[var(--color-border)] shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              <div className="p-10 border-b border-[var(--color-border)] flex items-center justify-between bg-slate-50/50 backdrop-blur-3xl sticky top-0 z-20 no-print">
                <div className="flex items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase">{t('orderDetails')}</h2>
                    <p className="text-[var(--brand-primary)] font-black uppercase tracking-[0.3em] text-xs mt-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                      #{selectedOrder.id}
                    </p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="p-4 bg-white hover:bg-[var(--brand-primary)]/5 rounded-2xl transition-all text-[var(--text-muted)] hover:text-[var(--brand-primary)] border border-[var(--color-border)] group shadow-sm"
                    title={t('printSlip') || 'Print Receipt'}
                  >
                    <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-4 bg-white border border-[var(--color-border)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-all group shadow-sm active:scale-90"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>

              <div className="p-10 space-y-12 flex-1 custom-scrollbar">
                {/* Status Timeline */}
                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm">
                  <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] mb-12 opacity-60 italic">{t('orderStatusHistory') || 'Buyurtma tarixi'}</h3>
                  <div className="relative pl-2">
                    <div className="absolute left-6 top-1 bottom-1 w-[2px] bg-[var(--color-border)]" />
                    {statusTimeline.map((step, index) => {
                      const currentIndex = getStatusIndex(selectedOrder.status);
                      const isCancelled = selectedOrder.status === 'cancelled';
                      const isActive = index <= currentIndex && !isCancelled;
                      const isCurrent = index === currentIndex && !isCancelled;

                      return (
                        <div key={step.status} className="relative flex items-center gap-10 pb-12 last:pb-0">
                          <div className={`relative z-10 w-12 h-12 rounded-2xl border transition-all duration-700 flex items-center justify-center ${isActive
                            ? isCurrent
                              ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xl shadow-[var(--brand-primary-glow)] scale-110'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none'
                            : 'bg-white text-slate-300 border-[var(--color-border)]'
                            }`}>
                            <step.icon className={`w-5.5 h-5.5 ${isCurrent ? 'animate-pulse' : ''}`} />
                            {isActive && !isCurrent && (
                              <div className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-base font-black transition-all duration-500 tracking-tight uppercase ${isActive ? 'text-[var(--text-primary)]' : 'text-slate-300'}`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <span className="inline-block mt-2 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest leading-none border border-[var(--brand-primary)]/10">Faol bosqich</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {selectedOrder.status === 'cancelled' && (
                      <div className="relative flex items-center gap-10 pt-4">
                        <div className="absolute left-6 top-0 h-4 w-[2px] bg-rose-500/20" />
                        <div className="relative z-10 w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shadow-xl shadow-rose-500/10">
                          <X className="w-5.5 h-5.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-black text-rose-500 tracking-tight font-heading uppercase">{t('cancelled')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedOrder.status === 'out_for_delivery' && (
                    <button
                      onClick={() => setIsTracking(true)}
                      className="w-full mt-8 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      <Navigation className="w-4 h-4" />
                      {language === 'uz' ? 'Jonli kuzatuv' : 'Live Tracking'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Customer Info */}
                  <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-[var(--color-border)] space-y-8 hover:bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/5 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] group-hover:scale-110 transition-transform shadow-sm">
                          <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em]">{t('customer')}</h3>
                      </div>
                    </div>
                    <div className="space-y-6 relative z-10">
                      <div>
                        <p className="text-[var(--text-primary)] font-black text-2xl tracking-tighter uppercase font-heading">{selectedOrder.customer_name}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <p className="text-sm text-[var(--text-muted)] font-black tabular-nums tracking-widest">{selectedOrder.customer_phone}</p>
                        </div>
                      </div>
                      {selectedOrder.customer_email && (
                        <p className="text-[10px] text-[var(--brand-primary)] font-black uppercase tracking-widest px-5 py-2.5 bg-[var(--brand-primary)]/5 rounded-2xl border border-[var(--brand-primary)]/10 inline-block">{selectedOrder.customer_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-[var(--color-border)] space-y-8 hover:bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-secondary)]/5 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] group-hover:scale-110 transition-transform shadow-sm">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em]">
                          {selectedOrder.delivery_type === 'delivery' ? t('delivery') : t('pickup')}
                        </h3>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-[var(--color-border)] relative z-10 shadow-inner">
                      {selectedOrder.delivery_type === 'delivery' ? (
                        <p className="text-[var(--text-primary)] font-bold leading-relaxed text-sm italic">{selectedOrder.delivery_address}</p>
                      ) : (
                        <p className="text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 opacity-60">
                          <Clock className="w-4 h-4" />
                          {t('pickupAtStore') || 'Do\'kondan olib ketish'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Courier Assignment */}
                  {selectedOrder.delivery_type === 'delivery' && (
                    <div className="p-8 rounded-[2.5rem] bg-[var(--brand-primary)]/[0.03] border border-[var(--brand-primary)]/20 space-y-8">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-sm">
                          <Truck className="w-5 h-5" />
                        </div>
                        <h3 className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.25em]">{t('courier') || 'Kuryer'}</h3>
                      </div>

                      {selectedOrder.courier_details ? (
                        <div className="bg-white p-6 rounded-3xl border border-[var(--color-border)] flex items-center justify-between shadow-sm">
                          <div>
                            <p className="text-[var(--text-primary)] font-black uppercase tracking-tight text-lg">{selectedOrder.courier_details.name}</p>
                            <p className="text-xs text-[var(--text-muted)] font-black mt-1.5 tracking-widest tabular-nums opacity-60">{selectedOrder.courier_details.phone}</p>
                            <span className="inline-block mt-3 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                              {selectedOrder.courier_details.vehicle}
                            </span>
                          </div>

                        </div>
                      ) : (
                        <div className="space-y-6">
                          <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">Kuryer biriktirilmagan</p>
                          <div className="grid grid-cols-1 gap-4">
                            {couriers.length > 0 ? (
                              <div className="flex flex-col gap-4">
                                <select
                                  onChange={(e) => e.target.value && handleAssignCourier(selectedOrder.id, parseInt(e.target.value))}
                                  disabled={isAssigning}
                                  className="w-full bg-white border border-[var(--color-border)] rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] shadow-sm appearance-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Kuryerni tanlang...</option>
                                  {couriers.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.user_details?.first_name} {c.user_details?.last_name} ({c.vehicle_type})
                                    </option>
                                  ))}
                                </select>
                                {isAssigning && <Loader2 className="w-5 h-5 text-[var(--brand-primary)] animate-spin mx-auto" />}
                              </div>
                            ) : (
                              <p className="text-[10px] text-rose-500 font-black uppercase bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm leading-relaxed">
                                Bo'sh kuryerlar topilmadi. Avval kuryer qo'shing.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] italic">{t('items')} ({selectedOrder.items?.length})</h3>
                    <div className="h-[1px] flex-1 bg-[var(--color-border)] mx-10 opacity-50" />
                  </div>
                  <div className="space-y-6">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-slate-50 border border-[var(--color-border)] group hover:bg-white hover:shadow-xl transition-all duration-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--brand-primary)]/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.product_name}
                              className="w-20 h-20 rounded-2xl object-cover border border-[var(--color-border)] shadow-md group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center border border-[var(--color-border)] shadow-sm">
                              <Package className="w-10 h-10 text-slate-100" />
                            </div>
                          )}
                          <div className="absolute -right-2.5 -top-2.5 min-w-[28px] h-7 px-1.5 rounded-xl bg-[var(--brand-primary)] border-4 border-white flex items-center justify-center text-[11px] font-black text-white shadow-xl">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                          <p className="text-[15px] font-black text-[var(--text-primary)] truncate group-hover:text-[var(--brand-primary)] transition-colors uppercase tracking-tight">{item.product_name}</p>
                          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2 tabular-nums opacity-60 italic">{t('price')}: {item.price_at_order?.toLocaleString()} {currency}</p>
                        </div>
                        <p className="text-lg font-black text-[var(--text-primary)] tabular-nums px-4 relative z-10">
                          {((item.price_at_order || 0) * (item.quantity || 1)).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Footer */}
              <div className="p-10 bg-white border-t border-[var(--color-border)] sticky bottom-0 z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between bg-slate-950 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/20 -mr-32 -mt-32 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--brand-primary)]/30 transition-all duration-1000" />
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.4em] mb-3 inline-block">{t('totalAmount') || 'Umumiy summa'}</span>
                    <p className="text-5xl font-black text-white mt-2 tabular-nums tracking-tighter shadow-sm">
                      {selectedOrder.total?.toLocaleString()} <span className="text-sm font-black text-[var(--brand-primary)]/80 ml-1.5 uppercase font-heading">{currency}</span>
                    </p>
                  </div>
                  <div className={`px-8 py-4 rounded-2xl border-2 shadow-2xl relative z-10 backdrop-blur-md ${getStatusColor(selectedOrder.status)} bg-opacity-90`}>
                    <p className="text-xs font-black uppercase tracking-[0.25em]">{t(selectedOrder.status)}</p>
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

      {/* Printable Slip (Hidden in UI) */}
      {selectedOrder && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
          <div className="w-[80mm] mx-auto p-4 text-black font-mono text-[12px] leading-tight">
            <div className="text-center mb-6">
              <h1 className="text-xl font-black uppercase">Savdoon</h1>
              <p className="mt-1">{new Date().toLocaleString()}</p>
              <div className="border-b border-black border-dashed my-2" />
              <p className="font-bold">ORD-#{selectedOrder.id}</p>
            </div>

            <div className="mb-4">
              <p className="font-bold uppercase mb-1">{t('customer')}:</p>
              <p>{selectedOrder.customer_name}</p>
              <p>{selectedOrder.customer_phone}</p>
              {selectedOrder.delivery_type === 'delivery' && (
                <p className="mt-1">{selectedOrder.delivery_address}</p>
              )}
            </div>

            <div className="border-b border-black border-dashed my-4" />

            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-black border-dashed">
                  <th className="text-left py-1 font-bold">{t('item') || 'Mahsulot'}</th>
                  <th className="text-right py-1 font-bold">{t('qty') || 'Soni'}</th>
                  <th className="text-right py-1 font-bold">{t('total') || 'Summa'}</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-2">{item.product_name}</td>
                    <td className="text-right py-2">x{item.quantity}</td>
                    <td className="text-right py-2">{(item.price_at_order * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-black border-dashed pt-4">
              <div className="flex justify-between font-black text-sm">
                <span>{t('total')}:</span>
                <span>{selectedOrder.total?.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-[10px] mt-2 lowercase italic">
                <span>{t('payment')}:</span>
                <span>{t(selectedOrder.payment_method)}</span>
              </div>
            </div>

            <div className="text-center mt-10 border-t border-black border-dashed pt-6">
              <p className="font-bold">Xaridingiz uchun rahmat!</p>
              <p className="text-[10px] mt-1 italic">Powered by Savdoon.asia</p>
            </div>
          </div>
        </div>
      )}

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
