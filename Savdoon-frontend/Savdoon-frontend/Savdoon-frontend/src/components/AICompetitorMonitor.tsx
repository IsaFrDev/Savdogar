import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Search, ArrowUpRight, ArrowDownRight, TrendingUp, Loader2, Zap, DollarSign } from 'lucide-react';
import { aiApi, productApi } from '../services/api';
import { useApp } from '../context/AppContext';

interface AICompetitorMonitorProps {
    storeId?: number;
}

export default function AICompetitorMonitor({ storeId }: AICompetitorMonitorProps) {
    const { language, t } = useApp();
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [competitors, setCompetitors] = useState([{ name: '', price: '' }]);

    useEffect(() => {
        if (storeId) {
            loadProducts();
        }
    }, [storeId]);

    const loadProducts = async () => {
        try {
            const response = await productApi.list({ store: storeId });
            setProducts(response.data);
        } catch (err) {
            console.error('Failed to load products:', err);
        }
    };

    const analyzeMarket = async () => {
        if (!selectedProduct) return;
        setLoading(true);
        try {
            const response = await aiApi.getCompetitorInsights({
                product_id: selectedProduct,
                competitors: competitors.filter(c => c.name && c.price).map(c => ({ name: c.name, price: Number(c.price) })),
                language
            });
            setResult(response.data);
        } catch (error) {
            console.error('Market analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const addCompetitor = () => setCompetitors([...competitors, { name: '', price: '' }]);
    const updateCompetitor = (idx: number, field: string, val: string) => {
        const next = [...competitors];
        next[idx] = { ...next[idx], [field]: val };
        setCompetitors(next);
    };

    return (
        <div className="space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/10 backdrop-blur-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -mr-32 -mt-32" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-amber-500/20 shadow-inner">
                        <Target className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('aiCompetitorMonitor')}</h2>
                        <p className="text-slate-400 text-sm font-medium">{t('aiMonitorSubtitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t('selectProduct')}</label>
                            <select
                                value={selectedProduct || ''}
                                onChange={(e) => setSelectedProduct(Number(e.target.value))}
                                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-white font-bold focus:border-amber-500/50 outline-none transition-all"
                            >
                                <option value="">{t('selectProduct')}</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('competitorsOptional')}</label>
                                <button onClick={addCompetitor} className="text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors uppercase">+ {t('addRecord')}</button>
                            </div>
                            {competitors.map((c, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        placeholder={t('competitorName')}
                                        value={c.name}
                                        onChange={(e) => updateCompetitor(idx, 'name', e.target.value)}
                                        className="flex-[2] h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-xs text-white"
                                    />
                                    <input
                                        placeholder={t('price')}
                                        type="number"
                                        value={c.price}
                                        onChange={(e) => updateCompetitor(idx, 'price', e.target.value)}
                                        className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-xs text-white"
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={analyzeMarket}
                            disabled={loading || !selectedProduct}
                            className="w-full h-14 rounded-2xl bg-amber-500 text-slate-950 font-black uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            {t('analyzeCompetitor')}
                        </button>
                    </div>

                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {result ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <div className={`p-6 rounded-3xl border ${result.status === 'overpriced' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('status')}</span>
                                            {result.status === 'overpriced' ? <ArrowUpRight className="text-rose-400" /> : <ArrowDownRight className="text-emerald-400" />}
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase mb-2">
                                            {result.status === 'overpriced' ? t('statusOverpriced') : result.status === 'underpriced' ? t('statusUnderpriced') : t('statusCompetitive')}
                                        </h3>
                                        <p className="text-slate-300 text-xs font-medium leading-relaxed">{result.reasoning}</p>
                                    </div>

                                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">{t('suggestedPrice')}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-indigo-500/20">
                                                <DollarSign className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <span className="text-3xl font-black text-white">{Number(result.suggested_price).toLocaleString()} UZS</span>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp className="w-4 h-4 text-amber-400" />
                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{t('strategySuggestion')}</span>
                                        </div>
                                        <p className="text-slate-200 text-xs font-bold italic">"{result.strategy}"</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl">
                                    <Search className="w-12 h-12 text-slate-700 mb-4 opacity-30" />
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('analysisResultPlaceholder')}</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
