import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck, Package, MapPin, Navigation,
    Clock, LogOut, Loader2, Phone, Power,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderApi, deliveryApi } from '../../services/api';
import { Button } from '../../components/Button';

export function CourierDashboard({ onLogout }: { onLogout: () => void }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'assigned' | 'history'>('assigned');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    useEffect(() => {
        loadData();

        // Setup location tracking if available
        let watchId: number;
        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    deliveryApi.updateLocation(latitude, longitude).catch(err => console.error(err));
                },
                (error) => console.error('Tracking error:', error),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profileRes, ordersRes] = await Promise.all([
                deliveryApi.getProfile(),
                orderApi.list({ status: activeTab === 'assigned' ? 'confirmed' : 'completed' })
                // Note: On backend we should ensure couriers only see their assigned orders
            ]);
            setProfile(profileRes.data);
            setOrders(ordersRes.data);
        } catch (error) {
            console.error('Failed to load courier data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            await deliveryApi.updateStatus(newStatus);
            setProfile((prev: any) => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleOrderAction = async (orderId: number, nextStatus: string) => {
        try {
            await orderApi.updateStatus(orderId, nextStatus);
            loadData();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('Failed to update order status:', error);
        }
    };

    if (loading && !profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Kuryer platformasi...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-[var(--brand-primary)]/30">
            {/* Header / Profile Summary */}
            <div className="bg-slate-900 border-b border-white/5 p-6 sticky top-0 z-30 backdrop-blur-xl bg-opacity-80">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg shadow-[var(--brand-primary-glow)]">
                            <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black uppercase tracking-tight text-lg">{user?.first_name || 'Kuryer'}</h2>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${profile?.status === 'available' ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">
                                    {profile?.status === 'available' ? 'Navbatchilikda' : 'Oflayn'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleStatusUpdate(profile?.status === 'available' ? 'offline' : 'available')}
                        className={`p-3 rounded-xl border transition-all ${profile?.status === 'available' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
                    >
                        <Power className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <main className="max-w-md mx-auto p-6 pb-24 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-2xl border-white/5 bg-white/[0.02]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Buyurtmalar</p>
                        <p className="text-xl font-black text-white">{profile?.completed_deliveries || 0}</p>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border-white/5 bg-white/[0.02]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reyting</p>
                        <p className="text-xl font-black text-emerald-400">{profile?.rating || '5.0'}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'assigned' ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]' : 'text-slate-500 hover:text-white'}`}
                    >
                        Buyurtmalar
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]' : 'text-slate-500 hover:text-white'}`}
                    >
                        Tarix
                    </button>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <motion.div
                                key={order.id}
                                layoutId={`order-${order.id}`}
                                onClick={() => setSelectedOrder(order)}
                                className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-widest">#{order.id}</span>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <span className="text-[10px] font-bold text-slate-500">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-[var(--brand-primary)] transition-colors">
                                    {order.customer_name}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-400 mb-4">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                    <p className="text-xs font-medium truncate">{order.delivery_address}</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <span className="text-lg font-black text-white">{order.total?.toLocaleString()} <span className="text-[10px] text-slate-600">UZS</span></span>
                                    <div className="p-2 rounded-xl bg-white/5 group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--primary-foreground)] transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
                            <Package className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Hozircha buyurtmalar yo'q</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
                    >
                        <div className="p-6 flex items-center justify-between border-b border-white/5">
                            <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white/5 rounded-xl">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                            <h2 className="font-black uppercase tracking-widest text-sm">Buyurtma Tafsiloti</h2>
                            <div className="w-12"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="text-center space-y-2">
                                <p className="text-[var(--brand-primary)] font-black tracking-[0.2em] text-xs">#{selectedOrder.id}</p>
                                <h1 className="text-3xl font-black text-white uppercase">{selectedOrder.customer_name}</h1>
                                <a href={`tel:${selectedOrder.customer_phone}`} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-black tracking-widest">
                                    <Phone className="w-4 h-4" />
                                    {selectedOrder.customer_phone}
                                </a>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-rose-500" />
                                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Yetkazish manzili</h3>
                                </div>
                                <p className="text-white font-medium text-lg leading-relaxed">{selectedOrder.delivery_address}</p>
                                <Button className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl">
                                    <Navigation className="w-5 h-5" />
                                    Navigatsiyani ochish
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-2">Mahsulotlar</h3>
                                {selectedOrder.items?.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-black text-[var(--brand-primary)]">
                                                {item.quantity}x
                                            </div>
                                            <p className="font-bold text-white uppercase text-xs">{item.product_name}</p>
                                        </div>
                                        <p className="font-black text-xs">{(item.product_price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-slate-900">
                            {selectedOrder.status === 'confirmed' && (
                                <Button
                                    onClick={() => handleOrderAction(selectedOrder.id, 'processing')}
                                    className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-sm bg-[var(--brand-primary)] hover:brightness-110 shadow-xl shadow-[var(--brand-primary-glow)] text-[var(--primary-foreground)]"
                                >
                                    Tayyorlashni boshlash
                                </Button>
                            )}
                            {selectedOrder.status === 'processing' && (
                                <Button
                                    onClick={() => handleOrderAction(selectedOrder.id, 'out_for_delivery')}
                                    className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-sm bg-[var(--brand-secondary)] hover:brightness-110 shadow-xl shadow-[var(--brand-primary-glow)] text-[var(--primary-foreground)]"
                                >
                                    Yo'lga chiqdim
                                </Button>
                            )}
                            {selectedOrder.status === 'out_for_delivery' && (
                                <Button
                                    onClick={() => handleOrderAction(selectedOrder.id, 'completed')}
                                    className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-sm bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/20"
                                >
                                    Topshirildi (Yakunlash)
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/5 p-4 z-40">
                <div className="max-w-md mx-auto flex items-center justify-around">
                    <button className="flex flex-col items-center gap-1 text-[var(--brand-primary)]">
                        <Truck className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Buyurtmalar</span>
                    </button>
                    <button onClick={onLogout} className="flex flex-col items-center gap-1 text-slate-600 hover:text-white transition-colors">
                        <LogOut className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Chiqish</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
