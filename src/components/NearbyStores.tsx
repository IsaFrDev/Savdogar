import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, Store, Star } from 'lucide-react';
import { storeApi } from '../services/api';
import { useApp } from '../context/AppContext';
import { GlassCard } from './GlassCard';

interface NearbyStoresProps {
    onStoreClick: (storeId: number) => void;
}

interface NearbyStore {
    id: number;
    name: string;
    logo?: string;
    address?: string;
    distance_km?: number;
    rating?: number;
    is_open?: boolean;
    slug?: string;
}

export function NearbyStores({ onStoreClick }: NearbyStoresProps) {
    const { language } = useApp();
    const [stores, setStores] = useState<NearbyStore[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationGranted, setLocationGranted] = useState(false);
    const [radius, setRadius] = useState(10);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError(language === 'uz' ? 'Geolokatsiya qo\'llab-quvvatlanmaydi' : 'Geolocation not supported');
            return;
        }

        setLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setLocationGranted(true);
                try {
                    const res = await storeApi.getNearby(
                        position.coords.latitude,
                        position.coords.longitude,
                        radius
                    );
                    setStores(Array.isArray(res.data) ? res.data : res.data.results || []);
                } catch (err) {
                    console.error('Failed to fetch nearby stores:', err);
                    setError(language === 'uz' ? 'Do\'konlarni yuklashda xatolik' : 'Failed to load stores');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setLoading(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setError(language === 'uz' ? 'Joylashuvga ruxsat berilmadi' : 'Location permission denied');
                } else {
                    setError(language === 'uz' ? 'Joylashuvni aniqlab bo\'lmadi' : 'Could not determine location');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <GlassCard className="overflow-hidden">
                {/* Header */}
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                            <Navigation className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                {language === 'uz' ? 'Yaqin Do\'konlar' : language === 'ru' ? 'Ближайшие Магазины' : 'Nearby Stores'}
                            </h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                {language === 'uz' ? 'Atrofingizdagi do\'konlarni toping' : 'Find stores around you'}
                            </p>
                        </div>
                    </div>

                    {!locationGranted ? (
                        <button
                            onClick={requestLocation}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <MapPin className="w-4 h-4" />
                            )}
                            {language === 'uz' ? 'Joylashuvni aniqlash' : 'Detect Location'}
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <select
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-bold outline-none"
                            >
                                <option value={5}>5 km</option>
                                <option value={10}>10 km</option>
                                <option value={25}>25 km</option>
                                <option value={50}>50 km</option>
                            </select>
                            <button
                                onClick={requestLocation}
                                disabled={loading}
                                className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    {error && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold text-center mb-6">
                            {error}
                        </div>
                    )}

                    {!locationGranted && !error && (
                        <div className="text-center py-12">
                            <MapPin className="w-16 h-16 text-slate-800 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 font-bold text-sm mb-2">
                                {language === 'uz' ? 'Joylashuvingizni ulashing' : 'Share your location'}
                            </p>
                            <p className="text-slate-600 text-xs max-w-sm mx-auto">
                                {language === 'uz'
                                    ? 'Yaqin atrofingizdagi do\'konlarni ko\'rish uchun joylashuvingizni aniqlang'
                                    : 'Enable location to discover stores near you'}
                            </p>
                        </div>
                    )}

                    {locationGranted && stores.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Store className="w-16 h-16 text-slate-800 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                                {language === 'uz' ? 'Yaqinda do\'kon topilmadi' : 'No stores nearby'}
                            </p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                                {language === 'uz' ? 'Qidirilmoqda...' : 'Searching...'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stores.map((store: NearbyStore, index: number) => (
                                <motion.div
                                    key={store.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => onStoreClick(store.id)}
                                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/20 hover:bg-white/[0.05] cursor-pointer transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/5 overflow-hidden flex-shrink-0">
                                            {store.logo ? (
                                                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                    <Store className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-violet-400 transition-colors">
                                                {store.name}
                                            </h4>
                                            {store.address && (
                                                <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                                                    {store.address}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2">
                                                {store.distance_km !== undefined && (
                                                    <span className="text-[10px] text-violet-400 font-black uppercase tracking-widest">
                                                        📍 {store.distance_km.toFixed(1)} km
                                                    </span>
                                                )}
                                                {store.rating !== undefined && (
                                                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-black">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {store.rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </GlassCard>
        </section>
    );
}
