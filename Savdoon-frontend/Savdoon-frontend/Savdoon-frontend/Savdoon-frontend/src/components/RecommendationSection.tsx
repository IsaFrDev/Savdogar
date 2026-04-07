import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Sparkles } from 'lucide-react';
import { productApi } from '../services/api';
import { useApp } from '../context/AppContext';
import { GlassCard } from './GlassCard';

interface RecommendationSectionProps {
    type: 'similar' | 'popular' | 'new';
    productId?: number;
    storeId?: number;
    title: string;
    onProductClick: (product: any) => void;
}

export function RecommendationSection({ type, productId, storeId, title, onProductClick }: RecommendationSectionProps) {
    const { language, currency } = useApp();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommendations();
    }, [productId, storeId, type]);

    const loadRecommendations = async () => {
        setLoading(true);
        try {
            const response = await productApi.getRecommendations({
                product: productId,
                store: storeId,
                type: type
            });
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        }
        setLoading(false);
    };

    if (!loading && products.length === 0) return null;

    return (
        <div className="py-8 border-t border-white/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
                </div>
            </div>

            {loading ? (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="min-w-[200px] h-64 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="min-w-[180px] sm:min-w-[220px] snap-start"
                        >
                            <GlassCard
                                className="group cursor-pointer border-white/5 hover:border-indigo-500/30 transition-all duration-500"
                                onClick={() => onProductClick(product)}
                            >
                                <div className="aspect-square relative overflow-hidden bg-slate-900 rounded-t-2xl">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0].image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-800">
                                            <Package className="w-8 h-8 opacity-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h4 className="text-xs font-black text-white uppercase tracking-tight truncate mb-2">
                                        {language === 'uz' ? product.name_uz : language === 'ru' ? product.name_ru : product.name}
                                    </h4>
                                    <p className="text-sm font-black text-indigo-400">
                                        {product.price.toLocaleString()} <span className="text-[10px] text-slate-500">{currency}</span>
                                    </p>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
