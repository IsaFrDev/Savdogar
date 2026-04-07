import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Loader2, FolderOpen, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { categoryApi, aiApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

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
            const response = await categoryApi.list(storeId);
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to load categories:', error);
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
            let data: any;
            if (imageFile) {
                data = new FormData();
                data.append('store', storeId.toString());
                data.append('name', formData.name);
                data.append('name_uz', formData.name_uz || formData.name);
                data.append('name_ru', formData.name_ru || formData.name);
                data.append('slug', formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'));
                data.append('active', String(formData.active));
                data.append('image', imageFile);
            } else {
                data = {
                    ...formData,
                    store: storeId,
                    slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                };
            }

            if (editingCategory) {
                await categoryApi.update(editingCategory.id, data);
            } else {
                await categoryApi.create(data);
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
            await categoryApi.delete(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    if (loading && categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
                <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">{t('loading') || 'Yuklanmoqda...'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                        {language === 'uz' ? 'Kategoriyalar' : language === 'ru' ? 'Категории' : 'Categories'}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">{categories.length} {t('itemsTotal') || 'jami'}</p>
                </div>
                <Button onClick={() => openModal()} icon={<Plus className="w-4 h-4" />} className="shadow-lg shadow-[var(--brand-primary-glow)] rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] px-8 bg-[var(--brand-primary)] text-[var(--primary-foreground)]">
                    {language === 'uz' ? "Kategoriya qo'shish" : language === 'ru' ? "Добавить категорию" : "Add Category"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <GlassCard className="p-6 border-[var(--color-border)] hover:border-[var(--brand-primary)] transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary-glow)] blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[var(--brand-primary-glow)] transition-colors opacity-40" />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                {category.image ? (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                                        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl bg-[var(--brand-primary-glow)] text-[var(--brand-primary)] group-hover:scale-110 transition-transform">
                                        <FolderOpen className="w-6 h-6" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(category)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(category.id)} className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-500 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-[var(--text-primary)] text-lg tracking-tight mb-1 relative z-10">{ln(category, 'name')}</h3>
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest relative z-10">/{category.slug}</p>

                            <div className="mt-6 flex items-center justify-between relative z-10">
                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${category.active ? 'bg-[var(--brand-primary-glow)] text-[var(--brand-primary)] border-[var(--brand-primary)]/20' : 'bg-white/5 text-slate-500 border-white/5'}`}>
                                    {category.active ? t('active') : t('inactive')}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                                    {category.product_count || 0} {t('products')}
                                </span>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}

                <div className="col-span-full py-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--text-muted)] shadow-sm">
                    <FolderOpen className="w-16 h-16 mb-6 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                        {language === 'ru' ? 'Категорий пока нет' : language === 'uz' ? 'Hali kategoriyalar yo\'q' : 'No categories yet'}
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50" onClick={() => !isSubmitting && setShowModal(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-white rounded-[2.5rem] border border-[var(--color-border)] z-[60] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between">
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                    {editingCategory
                                        ? (language === 'ru' ? 'Редактировать категорию' : language === 'uz' ? 'Kategoriyani tahrirlash' : 'Edit Category')
                                        : (language === 'ru' ? 'Добавить новую' : language === 'uz' ? 'Yangini qo\'shish' : 'Add New')}
                                </h2>
                                <button onClick={() => setShowModal(false)} disabled={isSubmitting} className="p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="flex gap-6">
                                    <div className="flex-1 space-y-2 relative">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">{t('name')}</label>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!formData.name) return;
                                                    setIsTranslating(true);
                                                    try {
                                                        const uzRes = await aiApi.translateText({ text: formData.name, target_lang: 'uz' });
                                                        const ruRes = await aiApi.translateText({ text: formData.name, target_lang: 'ru' });
                                                        setFormData(prev => ({ ...prev, name_uz: uzRes.data.translated_text || prev.name_uz, name_ru: ruRes.data.translated_text || prev.name_ru }));
                                                    } catch (error) {
                                                        console.error('Translation failed', error);
                                                    } finally {
                                                        setIsTranslating(false);
                                                    }
                                                }}
                                                disabled={isTranslating || !formData.name}
                                                className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border shadow-sm transition-all flex items-center gap-2 ${!formData.name
                                                    ? 'opacity-30 cursor-not-allowed border-[var(--color-border)] text-[var(--text-muted)]'
                                                    : 'border-[var(--brand-primary-glow)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-glow)]'
                                                    }`}
                                            >
                                                {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                AI Localize
                                            </button>
                                        </div>
                                        <Input value={formData.name} onChange={(v) => setFormData(prev => ({ ...prev, name: v, slug: v.toLowerCase().replace(/\s+/g, '-') }))} placeholder="Masalan: Mevalar" required />
                                    </div>

                                    {/* Image Upload */}
                                    <div className="w-32 flex-shrink-0">
                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block text-center">Rasm</label>
                                        <div
                                            className="h-24 w-32 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--brand-primary)]/50 transition-colors overflow-hidden group"
                                            onClick={() => document.getElementById('category-image')?.click()}
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
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
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">O'zbekcha nomi</label>
                                        <Input value={formData.name_uz} onChange={(v) => setFormData(prev => ({ ...prev, name_uz: v }))} placeholder="Meva va sabzavotlar" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Русское название</label>
                                        <Input value={formData.name_ru} onChange={(v) => setFormData(prev => ({ ...prev, name_ru: v }))} placeholder="Фрукты и овощи" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Slug (URL)</label>
                                    <Input value={formData.slug} onChange={(v) => setFormData(prev => ({ ...prev, slug: v }))} placeholder="fruit" />
                                </div>
                            </div>

                            <div className="p-8 border-t border-[var(--color-border)] flex gap-4 justify-end">
                                <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>{t('cancel')}</Button>
                                <Button onClick={handleSave} disabled={isSubmitting} className="min-w-[140px]">
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
