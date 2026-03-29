import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { marketingApi } from '../services/api';
import { ShoppingBag, ChevronUp, ChevronDown, Volume2, VolumeX, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Reel {
    id: number;
    video: string;
    caption: string;
    product_data?: any;
}

export const ReelsFeed: React.FC<{ storeId?: number; onClose: () => void; onProductClick?: (product: any) => void }> = ({ storeId, onClose, onProductClick }) => {
    const [reels, setReels] = useState<Reel[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [muted, setMuted] = useState(true);
    const { language } = useApp();

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const res = await marketingApi.getReels(storeId);
                setReels(res.data);
            } catch (err) {
                console.error('Failed to fetch reels:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReels();
    }, [storeId]);

    const handleNext = () => {
        if (currentIndex < reels.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    if (loading) return null;
    if (!reels.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0 md:p-8"
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-[110] backdrop-blur-md transition-all"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-[450px] aspect-[9/16] bg-slate-900 rounded-none md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={reels[currentIndex].id}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-0"
                    >
                        <video
                            src={reels[currentIndex].video}
                            autoPlay
                            loop
                            muted={muted}
                            className="w-full h-full object-cover"
                            playsInline
                        />

                        {/* Reel Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-6">
                            <p className="text-white font-bold leading-tight">{reels[currentIndex].caption}</p>
                            {reels[currentIndex].product_data && (
                                <div
                                    onClick={() => onProductClick?.(reels[currentIndex].product_data)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 group cursor-pointer hover:bg-white/20 transition-all active:scale-[0.98]"
                                >
                                    <img
                                        src={reels[currentIndex].product_data.images?.[0]?.image}
                                        className="w-14 h-14 rounded-xl object-cover shadow-lg"
                                        alt=""
                                    />
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-white uppercase tracking-widest">
                                            {language === 'uz' ? reels[currentIndex].product_data.name_uz : reels[currentIndex].product_data.name}
                                        </p>
                                        <p className="text-sm font-black text-[var(--primary)]">{reels[currentIndex].product_data.price.toLocaleString()} UZS</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interaction Buttons */}
                        <div className="absolute right-4 bottom-32 flex flex-col gap-6">
                            <button
                                onClick={() => setMuted(!muted)}
                                className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                            >
                                {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-4 flex gap-4">
                            <button
                                disabled={currentIndex === 0}
                                onClick={handlePrev}
                                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white disabled:opacity-20"
                            >
                                <ChevronUp className="w-6 h-6" />
                            </button>
                            <button
                                disabled={currentIndex === reels.length - 1}
                                onClick={handleNext}
                                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white disabled:opacity-20"
                            >
                                <ChevronDown className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
