import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Heart,
    ShoppingCart,
    Trash2,
    Loader2,
    Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';

export function WishlistPage() {
    const { t, currency } = useApp();
    const [items, setItems] = useState<any[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [wishlistRes, recentRes] = await Promise.all([
                supabaseApi.wishlist.list(),
                supabaseApi.recentlyViewed.list()
            ]);
            setItems(wishlistRes.data);
            setRecentlyViewed(recentRes.data);
        } catch (error) {
            console.error('Failed to load wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (productId: number) => {
        try {
            await supabaseApi.wishlist.toggle(productId);
            await loadData();
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Wishlist Section */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                        <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">{t('wishlist')}</h1>
                        <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] mt-1">
                            {items.length} {t('products') || 'mahsulot'}
                        </p>
                    </div>
                </div>

                {items.length === 0 ? (
                    <GlassCard className="py-20 text-center flex flex-col items-center border-[var(--glass-border)] bg-[var(--color-surface-raised)]">
                        <Heart className="w-16 h-16 text-[var(--text-dim)] mb-6 opacity-20" />
                        <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest mb-8">{t('wishlistEmpty')}</p>
                        <Button variant="primary" className="rounded-2xl h-12 px-10 uppercase tracking-widest font-black text-[11px]">
                            {t('startShopping') || 'Xaridni boshlash'}
                        </Button>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <GlassCard className="group overflow-hidden flex flex-col h-full border-[var(--glass-border)] hover:border-[var(--brand-primary)]/30 transition-all duration-500 bg-[var(--color-surface-raised)]">
                                    <div className="aspect-square relative overflow-hidden bg-slate-900">
                                        <img
                                            src={item.product_details.images?.[0]?.image}
                                            alt={item.product_details.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                            <button className="p-3 rounded-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-xl hover:scale-110 transition-transform">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleToggle(item.product)}
                                                className="p-3 rounded-xl bg-rose-500 text-white shadow-xl hover:scale-110 transition-transform"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <p className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-widest mb-2">
                                            {item.product_details.category_name}
                                        </p>
                                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2 line-clamp-1">{item.product_details.name}</h3>
                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            <span className="text-xl font-black text-[var(--text-main)] tracking-tight">
                                                {item.product_details.price.toLocaleString()} <span className="text-[10px] text-[var(--text-dim)]">{currency}</span>
                                            </span>
                                            <Button className="h-10 w-10 p-0 rounded-xl bg-[var(--brand-primary)]/5 border border-[var(--glass-border)] hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all text-[var(--text-dim)]">
                                                <ShoppingCart className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Recently Viewed Section */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                        <Eye className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">{t('recentlyViewed')}</h2>
                    </div>
                </div>

                {recentlyViewed.length === 0 ? (
                    <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-xs">{t('noRecentlyViewed')}</p>
                ) : (
                    <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                        {recentlyViewed.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex-shrink-0 w-64"
                            >
                                <GlassCard className="group border-[var(--glass-border)] hover:border-[var(--brand-primary)]/20 transition-all bg-[var(--color-surface-raised)]">
                                    <div className="h-40 relative rounded-xl overflow-hidden bg-[var(--brand-primary)]/5 mb-4">
                                        <img
                                            src={item.product_details.images?.[0]?.image}
                                            alt={item.product_details.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <h4 className="text-[var(--text-main)] font-bold truncate text-sm mb-1">{item.product_details.name}</h4>
                                    <p className="text-emerald-500 font-black text-sm">
                                        {item.product_details.price.toLocaleString()} <span className="text-[9px] text-[var(--text-dim)]">{currency}</span>
                                    </p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
