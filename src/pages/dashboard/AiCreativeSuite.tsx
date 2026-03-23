import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Re-scan trigger
import { Wand2, Instagram, Send, Copy, RefreshCw, Loader2, Check, Sparkles } from 'lucide-react';
import { marketingApi, productApi } from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import { useApp } from '../../context/AppContext';

interface AiCreativeSuiteProps {
    storeId?: number;
}

export default function AiCreativeSuite({ storeId }: AiCreativeSuiteProps) {
    const { t, language } = useApp();
    const [products, setProducts] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [selectedProductData, setSelectedProductData] = useState<any | null>(null);
    const [platform, setPlatform] = useState('instagram');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (storeId) {
            loadProducts();
        }
    }, [storeId]);

    const loadProducts = async () => {
        setProductsLoading(true);
        try {
            const response = await productApi.list({ store: storeId });
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setProductsLoading(false);
        }
    };

    const generateContent = async () => {
        if (!selectedProduct) return;
        setLoading(true);
        try {
            const response = await marketingApi.generateSMMContent({
                product_id: selectedProduct,
                platform,
                language
            });
            setResult(response.data);
        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className={`p-8 rounded-[2rem] glass-card relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                        <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">{t('aiCreative')}</h2>
                        <p className="text-[var(--text-dim)] text-sm font-medium">{language === 'uz' ? 'Viras marketing kontentini soniyalarda yarating' : 'Generate viral marketing content in seconds'}</p>
                    </div>
                    {productsLoading && <Loader2 className="w-5 h-5 text-violet-500 animate-spin ml-auto" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Product</label>
                        <select
                            value={selectedProduct || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                setSelectedProduct(id);
                                const prod = products.find(p => p.id === id);
                                setSelectedProductData(prod);
                            }}
                            className="w-full h-14 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--glass-border)] px-6 text-[var(--text-main)] font-bold focus:border-violet-500/50 outline-none transition-all"
                        >
                            <option value="">Choose a product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPlatform('instagram')}
                                className={`flex-1 h-14 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold ${platform === 'instagram' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-transparent text-white shadow-lg shadow-violet-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                            >
                                <Instagram className="w-5 h-5" /> Instagram
                            </button>
                            <button
                                onClick={() => setPlatform('telegram')}
                                className={`flex-1 h-14 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold ${platform === 'telegram' ? 'bg-blue-600 border-transparent text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                            >
                                <Send className="w-5 h-5" /> Telegram
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={generateContent}
                    disabled={loading || !selectedProduct}
                    className="w-full h-14 mt-8 rounded-2xl bg-[var(--primary)] text-white font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    Generate Viral Content
                </button>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        <div className="p-8 rounded-[2rem] glass-card space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Preview Content</span>
                                <button
                                    onClick={() => copyToClipboard(`${result.headline}\n\n${result.content}`)}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
                                >
                                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-[var(--text-main)]">{result.headline}</h3>

                                {platform === 'telegram' && selectedProductData && (
                                    <div className="mb-4 overflow-hidden rounded-2xl bg-[#242f3d] border border-white/5 shadow-xl">
                                        <div className="relative aspect-video">
                                            <img
                                                src={getMediaUrl(selectedProductData.images?.[0]?.image) || undefined}
                                                className="w-full h-full object-cover"
                                                alt="Telegram Preview"
                                            />
                                            <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                {selectedProductData.price.toLocaleString()} UZS
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                    <Send className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{t('telegramPost')}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{result.content}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--glass-border)]">
                                    <p className="text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">{result.content}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {result.hashtags?.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-white/10 backdrop-blur-xl space-y-6">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Strategy</span>
                            </div>

                            <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                                <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2">Best time to post</p>
                                <p className="text-xl font-bold text-white">{result.best_time_to_post}</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-slate-400 text-sm leading-relaxed italic">
                                    "This content was optimized for {platform} engagement. The tone is set to professional but high-energy to drive immediate conversions."
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
