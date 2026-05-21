import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  FolderOpen, 
  Sparkles, 
  Image as ImageIcon,
  Check,
  Globe,
  ChevronRight,
  LayoutGrid,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface CategoriesProps {
    storeId?: number;
}

export function Categories({ storeId }: CategoriesProps) {
    const { t, language, ln } = useApp();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        name_uz: '',
        name_ru: '',
        slug: '',
        active: true,
    });

    useEffect(() => {
        if (storeId) {
            loadData();
        }
    }, [storeId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await supabaseApi.categories.list(storeId!);
            setCategories(Array.isArray(data) ? data : (data && Array.isArray((data as any).data) ? (data as any).data : []));
        } catch (error) {
            console.error('Failed to load categories from Supabase:', error);
        }
        setLoading(false);
    };

    const openModal = (category?: any) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                name_uz: category.name_uz || '',
                name_ru: category.name_ru || '',
                slug: category.slug,
                active: category.active,
            });
            setImagePreview(category.image || null);
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                name_uz: '',
                name_ru: '',
                slug: '',
                active: true,
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !storeId) return;

        setIsSubmitting(true);
        try {
            let imageUrl = imagePreview;

            if (imageFile) {
                const fileName = `${storeId}-${Date.now()}-${imageFile.name}`;
                imageUrl = await supabaseApi.storage.upload('categories', fileName, imageFile);
            }

            const data: any = {
                ...formData,
                store_id: storeId,
                image: imageUrl,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
            };

            if (editingCategory) {
                await supabaseApi.categories.update(editingCategory.id, data);
            } else {
                await supabaseApi.categories.create(data);
            }

            await loadData();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(language === 'uz' ? "Ushbu kategoriyani o'chirmoqchimisiz?" : "Удалить эту категорию?")) return;

        try {
            await supabaseApi.categories.delete(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete category from Supabase:', error);
        }
    };

    if (loading && categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">{t('loading') || 'Yuklanmoqda...'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-1 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em]">Product Hierarchy</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading">
                        {language === 'uz' ? 'Kategoriyalar' : language === 'ru' ? 'Категории' : 'Categories'}
                    </h1>
                    <p className="text-slate-400 mt-2 uppercase tracking-[0.2em] text-[10px] font-black">{categories.length} {t('itemsTotal') || 'jami'} mavjud</p>
                </div>
                <button 
                    onClick={() => openModal()} 
                    className="h-16 px-10 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-600/30 hover:scale-105 transition-all flex items-center gap-4"
                >
                    <Plus size={20} />
                    {language === 'uz' ? "Kategoriya" : language === 'ru' ? "Категория" : "Category"}
                </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {categories.map((category, index) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <GlassCard className="group p-0 border-slate-200/60 bg-white hover:bg-white hover:border-emerald-500/30 transition-all duration-700 shadow-xl relative rounded-[48px] overflow-hidden border">
                            {/* Decorative Background Icon */}
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <LayoutGrid size={160} className="text-emerald-500" />
                            </div>

                            <div className="p-10 space-y-10 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-slate-950 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-700 group-hover:border-emerald-500/20">
                                        {category.image ? (
                                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-900">
                                                <FolderOpen size={48} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                        <button onClick={() => openModal(category)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all shadow-sm">
                                            <Edit2 size={20} />
                                        </button>
                                        <button onClick={() => handleDelete(category.id)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-100 transition-all shadow-sm">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-black text-slate-800 text-2xl tracking-tighter uppercase font-heading group-hover:text-emerald-600 transition-colors mb-2">{ln(category, 'name')}</h3>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">PATH:</span>
                                       <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em] tabular-nums">/{category.slug}</p>
                                    </div>
                                </div>

                                <div className="pt-10 flex items-center justify-between border-t border-slate-100">
                                    <div className="flex flex-col">
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                                       <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all ${category.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                           {category.active ? t('active') : t('inactive')}
                                       </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mahsulotlar</p>
                                        <div className="flex items-center gap-3">
                                           <p className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">{category.product_count || 0}</p>
                                           <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                              <ArrowUpRight size={14} />
                                           </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}

                {categories.length === 0 && (
                    <div className="col-span-full empty-state-card py-40 flex flex-col items-center justify-center">
                        <FolderOpen className="w-24 h-24 mb-10 text-slate-200" />
                        <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-400">
                            {language === 'ru' ? 'Kategoriyalar bo\'sh' : language === 'uz' ? 'Kategoriyalar mavjud emas' : 'No categories found'}
                        </p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-[56px] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-heading">
                                        {editingCategory
                                            ? (language === 'ru' ? 'Tahrirlash' : language === 'uz' ? 'Tahrirlash' : 'Modify Category')
                                            : (language === 'ru' ? 'Yangi Kategoriya' : language === 'uz' ? 'Yangi Kategoriya' : 'Add Category')}
                                    </h2>
                                    <p className="text-emerald-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2.5 flex items-center gap-3">
                                       <Sparkles size={14} className="animate-pulse" />
                                       Structure Node Configuration
                                    </p>
                                </div>
                                <button onClick={() => setShowModal(false)} disabled={isSubmitting} className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center">
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="p-12 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    {/* Image Section */}
                                    <div className="lg:col-span-4 space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block ml-1">Icon / Thumbnail</label>
                                        <div
                                            className="aspect-square w-full rounded-[48px] bg-slate-800 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all overflow-hidden group relative shadow-inner"
                                            onClick={() => document.getElementById('category-image')?.click()}
                                        >
                                            {imagePreview ? (
                                                <>
                                                    <img src={imagePreview} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ImageIcon size={48} className="text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-6">
                                                    <ImageIcon size={64} className="text-slate-900 group-hover:text-emerald-400 transition-colors" />
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Yuklash</span>
                                                </div>
                                            )}
                                            <input
                                                id="category-image"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setImageFile(file);
                                                        setImagePreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-8 space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('name')}</label>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!formData.name) return;
                                                        setIsTranslating(true);
                                                        try {
                                                            const uzRes = await supabaseApi.ai.translateText({ text: formData.name, target_lang: 'uz' });
                                                            const ruRes = await supabaseApi.ai.translateText({ text: formData.name, target_lang: 'ru' });
                                                            setFormData(prev => ({ ...prev, name_uz: uzRes.data.translated_text || prev.name_uz, name_ru: ruRes.data.translated_text || prev.name_ru }));
                                                        } catch (error) {
                                                            console.error('Translation failed in Supabase', error);
                                                        } finally {
                                                            setIsTranslating(false);
                                                        }
                                                    }}
                                                    disabled={isTranslating || !formData.name}
                                                    className={`text-[9px] font-black uppercase tracking-widest px-6 py-2 rounded-xl border transition-all flex items-center gap-3 ${!formData.name
                                                        ? 'opacity-50 cursor-not-allowed border-slate-100 text-slate-300'
                                                        : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                                                        }`}
                                                >
                                                    {isTranslating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                    AI Auto-Fill
                                                </button>
                                            </div>
                                            <input 
                                                value={formData.name} 
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setFormData(prev => ({ ...prev, name: v, slug: v.toLowerCase().replace(/\s+/g, '-') }));
                                                }}
                                                placeholder="Masalan: Elektronika"
                                                className="w-full h-20 bg-slate-50 border border-slate-100 rounded-[28px] px-8 text-xl font-black text-slate-900 placeholder:text-slate-300 outline-none focus:border-emerald-500/50 transition-all uppercase tracking-tighter"
                                                required 
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">O'zbekcha Nomi</label>
                                                <input value={formData.name_uz} onChange={(e) => setFormData(prev => ({ ...prev, name_uz: e.target.value }))} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-900 font-bold outline-none focus:border-emerald-500/30 transition-all" />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ruscha Nomi</label>
                                                <input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-900 font-bold outline-none focus:border-emerald-500/30 transition-all" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Slug (URL)</label>
                                            <input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] outline-none focus:border-emerald-500/30 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-12 py-10 border-t border-slate-100 bg-slate-50/50 flex gap-4 justify-end">
                                <button 
                                    onClick={() => setShowModal(false)} 
                                    disabled={isSubmitting}
                                    className="h-16 px-10 border border-slate-200 text-slate-500 rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all"
                                >
                                    {t('cancel')}
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSubmitting} 
                                    className="h-16 px-16 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-emerald-600/30 hover:scale-105 transition-all flex items-center gap-4"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> {t('save')}</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
