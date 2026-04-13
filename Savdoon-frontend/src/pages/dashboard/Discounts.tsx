import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    Tag,
    Ticket,
    Calendar,
    X,
    Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { discountApi, promoCodeApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface DiscountsProps {
    storeId?: number;
}

export function Discounts({ storeId }: DiscountsProps) {
    const { t, ln, language } = useApp();
    const [activeTab, setActiveTab] = useState<'discounts' | 'promo-codes'>('discounts');
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Form State
    const [formData, setFormData] = useState<any>({
        name: '',
        discount_type: 'percentage',
        value: '',
        start_date: '',
        end_date: '',
        min_order_amount: '',
        is_active: true,
        code: '', // Promo code only
        usage_limit: '', // Promo code only
        max_discount_amount: '', // Percentage discounts only
    });

    useEffect(() => {
        if (storeId) {
            loadData();
        }
    }, [storeId, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'discounts') {
                const response = await discountApi.list(storeId);
                setDiscounts(Array.isArray(response.data) ? response.data : (response.data.results || []));
            } else {
                const response = await promoCodeApi.list(storeId);
                setPromoCodes(Array.isArray(response.data) ? response.data : (response.data.results || []));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                ...item,
                value: item.value?.toString() || '',
                min_order_amount: item.min_order_amount?.toString() || '',
                usage_limit: item.usage_limit?.toString() || '',
                max_discount_amount: item.max_discount_amount?.toString() || '',
                start_date: item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : '',
                end_date: item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : '',
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                discount_type: 'percentage',
                value: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                min_order_amount: '0',
                is_active: true,
                code: '',
                usage_limit: '',
                max_discount_amount: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!storeId) return;
        setIsSubmitting(true);
        try {
            if (activeTab === 'discounts') {
                const data = {
                    store: storeId,
                    name: formData.name,
                    discount_type: formData.discount_type,
                    value: parseFloat(formData.value) || 0,
                    min_order_amount: parseFloat(formData.min_order_amount) || 0,
                    start_date: formData.start_date || null,
                    end_date: formData.end_date || null,
                    active: formData.is_active,
                };
                if (editingItem) {
                    await discountApi.update(editingItem.id, data);
                } else {
                    await discountApi.create(data);
                }
            } else {
                // Promo code: backend expects valid_from/valid_to, not start_date/end_date
                const data = {
                    store: storeId,
                    code: formData.code,
                    description: formData.name,
                    discount_type: formData.discount_type,
                    value: parseFloat(formData.value) || 0,
                    min_order_amount: parseFloat(formData.min_order_amount) || 0,
                    max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
                    usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                    valid_from: formData.start_date || null,
                    valid_to: formData.end_date || null,
                    active: formData.is_active,
                };
                if (editingItem) {
                    await promoCodeApi.update(editingItem.id, data);
                } else {
                    await promoCodeApi.create(data);
                }
            }

            await loadData();
            setShowModal(false);
        } catch (error: any) {
            console.error('Failed to save:', error);
            const detail = error?.response?.data;
            const msg = typeof detail === 'object' ? Object.values(detail).flat().join(', ') : (detail || t('errorOccurred'));
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('confirmDelete') || 'Ishonchingiz komilmi?')) return;
        try {
            if (activeTab === 'discounts') {
                await discountApi.delete(id);
            } else {
                await promoCodeApi.delete(id);
            }
            await loadData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase">
                        {activeTab === 'discounts' ? t('discounts') : t('promoCodes')}
                    </h1>
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] mt-1">
                        {activeTab === 'discounts' ? discounts.length : promoCodes.length} {t('active') || 'faol'}
                    </p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    icon={<Plus className="w-4 h-4" />}
                    className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px]"
                >
                    {activeTab === 'discounts' ? t('addDiscount') : t('addPromoCode')}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-white/[0.03] rounded-2xl border border-[var(--color-border)] w-fit backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('discounts')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'discounts' ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-primary)]/5'
                        }`}
                >
                    <Tag className="w-4 h-4" />
                    {t('discounts')}
                </button>
                <button
                    onClick={() => setActiveTab('promo-codes')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'promo-codes' ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-primary)]/5'
                        }`}
                >
                    <Ticket className="w-4 h-4" />
                    {t('promoCodes')}
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">{t('loading')}</p>
                    </div>
                ) : (
                    (activeTab === 'discounts' ? discounts : promoCodes).map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="p-6 h-full flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="p-3.5 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all duration-500 shadow-sm">
                                            {activeTab === 'discounts' ? <Tag className="w-6 h-6" /> : <Ticket className="w-6 h-6" />}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-[var(--color-border)] shadow-sm">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-3 leading-tight">{ln(item, 'name') || item.code}</h3>
                                    {activeTab === 'promo-codes' && (
                                        <div className="px-4 py-2 bg-[var(--brand-primary)]/[0.03] rounded-xl border border-[var(--brand-primary)]/10 inline-block mb-6">
                                            <code className="text-[var(--brand-primary)] font-black tracking-widest text-sm">{item.code}</code>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">{t('discountValue')}</span>
                                            <span className="text-xl font-black text-emerald-500 tabular-nums">
                                                {item.discount_type === 'percentage' ? `${item.value}%` : `${item.value.toLocaleString()} sum`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">{t('status')}</span>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                {item.is_active ? (language === 'uz' ? 'FAOL' : t('active')) : (language === 'uz' ? 'O\'CHIK' : t('inactive'))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{item.end_date ? new Date(item.end_date).toLocaleDateString() : t('unlimited')}</span>
                                    </div>
                                    {activeTab === 'promo-codes' && (
                                        <div className="text-right">
                                            {item.usage_count} / {item.usage_limit || '∞'} {language === 'uz' ? 'ishlatildi' : 'uses'}
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-white rounded-[2.5rem] border border-[var(--color-border)] z-[60] shadow-2xl overflow-hidden flex flex-col"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        >
                            <div className="p-10 border-b border-[var(--color-border)] flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">
                                        {editingItem ? (activeTab === 'discounts' ? t('editDiscount') : t('editPromoCode')) : (activeTab === 'discounts' ? t('addDiscount') : t('addPromoCode'))}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-200/50 rounded-2xl transition-all border border-[var(--color-border)] shadow-sm">
                                    <X className="w-6 h-6 text-[var(--text-muted)]" />
                                </button>
                            </div>

                            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1 col-span-full">
                                        <Input
                                            label={t('discountName')}
                                            value={formData.name}
                                            onChange={(v) => setFormData({ ...formData, name: v })}
                                            placeholder="Masalan: Yozgi chegirma 2024"
                                        />
                                    </div>

                                    {activeTab === 'promo-codes' && (
                                        <div className="space-y-1 col-span-full">
                                            <Input
                                                label={t('promoCode')}
                                                value={formData.code}
                                                onChange={(v) => setFormData({ ...formData, code: v.toUpperCase() })}
                                                placeholder="SUMMER50"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{t('discountType')}</label>
                                        <select
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                            className="w-full bg-white border border-[var(--color-border)] rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] shadow-sm"
                                        >
                                            <option value="percentage">{t('percentage')}</option>
                                            <option value="fixed">{t('fixedAmount')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <Input
                                            label={t('discountValue')}
                                            type="number"
                                            value={formData.value}
                                            onChange={(v) => setFormData({ ...formData, value: v })}
                                            placeholder={formData.discount_type === 'percentage' ? '20' : '10000'}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Input
                                            label={t('startDate')}
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(v) => setFormData({ ...formData, start_date: v })}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Input
                                            label={t('endDate')}
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(v) => setFormData({ ...formData, end_date: v })}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Input
                                            label={t('minOrderAmount')}
                                            type="number"
                                            value={formData.min_order_amount}
                                            onChange={(v) => setFormData({ ...formData, min_order_amount: v })}
                                            placeholder="0"
                                        />
                                    </div>

                                    {activeTab === 'promo-codes' && (
                                        <div className="space-y-1">
                                            <Input
                                                label={t('usageLimit')}
                                                type="number"
                                                value={formData.usage_limit}
                                                onChange={(v) => setFormData({ ...formData, usage_limit: v })}
                                                placeholder={t('unlimited')}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-[var(--color-border)]">
                                    <input
                                        type="checkbox"
                                        id="modal_is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-6 h-6 rounded-lg border-[var(--color-border)] text-[var(--brand-primary)] focus:ring-0 cursor-pointer"
                                    />
                                    <label htmlFor="modal_is_active" className="flex-1 cursor-pointer">
                                        <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">{t('active')}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold">
                                            {language === 'ru' ? 'Видно клиентам' : language === 'uz' ? 'Mijozlarga ko\'rinadi' : 'Visible to customers'}
                                        </p>
                                    </label>
                                </div>
                            </div>

                            <div className="p-8 border-t border-[var(--color-border)] bg-slate-50/50 flex justify-end gap-4">
                                <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-2xl px-8 h-14 uppercase tracking-widest text-[11px] font-black border border-[var(--color-border)] text-[var(--text-muted)]">
                                    {t('cancel')}
                                </Button>
                                <Button onClick={handleSave} disabled={isSubmitting} className="rounded-2xl px-12 h-14 uppercase tracking-widest text-[11px] font-black shadow-xl shadow-[var(--brand-primary-glow)]">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('save')}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
