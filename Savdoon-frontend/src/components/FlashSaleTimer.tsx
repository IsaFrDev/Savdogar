import React, { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { marketingApi } from '../services/api';

export const FlashSaleTimer: React.FC<{ productId: number }> = ({ productId }) => {
    const [sale, setSale] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<{ h: number, m: number, s: number }>({ h: 0, m: 0, s: 0 });
    const { t } = useApp();

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const res = await marketingApi.getFlashSales();
                const activeSale = res.data.find((s: any) => s.product === productId);
                setSale(activeSale);
            } catch (err) {
                console.error('Failed to fetch flash sales:', err);
            }
        };
        fetchSales();
    }, [productId]);

    useEffect(() => {
        if (!sale) return;
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(sale.end_time).getTime();
            const diff = end - now;
            if (diff <= 0) {
                setSale(null);
                clearInterval(timer);
            } else {
                setTimeLeft({
                    h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    m: Math.floor((diff / 1000 / 60) % 60),
                    s: Math.floor((diff / 1000) % 60)
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [sale]);

    if (!sale) return null;

    return (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20 mb-6 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20 animate-pulse">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('flashSale')}</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tabular-nums">{timeLeft.h.toString().padStart(2, '0')}:{timeLeft.m.toString().padStart(2, '0')}:{timeLeft.s.toString().padStart(2, '0')}</span>
                            <Clock className="w-4 h-4 opacity-50" />
                        </div>
                    </div>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest">{t('salePrice')}</p>
                    <p className="text-lg font-black">{parseFloat(sale.sale_price).toLocaleString()} UZS</p>
                </div>
            </div>
        </div>
    );
};
