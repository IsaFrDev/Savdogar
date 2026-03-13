import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Sparkles, Check, Loader2, AlertCircle, Film, Zap, ShoppingBag, Plus, Trash2, Clock, Eye, MessageSquare, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storeApi, analyticsApi, productApi, marketingApi, reviewApi, aiApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { TelegramCardCreator } from '../../components/TelegramCardCreator';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';

const TABS = ['newsletter', 'reels', 'reviews', 'socialCard', 'flashSales', 'groupBuy'] as const;
type MarketingTab = typeof TABS[number];

export function Marketing() {
    const { t, language } = useApp();
    const [activeTab, setActiveTab] = useState<MarketingTab>('newsletter');

    // Newsletter state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [error, setError] = useState('');
    const [customerCount, setCustomerCount] = useState<number | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [platform, setPlatform] = useState('instagram');
    const [isGenerating, setIsGenerating] = useState(false);

    // Reels state
    const [reels, setReels] = useState<any[]>([]);
    const [reelsLoading, setReelsLoading] = useState(false);
    const [isReelModalOpen, setIsReelModalOpen] = useState(false);
    const [newReelCaption, setNewReelCaption] = useState('');
    const [newReelVideo, setNewReelVideo] = useState<File | null>(null);
    const [newReelProductId, setNewReelProductId] = useState('');
    const [isCreatingReel, setIsCreatingReel] = useState(false);

    // Flash Sales state
    const [flashSales, setFlashSales] = useState<any[]>([]);
    const [flashLoading, setFlashLoading] = useState(false);
    const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
    const [newFlashProduct, setNewFlashProduct] = useState('');
    const [newFlashPrice, setNewFlashPrice] = useState('');
    const [newFlashEndTime, setNewFlashEndTime] = useState('');
    const [isCreatingFlash, setIsCreatingFlash] = useState(false);

    // Group Buy state
    const [groupBuys, setGroupBuys] = useState<any[]>([]);
    const [groupLoading, setGroupLoading] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupProduct, setNewGroupProduct] = useState('');
    const [newGroupDiscount, setNewGroupDiscount] = useState('20');
    const [newGroupTarget, setNewGroupTarget] = useState('5');
    const [newGroupEndTime, setNewGroupEndTime] = useState('');
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyDraft, setReplyDraft] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const activeStoreId = localStorage.getItem('active_store_id');

    useEffect(() => {
        const fetchData = async () => {
            if (!activeStoreId) return;
            try {
                const [custRes, prodRes] = await Promise.all([
                    analyticsApi.getCustomers(parseInt(activeStoreId)),
                    productApi.list({ store: parseInt(activeStoreId), active: true })
                ]);

                const count = Array.isArray(custRes.data) ? custRes.data.length : (custRes.data.count || 0);
                setCustomerCount(count);
                setProducts(prodRes.data.results || prodRes.data || []);
            } catch (err) {
                console.error('Failed to fetch marketing data:', err);
            }
        };
        fetchData();
    }, [activeStoreId]);

    // Load tab-specific data
    useEffect(() => {
        if (activeTab === 'reels') loadReels();
        if (activeTab === 'flashSales') loadFlashSales();
        if (activeTab === 'groupBuy') loadGroupBuys();
        if (activeTab === 'reviews') loadReviews();
    }, [activeTab]);

    const loadReviews = async () => {
        if (!activeStoreId) return;
        setReviewsLoading(true);
        try {
            const res = await reviewApi.list({ store: parseInt(activeStoreId) });
            setReviews(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error('Failed to load reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleDraftReply = async (review: any) => {
        setIsDrafting(true);
        try {
            const res = await aiApi.draftReviewReply({
                review_text: review.comment,
                rating: review.rating,
                customer_name: review.user_name,
                language: language
            });
            setReplyDraft(res.data.draft);
            setReplyingTo(review.id);
        } catch (err) {
            console.error('Failed to draft reply:', err);
        } finally {
            setIsDrafting(false);
        }
    };

    const handleSendReply = async (reviewId: number) => {
        setIsSubmittingReply(true);
        try {
            await reviewApi.update(reviewId, {
                reply_text: replyDraft,
                replied_at: new Date().toISOString()
            });
            setReplyingTo(null);
            setReplyDraft('');
            loadReviews();
        } catch (err) {
            console.error('Failed to send reply:', err);
            alert('Failed to send reply');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const loadReels = async () => {
        setReelsLoading(true);
        try {
            const storeId = activeStoreId ? parseInt(activeStoreId) : undefined;
            const res = await marketingApi.getReels(storeId);
            setReels(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error('Failed to load reels:', err);
        } finally {
            setReelsLoading(false);
        }
    };

    const loadFlashSales = async () => {
        setFlashLoading(true);
        try {
            const res = await marketingApi.getFlashSales();
            setFlashSales(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error('Failed to load flash sales:', err);
        } finally {
            setFlashLoading(false);
        }
    };

    const loadGroupBuys = async () => {
        setGroupLoading(true);
        try {
            const res = await marketingApi.getGroupBuys();
            setGroupBuys(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error('Failed to load group buys:', err);
        } finally {
            setGroupLoading(false);
        }
    };
    const handleCreateReel = async () => {
        if (!activeStoreId || !newReelVideo) return;
        setIsCreatingReel(true);
        try {
            const formData = new FormData();
            formData.append('store', activeStoreId);
            formData.append('caption', newReelCaption);
            formData.append('video', newReelVideo);
            if (newReelProductId) formData.append('product', newReelProductId);

            await marketingApi.createReel(formData);
            setIsReelModalOpen(false);
            setNewReelCaption('');
            setNewReelVideo(null);
            setNewReelProductId('');
            loadReels();
        } catch (err) {
            console.error('Failed to create reel:', err);
            alert('Failed to upload Reel');
        } finally {
            setIsCreatingReel(false);
        }
    };

    const handleDeleteReel = async (id: number) => {
        if (!window.confirm(language === 'uz' ? 'O\'chirilsinmi?' : 'Delete this reel?')) return;
        try {
            await marketingApi.deleteReel(id);
            loadReels();
        } catch (err) {
            console.error('Failed to delete reel:', err);
        }
    };

    const handleCreateFlashSale = async () => {
        if (!activeStoreId || !newFlashProduct || !newFlashPrice || !newFlashEndTime) return;
        setIsCreatingFlash(true);
        try {
            await marketingApi.createFlashSale({
                store: parseInt(activeStoreId),
                product: parseInt(newFlashProduct),
                sale_price: newFlashPrice,
                end_time: new Date(newFlashEndTime).toISOString(),
                is_active: true
            });
            setIsFlashModalOpen(false);
            loadFlashSales();
        } catch (err) {
            console.error('Failed to create flash sale:', err);
        } finally {
            setIsCreatingFlash(false);
        }
    };

    const handleDeleteFlashSale = async (id: number) => {
        if (!window.confirm(language === 'uz' ? 'O\'chirilsinmi?' : 'Delete this sale?')) return;
        try {
            await marketingApi.deleteFlashSale(id);
            loadFlashSales();
        } catch (err) {
            console.error('Failed to delete flash sale:', err);
        }
    };

    const handleCreateGroupBuy = async () => {
        if (!activeStoreId || !newGroupProduct || !newGroupDiscount || !newGroupTarget || !newGroupEndTime) return;
        setIsCreatingGroup(true);
        try {
            await marketingApi.createGroupBuy({
                store: parseInt(activeStoreId),
                product: parseInt(newGroupProduct),
                discount_percentage: newGroupDiscount,
                target_participants: parseInt(newGroupTarget),
                end_time: new Date(newGroupEndTime).toISOString(),
                is_active: true
            });
            setIsGroupModalOpen(false);
            loadGroupBuys();
        } catch (err) {
            console.error('Failed to create group buy:', err);
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleDeleteGroupBuy = async (id: number) => {
        if (!window.confirm(language === 'uz' ? 'O\'chirilsinmi?' : 'Delete this deal?')) return;
        try {
            await marketingApi.deleteGroupBuy(id);
            loadGroupBuys();
        } catch (err) {
            console.error('Failed to delete group buy:', err);
        }
    };

    const handleGenerateAI = async () => {
        const selectedProd = products.find(p => p.id.toString() === selectedProductId);
        if (!selectedProd) {
            alert(language === 'uz' ? "Iltimos, mahsulotni tanlang" : "Please select a product");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await productApi.generateMarketingPost(
                selectedProd.name,
                selectedProd.description,
                platform,
                language
            );
            setMessage(res.data.content);
            setTitle(selectedProd.name + (language === 'uz' ? " - Yangi maxsulot!" : " - New Arrival!"));
        } catch (err) {
            console.error('Failed to generate content:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendNewsletter = async () => {
        if (!activeStoreId || !title || !message) return;

        setIsSending(true);
        setError('');
        setSendSuccess(false);

        try {
            await storeApi.sendNewsletter(parseInt(activeStoreId), {
                title,
                message,
                title_uz: title,
                message_uz: message
            });
            setSendSuccess(true);
            setTitle('');
            setMessage('');
            setSelectedProductId('');
        } catch (err: any) {
            console.error('Failed to send newsletter:', err);
            setError(err.response?.data?.error || 'Failed to send newsletter');
        } finally {
            setIsSending(false);
        }
    };

    const tabLabels: Record<MarketingTab, string> = {
        newsletter: language === 'uz' ? 'Newsletter' : language === 'ru' ? 'Рассылка' : 'Newsletter',
        reels: language === 'uz' ? 'Reels' : language === 'ru' ? 'Рилсы' : 'Reels',
        flashSales: language === 'uz' ? 'Flash Sale' : language === 'ru' ? 'Флэш распродажа' : 'Flash Sales',
        groupBuy: language === 'uz' ? 'Guruh xarid' : language === 'ru' ? 'Групповая покупка' : 'Group Buy',
        reviews: language === 'uz' ? 'Sharhlar' : language === 'ru' ? 'Отзывы' : 'Reviews',
        socialCard: language === 'uz' ? 'Telegram Card' : 'Telegram Card',
    };

    const tabIcons: Record<MarketingTab, React.ReactNode> = {
        newsletter: <Send className="w-4 h-4" />,
        reels: <Film className="w-4 h-4" />,
        flashSales: <Zap className="w-4 h-4" />,
        groupBuy: <ShoppingBag className="w-4 h-4" />,
        reviews: <MessageSquare className="w-4 h-4" />,
        socialCard: <Zap className="w-4 h-4" />,
    };

    const getTimeLeft = (endTime: string) => {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return language === 'uz' ? 'Tugagan' : 'Ended';
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('marketingTitle')}</h2>
                    <p className="text-[var(--text-muted)] mt-1 font-medium">{t('marketingSubtitle')}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                            ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary-glow)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-primary)]/5'
                            }`}
                    >
                        {tabIcons[tab]}
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* NEWSLETTER TAB */}
                    {activeTab === 'newsletter' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <GlassCard className="p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand-primary)] to-violet-500 opacity-50" />
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center border border-[var(--brand-primary)]/20 shadow-sm">
                                            <Send className="w-7 h-7 text-[var(--brand-primary)]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('sendBroadcast')}</h3>
                                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">{t('broadcastHelper')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="space-y-1">
                                            <Input label={t('subject')} value={title} onChange={setTitle} placeholder={t('subjectPlaceholder')} />
                                        </div>
                                        <div className="space-y-1">
                                            <TextArea label={t('messageContent')} value={message} onChange={setMessage} placeholder={t('messagePlaceholder')} rows={8} />
                                        </div>

                                        <AnimatePresence>
                                            {error && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm font-bold">
                                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                    {error}
                                                </motion.div>
                                            )}
                                            {sendSuccess && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm font-bold">
                                                    <Check className="w-5 h-5 flex-shrink-0" />
                                                    {t('newsletterSuccess')}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <Button
                                            onClick={handleSendNewsletter}
                                            disabled={isSending || !title || !message}
                                            className="w-full h-16 rounded-[1.5rem] bg-gradient-to-r from-[var(--brand-primary)] to-indigo-600 text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-[var(--brand-primary-glow)] hover:scale-[1.01] active:scale-[0.98] transition-all"
                                        >
                                            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /> {t('sendNow')}</>}
                                        </Button>
                                    </div>
                                </GlassCard>
                            </div>
                            <div className="space-y-8">
                                <GlassCard className="p-6">
                                    <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-[var(--brand-primary)]" /> {t('audience')}</h4>
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-2xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
                                            <p className="text-[10px] text-[var(--brand-primary)] font-black uppercase tracking-widest mb-1 opacity-70">{t('totalCustomers')}</p>
                                            <p className="text-3xl font-black text-[var(--text-primary)] tabular-nums">{customerCount !== null ? customerCount : '...'}</p>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-bold">{t('audienceDesc')}</p>
                                    </div>
                                </GlassCard>
                                <GlassCard className="p-6 border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5">
                                    <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-6 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[var(--brand-primary)]" /> {language === 'uz' ? 'AI Marketing Markazi' : 'AI Marketing Hub'}</h4>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{language === 'uz' ? 'Mahsulotni tanlang' : 'Select Product'}</label>
                                            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full p-4 rounded-xl bg-white border border-[var(--color-border)] text-[var(--text-primary)] text-xs font-bold outline-none focus:border-[var(--brand-primary)] shadow-sm">
                                                <option value="">{language === 'uz' ? 'Tanlang...' : 'Select...'}</option>
                                                {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{language === 'uz' ? 'Platforma' : 'Platform'}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['instagram', 'telegram'].map(p => (
                                                    <button key={p} onClick={() => setPlatform(p)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${platform === p ? 'bg-[var(--brand-primary)] text-white border-transparent shadow-md' : 'bg-white text-[var(--text-muted)] border-[var(--color-border)] hover:border-[var(--brand-primary)]/30'}`}>{p}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <Button onClick={handleGenerateAI} disabled={isGenerating || !selectedProductId} variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest border-2 border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 h-14 rounded-2xl">
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> {t('generateWithAI')}</>}
                                        </Button>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    )}

                    {/* REELS TAB */}
                    {activeTab === 'reels' && (
                        <div className="space-y-6">
                            <GlassCard className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                                            <Film className="w-6 h-6 text-pink-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                                                {language === 'uz' ? 'Shoppable Reels' : language === 'ru' ? 'Шоппинг Рилсы' : 'Shoppable Reels'}
                                            </h3>
                                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">
                                                {language === 'uz' ? 'Video orqali sotish' : 'Sell through video'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setIsReelModalOpen(true)}
                                        className="h-12 px-6 rounded-2xl bg-pink-500 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-pink-500/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {language === 'uz' ? 'Yangi Reel' : 'New Reel'}
                                    </Button>
                                </div>

                                {reelsLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                                    </div>
                                ) : reels.length === 0 ? (
                                    <div className="text-center py-20 bg-pink-500/5 rounded-3xl border border-pink-500/10">
                                        <Film className="w-16 h-16 text-pink-500/20 mx-auto mb-4" />
                                        <p className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">
                                            {language === 'uz' ? 'Reels hali yo\'q' : 'No reels yet'}
                                        </p>
                                        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
                                            {language === 'uz' ? 'Video kontent orqali sotuvlarni boshlang' : 'Start selling with video content'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {reels.map((reel: any) => (
                                            <motion.div
                                                key={reel.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="rounded-3xl border border-[var(--color-border)] bg-white overflow-hidden group hover:border-pink-500/30 transition-all shadow-sm hover:shadow-xl"
                                            >
                                                <div className="aspect-[9/16] bg-slate-100 relative overflow-hidden">
                                                    {reel.video ? (
                                                        <video src={reel.video} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Film className="w-12 h-12 text-slate-700" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-4">
                                                        <div className="flex gap-2 w-full justify-between">
                                                            <button className="p-2 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteReel(reel.id)}
                                                                className="p-2 rounded-lg bg-rose-500/80 backdrop-blur-md text-white hover:bg-rose-600 transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <p className="text-sm font-black text-[var(--text-primary)] line-clamp-2 leading-tight">{reel.caption || 'Untitled'}</p>
                                                    {reel.product_data && (
                                                        <p className="text-[10px] text-pink-400 font-black uppercase tracking-widest mt-2">
                                                            🛍️ {reel.product_data.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    )}

                    {/* FLASH SALES TAB */}
                    {activeTab === 'flashSales' && (
                        <div className="space-y-6">
                            <GlassCard className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                                                {language === 'uz' ? 'Flash Sotuvlar' : language === 'ru' ? 'Флэш Распродажи' : 'Flash Sales'}
                                            </h3>
                                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">
                                                {language === 'uz' ? 'Cheklangan vaqtdagi takliflar' : 'Limited-time offers'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setIsFlashModalOpen(true)}
                                        className="h-12 px-6 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-amber-500/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {language === 'uz' ? 'Yangi Flash' : 'New Flash'}
                                    </Button>
                                </div>

                                {flashLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                    </div>
                                ) : flashSales.length === 0 ? (
                                    <div className="text-center py-20 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                                        <Zap className="w-16 h-16 text-amber-500/20 mx-auto mb-4" />
                                        <p className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">
                                            {language === 'uz' ? 'Flash sotuvlar yo\'q' : 'No flash sales'}
                                        </p>
                                        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
                                            {language === 'uz' ? 'Shoshilinch chegirmalar bilan savdoni oshiring' : 'Boost sales with urgent discounts'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {flashSales.map((sale: any) => {
                                            const timeLeft = getTimeLeft(sale.end_time);
                                            const isActive = new Date(sale.end_time).getTime() > Date.now();
                                            return (
                                                <motion.div
                                                    key={sale.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`p-6 rounded-3xl border transition-all shadow-sm ${isActive ? 'bg-gradient-to-r from-amber-500/[0.03] to-orange-500/[0.03] border-amber-500/20' : 'bg-slate-50 border-[var(--color-border)] opacity-60'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-3 rounded-xl ${isActive ? 'bg-amber-500/20 animate-pulse' : 'bg-slate-800'}`}>
                                                                <Zap className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-[var(--text-primary)]">
                                                                    {sale.product_data?.name || `Product #${sale.product}`}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-xs font-bold text-slate-500 line-through">
                                                                        {sale.original_price ? parseFloat(sale.original_price).toLocaleString() : '—'} UZS
                                                                    </span>
                                                                    <span className="text-sm font-black text-amber-400">
                                                                        {parseFloat(sale.sale_price).toLocaleString()} UZS
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-600'}`}>
                                                                {isActive ? (language === 'uz' ? 'Faol' : 'Active') : (language === 'uz' ? 'Tugagan' : 'Ended')}
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span className="font-bold tabular-nums">{timeLeft}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteFlashSale(sale.id)}
                                                                className="mt-2 p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all ml-auto"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    )}

                    {/* GROUP BUY TAB */}
                    {activeTab === 'groupBuy' && (
                        <div className="space-y-6">
                            <GlassCard className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                            <ShoppingBag className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                                                {language === 'uz' ? 'Guruh Xaridlar' : language === 'ru' ? 'Групповые Покупки' : 'Group Buying'}
                                            </h3>
                                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">
                                                {language === 'uz' ? 'Birgalikda arzonroq' : 'Save more together'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setIsGroupModalOpen(true)}
                                        className="h-12 px-6 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {language === 'uz' ? 'Yangi Deal' : 'New Deal'}
                                    </Button>
                                </div>

                                {groupLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    </div>
                                ) : groupBuys.length === 0 ? (
                                    <div className="text-center py-20 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                                        <ShoppingBag className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
                                        <p className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">
                                            {language === 'uz' ? 'Guruh xaridlar yo\'q' : 'No group buys'}
                                        </p>
                                        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
                                            {language === 'uz' ? 'Virusli marketingni guruh xaridlar bilan boshlang' : 'Start viral marketing with group buys'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {groupBuys.map((deal: any) => {
                                            const progress = deal.target_participants > 0 ? (deal.current_participants / deal.target_participants) * 100 : 0;
                                            const isActive = new Date(deal.end_time).getTime() > Date.now();
                                            return (
                                                <motion.div
                                                    key={deal.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`p-6 rounded-3xl border transition-all shadow-sm ${isActive ? 'bg-gradient-to-br from-emerald-500/[0.03] to-transparent border-emerald-500/20 shadow-emerald-500/5' : 'bg-slate-50 border-[var(--color-border)] opacity-60'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                                                                <Users className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-[var(--text-primary)]">
                                                                    {deal.product_data?.name || `Product #${deal.product}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase">
                                                            -{parseFloat(deal.discount_percentage).toFixed(0)}% OFF
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                            <span className="text-[var(--text-muted)]">{language === 'uz' ? 'Ishtirokchilar' : 'Participants'}</span>
                                                            <span className="text-[var(--text-primary)]">{deal.current_participants} / {deal.target_participants}</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{language === 'uz' ? 'Tugash' : 'Ends'}: {getTimeLeft(deal.end_time)}</span>
                                                            <button
                                                                onClick={() => handleDeleteGroupBuy(deal.id)}
                                                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all ml-auto"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <GlassCard className="p-8">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <MessageSquare className="w-7 h-7 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                                            {language === 'uz' ? 'Mijozlar Fikrlari' : 'Customer Reviews'}
                                        </h3>
                                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] mt-0.5">
                                            {language === 'uz' ? 'Sifatni oshirish va muloqot' : 'Engage with your customers'}
                                        </p>
                                    </div>
                                </div>

                                {reviewsLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-20 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                                        <MessageSquare className="w-16 h-16 text-indigo-500/20 mx-auto mb-4" />
                                        <p className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">
                                            {language === 'uz' ? 'Hali sharhlar yo\'q' : 'No reviews yet'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {reviews.map((review: any) => (
                                            <motion.div
                                                key={review.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-6 rounded-3xl border border-[var(--color-border)] bg-white shadow-sm"
                                            >
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-black text-[var(--text-primary)]">{review.user_name}</span>
                                                                <div className="flex items-center gap-0.5 ml-3">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{new Date(review.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed italic opacity-80 bg-slate-50 p-4 rounded-2xl border border-slate-100">"{review.comment}"</p>

                                                        {review.reply_text ? (
                                                            <div className="mt-4 p-4 rounded-xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Check className="w-3 h-3 text-[var(--brand-primary)]" />
                                                                    <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-widest">{t('yourReply')}</span>
                                                                </div>
                                                                <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">{review.reply_text}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4">
                                                                {replyingTo === review.id ? (
                                                                    <div className="space-y-4">
                                                                        <TextArea
                                                                            value={replyDraft}
                                                                            onChange={setReplyDraft}
                                                                            placeholder={language === 'uz' ? 'Javobingizni yozing...' : 'Write your reply...'}
                                                                            rows={3}
                                                                        />
                                                                        <div className="flex justify-end gap-2">
                                                                            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>{t('cancel')}</Button>
                                                                            <Button size="sm" disabled={isSubmittingReply || !replyDraft} onClick={() => handleSendReply(review.id)}>
                                                                                {isSubmittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : t('send')}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setReplyingTo(review.id);
                                                                                setReplyDraft('');
                                                                            }}
                                                                            className="text-[10px] font-black uppercase tracking-widest h-9"
                                                                        >
                                                                            {t('reply')}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            disabled={isDrafting}
                                                                            onClick={() => handleDraftReply(review)}
                                                                            className="text-[10px] font-black uppercase tracking-widest h-9 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20"
                                                                        >
                                                                            {isDrafting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                                                            AI Draft
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'socialCard' && (
                        <TelegramCardCreator />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODALS SECTION */}
            <AnimatePresence>
                {
                    isReelModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReelModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white border border-[var(--color-border)] rounded-3xl shadow-2xl p-8 space-y-6">
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3"><Film className="w-5 h-5 text-pink-400" /> {language === 'uz' ? 'Yangi Reel Yaratish' : 'Create New Reel'}</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{language === 'uz' ? 'Video Fayl' : 'Video File'}</label>
                                        <input type="file" accept="video/*" onChange={(e) => setNewReelVideo(e.target.files?.[0] || null)} className="w-full p-4 rounded-xl bg-slate-50 border border-[var(--color-border)] text-[var(--text-primary)] text-xs file:bg-pink-500 file:border-none file:rounded-lg file:text-white file:text-[10px] file:font-black file:uppercase file:px-4 file:py-2 file:mr-4 cursor-pointer" />
                                    </div>
                                    <Input label={language === 'uz' ? 'Tavsif (Caption)' : 'Caption'} value={newReelCaption} onChange={setNewReelCaption} placeholder={language === 'uz' ? 'Video haqida...' : 'About the video...'} />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{language === 'uz' ? 'Mahsulot (Ixtiyoriy)' : 'Product (Optional)'}</label>
                                        <select value={newReelProductId} onChange={(e) => setNewReelProductId(e.target.value)} className="w-full p-4 rounded-xl bg-white border border-[var(--color-border)] text-[var(--text-primary)] text-xs font-bold outline-none focus:border-pink-500 shadow-sm">
                                            <option value="">{language === 'uz' ? 'Tanlang...' : 'Select...'}</option>
                                            {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setIsReelModalOpen(false)} className="flex-1 h-12 rounded-2xl text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] border border-[var(--color-border)]">{language === 'uz' ? 'Bekor qilish' : 'Cancel'}</Button>
                                    <Button onClick={handleCreateReel} disabled={isCreatingReel || !newReelVideo} className="flex-1 h-12 rounded-2xl bg-pink-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-pink-500/20">{isCreatingReel ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (language === 'uz' ? 'Yuklash' : 'Upload')}</Button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    isFlashModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFlashModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white border border-[var(--color-border)] rounded-3xl shadow-2xl p-8 space-y-6">
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3"><Zap className="w-5 h-5 text-amber-400" /> {language === 'uz' ? 'Flash Sale Yaratish' : 'Create Flash Sale'}</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{language === 'uz' ? 'Mahsulot' : 'Product'}</label>
                                        <select value={newFlashProduct} onChange={(e) => setNewFlashProduct(e.target.value)} className="w-full p-4 rounded-xl bg-white border border-[var(--color-border)] text-[var(--text-primary)] text-xs font-bold outline-none focus:border-amber-500 shadow-sm">
                                            <option value="">{language === 'uz' ? 'Tanlang...' : 'Select...'}</option>
                                            {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                        </select>
                                    </div>
                                    <Input label={language === 'uz' ? 'Chegirma Narxi (UZS)' : 'Sale Price (UZS)'} type="number" value={newFlashPrice} onChange={setNewFlashPrice} placeholder="150000" />
                                    <Input label={language === 'uz' ? 'Tugash vaqti' : 'End Time'} type="datetime-local" value={newFlashEndTime} onChange={setNewFlashEndTime} />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setIsFlashModalOpen(false)} className="flex-1 h-12 rounded-2xl text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] border border-[var(--color-border)]">{language === 'uz' ? 'Bekor qilish' : 'Cancel'}</Button>
                                    <Button onClick={handleCreateFlashSale} disabled={isCreatingFlash || !newFlashProduct || !newFlashPrice} className="flex-1 h-12 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20">{isCreatingFlash ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (language === 'uz' ? 'Yaratish' : 'Create')}</Button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    isGroupModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGroupModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white border border-[var(--color-border)] rounded-3xl shadow-2xl p-8 space-y-6">
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3"><ShoppingBag className="w-5 h-5 text-emerald-400" /> {language === 'uz' ? 'Guruh Xarid Yaratish' : 'Create Group Buy'}</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{language === 'uz' ? 'Mahsulot' : 'Product'}</label>
                                        <select value={newGroupProduct} onChange={(e) => setNewGroupProduct(e.target.value)} className="w-full p-4 rounded-xl bg-white border border-[var(--color-border)] text-[var(--text-primary)] text-xs font-bold outline-none focus:border-emerald-500 shadow-sm">
                                            <option value="">{language === 'uz' ? 'Tanlang...' : 'Select...'}</option>
                                            {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                        </select>
                                    </div>
                                    <Input label={language === 'uz' ? 'Chegirma %' : 'Discount %'} type="number" value={newGroupDiscount} onChange={setNewGroupDiscount} placeholder="20" />
                                    <Input label={language === 'uz' ? 'Maqsad (Ishtirokchilar)' : 'Target (Participants)'} type="number" value={newGroupTarget} onChange={setNewGroupTarget} placeholder="5" />
                                    <Input label={language === 'uz' ? 'Tugash vaqti' : 'End Time'} type="datetime-local" value={newGroupEndTime} onChange={setNewGroupEndTime} />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)} className="flex-1 h-12 rounded-2xl text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] border border-[var(--color-border)]">{language === 'uz' ? 'Bekor qilish' : 'Cancel'}</Button>
                                    <Button onClick={handleCreateGroupBuy} disabled={isCreatingGroup || !newGroupProduct} className="flex-1 h-12 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20">{isCreatingGroup ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (language === 'uz' ? 'Yaratish' : 'Create')}</Button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
