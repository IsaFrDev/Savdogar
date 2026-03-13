import React, { useState, useEffect } from 'react';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { marketingApi } from '../services/api';

interface GroupBuy {
    id: number;
    product_data: any;
    target_participants: number;
    current_participants: number;
    discount_percentage: string;
    end_time: string;
}

export const GroupBuyCard: React.FC<{ productId: number }> = ({ productId }) => {
    const [deals, setDeals] = useState<GroupBuy[]>([]);
    const { t } = useApp();

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const res = await marketingApi.getGroupBuys();
                const productDeals = res.data.filter((d: any) => d.product === productId);
                setDeals(productDeals);
            } catch (err) {
                console.error('Failed to fetch group buys:', err);
            }
        };
        fetchDeals();
    }, [productId]);

    if (!deals.length) return null;

    const deal = deals[0];
    const progress = (deal.current_participants / deal.target_participants) * 100;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">{t('groupBuying')}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{t('saveMoreTogether')}</p>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase">
                    -{parseFloat(deal.discount_percentage).toFixed(0)}% OFF
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">{t('participants')}</span>
                    <span className="text-white">{deal.current_participants} / {deal.target_participants}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('endsIn')}: {new Date(deal.end_time).toLocaleDateString()}</span>
                </div>

                <button className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 group">
                    {t('joinGroupBuy')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
