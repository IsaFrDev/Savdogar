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
    Loader2,
    ChevronRight,
    ArrowRight,
    Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface DiscountsProps {
    storeId?: number;
}

export function Discounts({ storeId }: DiscountsProps) {
    const { t, ln, language, formatPrice } = useApp();
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
                const data = await supabaseApi.discounts.list(storeId!);
                setDiscounts(data);
            } else {
                const data = await supabaseApi.promoCodes.list(storeId!);
                setPromoCodes(data);
            }
        } catch (error) {
            console.error('Failed to load data from Supabase:', error);
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
                    name: formData.name,
                    discount_type: formData.discount_type,
                    value: parseFloat(formData.value) || 0,
                    min_order_amount: parseFloat(formData.min_order_amount) || 0,
                    start_date: formData.start_date || null,
                    end_date: formData.end_date || null,
                    is_active: formData.is_active,
                };
                if (editingItem) {
                    await supabaseApi.discounts.update(editingItem.id, data);
                } else {
                    await supabaseApi.discounts.create(storeId, data);
                }
            } else {
                const data = {
                    code: formData.code,
                    name: formData.name,
                    discount_type: formData.discount_type,
                    value: parseFloat(formData.value) || 0,
                    min_order_amount: parseFloat(formData.min_order_amount) || 0,
                    max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
                    usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                    start_date: formData.start_date || null,
                    end_date: formData.end_date || null,
                    is_active: formData.is_active,
                };
                if (editingItem) {
                    await supabaseApi.promoCodes.update(editingItem.id, data);
                } else {
                    await supabaseApi.promoCodes.create(storeId, data);
                }
            }

            await loadData();
            setShowModal(false);
        } catch (error: any) {
            console.error('Failed to save:', error);
            const detail = error?.response?.data;
            const msg = typeof detail === 'object' ? Object.values(detail).flat().join(', ') : (detail || 'Xatolik yuz berdi');
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('confirmDelete') || 'Ishonchingiz komilmi?')) return;
        try {
            if (activeTab === 'discounts') {
                await supabaseApi.discounts.delete(id);
            } else {
                await supabaseApi.promoCodes.delete(id);
            }
            await loadData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    if (loading) {
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6 opacity-50" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">{t('loading')}</p>
          </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-1 bg-indigo-500 rounded-full" />
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Incentives</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading">
                        {activeTab === 'discounts' ? t('discounts') : t('promoCodes')}
                    </h1>
                    <p className="text-slate-400 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">
                        {activeTab === 'discounts' ? discounts.length : promoCodes.length} campaigns currently active
                    </p>
                </div>
                <button 
                  onClick={() => handleOpenModal()} 
                  className="h-16 px-10 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                >
                  <Plus size={18} />
                  {activeTab === 'discounts' ? t('addDiscount') : t('addPromoCode')}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 p-2 bg-slate-50 rounded-[24px] w-fit border border-slate-100">
                <button
                    onClick={() => setActiveTab('discounts')}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'discounts' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <Tag size={16} className={activeTab === 'discounts' ? 'text-indigo-600' : 'text-slate-400'} />
                    {t('discounts')}
                </button>
                <button
                    onClick={() => setActiveTab('promo-codes')}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'promo-codes' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <Ticket size={16} className={activeTab === 'promo-codes' ? 'text-indigo-600' : 'text-slate-400'} />
                    {t('promoCodes')}
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {(activeTab === 'discounts' ? discounts : promoCodes).map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                    >
                        <GlassCard className={`p-10 border-slate-200 bg-white transition-all duration-700 h-full flex flex-col relative overflow-hidden rounded-[48px] border shadow-xl group-hover:border-indigo-500/30 ${!item.is_active && 'opacity-40 grayscale'}`}>
                            <div className="absolute top-[-30px] right-[-20px] text-[160px] font-black text-slate-50 select-none pointer-events-none italic font-heading">
                                {index + 1}
                            </div>

                            <div className="flex items-start justify-between mb-10 relative z-10">
                                <div className="w-16 h-16 bg-indigo-600/10 text-indigo-400 rounded-[24px] border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700 shadow-2xl">
                                    {activeTab === 'discounts' ? <Tag size={28} /> : <Ticket size={28} />}
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                      onClick={() => handleOpenModal(item)} 
                                      className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-lg transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(item.id)} 
                                      className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col">
                                <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{ln(item, 'name') || item.code}</h3>
                                {activeTab === 'promo-codes' && (
                                    <div className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-[20px] w-fit mb-8 shadow-sm">
                                        <code className="text-indigo-600 font-black tracking-[0.3em] text-sm uppercase">{item.code}</code>
                                    </div>
                                )}

                                <div className="space-y-6 mb-10">
                                    <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 text-center group-hover:bg-indigo-50 transition-colors duration-700">
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3">Reward Value</div>
                                        <div className="text-5xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-600 transition-colors duration-700 tabular-nums">
                                            {item.discount_type === 'percentage' ? `${item.value}%` : formatPrice(item.value)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Campaign Status</span>
                                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${item.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-rose-50 text-rose-500 border-rose-100'
                                            }`}>
                                            {item.is_active ? (language === 'uz' ? 'FAOL' : 'ACTIVE') : (language === 'uz' ? 'O\'CHIK' : 'INACTIVE')}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-slate-300" />
                                        <span>{item.end_date ? new Date(item.end_date).toLocaleDateString() : 'UNTIL REVOKED'}</span>
                                    </div>
                                    {activeTab === 'promo-codes' && (
                                        <div className="text-right">
                                            {item.usage_count} / {item.usage_limit || '∞'} USES
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-2xl bg-white border border-slate-200 rounded-[56px] shadow-2xl overflow-hidden"
                        >
                            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-heading">
                                        {editingItem ? (activeTab === 'discounts' ? t('editDiscount') : t('editPromoCode')) : (activeTab === 'discounts' ? t('addDiscount') : t('addPromoCode'))}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black mt-2">Configure campaign rewards and rules</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-12 space-y-10 max-h-[65vh] overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4 col-span-full">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Campaign Name</label>
                                        <input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Summer Sale 2024"
                                            className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    {activeTab === 'promo-codes' && (
                                        <div className="space-y-4 col-span-full">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Promotion Code</label>
                                            <input
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                placeholder="SUMMER50"
                                                className="w-full bg-slate-950/50 border border-indigo-500/30 rounded-[24px] px-8 py-5 text-indigo-400 font-black outline-none focus:border-indigo-500 transition-all tracking-[0.4em] uppercase"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Reward Logic</label>
                                        <div className="relative">
                                            <select
                                                value={formData.discount_type}
                                                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="percentage">{t('percentage')}</option>
                                                <option value="fixed">{t('fixedAmount')}</option>
                                            </select>
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <ChevronRight size={20} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Reward Value</label>
                                        <input
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            placeholder={formData.discount_type === 'percentage' ? '20' : '10000'}
                                            className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all tabular-nums"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Launch Date</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Expiration Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Min. Order Amount</label>
                                        <input
                                            type="number"
                                            value={formData.min_order_amount}
                                            onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all tabular-nums"
                                        />
                                    </div>

                                    {activeTab === 'promo-codes' && (
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Total Usage Limit</label>
                                            <input
                                                type="number"
                                                value={formData.usage_limit}
                                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                                placeholder="Unlimited"
                                                className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:border-indigo-500/50 transition-all tabular-nums"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-slate-100">
                                    <label className="flex items-center gap-6 cursor-pointer group w-fit">
                                        <div className="relative inline-flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.is_active} 
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} 
                                                className="sr-only peer" 
                                            />
                                            <div className={`w-14 h-7 rounded-full transition-all duration-500 relative cursor-pointer ${formData.is_active ? 'bg-emerald-600 shadow-xl shadow-emerald-100' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-lg ${formData.is_active ? 'left-[32px]' : 'left-[4px]'}`} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                                                Campaign Visibility
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                {formData.is_active ? 'Live and visible to customers' : 'Paused or hidden from storefront'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="px-12 py-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-6">
                                <button 
                                    onClick={() => setShowModal(false)} 
                                    className="h-16 px-10 border border-slate-200 text-slate-500 rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-slate-900 transition-all"
                                >
                                    {t('cancel')}
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSubmitting} 
                                    className="h-16 px-12 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50 disabled:grayscale"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : editingItem ? t('save') : t('create')}
                                    {!isSubmitting && <ArrowRight size={18} />}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
