import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Package, MapPin, Bell, Trash2, Star, Check, Plus, Clock, ChevronRight
} from 'lucide-react';

interface ProfileModalProps {
  show: boolean;
  setShow: (v: boolean) => void;
  user: any;
  tab: 'info' | 'orders' | 'addresses' | 'notifications';
  setTab: (tab: 'info' | 'orders' | 'addresses' | 'notifications') => void;
  orderFilter: string;
  setOrderFilter: (v: string) => void;
  orders: any[];
  addresses: any[];
  addAddress: (address: any) => void;
  deleteAddress: (id: number) => void;
  setDefaultAddress: (id: number) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivering: 'bg-violet-100 text-violet-700 border-violet-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  preparing: 'Tayyorlanmoqda',
  delivering: 'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};

export function ProfileModal({
  show, setShow, user, tab, setTab,
  orderFilter, setOrderFilter, orders = [],
  addresses = [], addAddress, deleteAddress, setDefaultAddress
}: ProfileModalProps) {
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  if (!show) return null;

  const tabs = [
    { id: 'info' as const, icon: User, label: 'Shaxsiy ma\'lumotlarim' },
    { id: 'orders' as const, icon: Package, label: 'Buyurtmalarim' },
    { id: 'addresses' as const, icon: MapPin, label: 'Manzillarim' },
    { id: 'notifications' as const, icon: Bell, label: 'Bildirishnomalar' },
  ];

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderFilter);

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.address) {
      addAddress(newAddress);
      setNewAddress({ label: '', address: '' });
      setShowAddForm(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110]"
            onClick={() => setShow(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[85vh] bg-white rounded-[40px] shadow-2xl z-[120] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                    {user?.first_name || 'Mehmon'} {user?.last_name || ''}
                  </h2>
                  <p className="text-xs font-bold text-slate-400">{user?.phone || user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={() => setShow(false)}
                className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-950"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-50 px-6 shrink-0 overflow-x-auto no-scrollbar">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2.5 px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                    tab === t.id
                      ? 'text-slate-950 border-slate-950'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Info Tab */}
                  {tab === 'info' && (
                    <div className="space-y-6">
                      {[
                        { label: 'Ism', value: user?.first_name || '—' },
                        { label: 'Familiya', value: user?.last_name || '—' },
                        { label: 'Telefon', value: user?.phone || '—' },
                        { label: 'Email', value: user?.email || '—' },
                        { label: 'Ro\'yxatdan o\'tgan', value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString('uz-UZ') : '—' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                          <span className="text-sm font-bold text-slate-950">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Orders Tab */}
                  {tab === 'orders' && (
                    <div className="space-y-6">
                      {/* Order Filters */}
                      <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'confirmed', 'delivering', 'delivered', 'cancelled'].map(f => (
                          <button
                            key={f}
                            onClick={() => setOrderFilter(f)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              orderFilter === f
                                ? 'bg-slate-950 text-white border-slate-950'
                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                            }`}
                          >
                            {f === 'all' ? 'Barchasi' : statusLabels[f] || f}
                          </button>
                        ))}
                      </div>

                      {/* Order List */}
                      {filteredOrders.length === 0 ? (
                        <div className="text-center py-16">
                          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                          <p className="text-sm font-bold text-slate-400">Buyurtmalar topilmadi</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredOrders.map((order: any) => (
                            <div key={order.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-black text-slate-950">#{order.order_number}</span>
                                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusColors[order.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    {statusLabels[order.status] || order.status}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                  {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-400">
                                  {order.items?.length || 0} ta mahsulot
                                </span>
                                <span className="text-lg font-black text-slate-950">
                                  {Number(order.total).toLocaleString()} <span className="text-xs text-slate-400">UZS</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Addresses Tab */}
                  {tab === 'addresses' && (
                    <div className="space-y-6">
                      {addresses.map((addr: any) => (
                        <div key={addr.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                              <MapPin size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-950 mb-1">{addr.label || 'Manzil'}</p>
                              <p className="text-xs font-medium text-slate-500">{addr.address}</p>
                              {addr.is_default && (
                                <span className="inline-flex items-center gap-1 mt-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                  <Check size={12} /> Asosiy
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!addr.is_default && (
                              <button
                                onClick={() => setDefaultAddress(addr.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                                title="Asosiy qilish"
                              >
                                <Star size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteAddress(addr.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                              title="O'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Address Form */}
                      {showAddForm ? (
                        <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-4">
                          <input
                            type="text"
                            placeholder="Manzil nomi (masalan: Uy, Ofis)"
                            value={newAddress.label}
                            onChange={e => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-950 outline-none focus:border-indigo-200"
                          />
                          <input
                            type="text"
                            placeholder="To'liq manzil"
                            value={newAddress.address}
                            onChange={e => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-950 outline-none focus:border-indigo-200"
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={handleAddAddress}
                              className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                            >
                              Saqlash
                            </button>
                            <button
                              onClick={() => { setShowAddForm(false); setNewAddress({ label: '', address: '' }); }}
                              className="px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                              Bekor
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="w-full p-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-3"
                        >
                          <Plus size={20} />
                          <span className="text-xs font-black uppercase tracking-widest">Yangi manzil qo'shish</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {tab === 'notifications' && (
                    <div className="space-y-4">
                      {orders.length > 0 ? (
                        orders.slice(0, 10).map((order: any, i: number) => (
                          <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                              <Bell size={18} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-950">
                                Buyurtma #{order.order_number} — {statusLabels[order.status] || order.status}
                              </p>
                              <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                                <Clock size={12} />
                                {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 shrink-0 mt-1" />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                          <p className="text-sm font-bold text-slate-400">Bildirishnomalar yo'q</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
