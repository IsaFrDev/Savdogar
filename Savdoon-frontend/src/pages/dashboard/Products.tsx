import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2, Sparkles, X, Image as ImageIcon, Loader2, Gauge, Megaphone, Upload, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { productApi, categoryApi, aiApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { MarketingModal } from '../../components/MarketingModal';
import { AIReviewSummary } from '../../components/AIReviewSummary';

interface ProductsProps {
  storeId?: number;
}

export function Products({ storeId }: ProductsProps) {
  const { t, language, currency, ln } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedMarketingProduct, setSelectedMarketingProduct] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_uz: '',
    name_ru: '',
    slug: '',
    category_id: '',
    price: '',
    stock: '',
    sku: '',
    description: '',
    description_uz: '',
    description_ru: '',
    seo_tags: '',
    seo_tags_uz: '',
    seo_tags_ru: '',
    active: true,
    has_variants: false,
    variants: [] as any[],
    attributes: [] as { name: string; values: string[] }[],
  });

  useEffect(() => {
    if (storeId) {
      loadData();
    }
  }, [storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.list({ store: storeId, active: false }), // List all for admin
        categoryApi.list(storeId),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load products/categories:', error);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category?.toString() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        name_uz: product.name_uz || '',
        name_ru: product.name_ru || '',
        slug: product.slug,
        category_id: product.category?.toString() || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        sku: product.sku,
        description: product.description,
        description_uz: product.description_uz || '',
        description_ru: product.description_ru || '',
        seo_tags: product.seo_tags || '',
        seo_tags_uz: product.seo_tags_uz || '',
        seo_tags_ru: product.seo_tags_ru || '',
        active: product.active,
        has_variants: (product.variants?.length || 0) > 0,
        variants: product.variants || [],
        attributes: product.attributes || [], // We'll need to fetch these or include them in ProductSerializer
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        name_uz: '',
        name_ru: '',
        slug: '',
        category_id: categories[0]?.id?.toString() || '',
        price: '',
        stock: '',
        sku: '',
        description: '',
        description_uz: '',
        description_ru: '',
        seo_tags: '',
        seo_tags_uz: '',
        seo_tags_ru: '',
        active: true,
        has_variants: false,
        variants: [],
        attributes: [{ name: language === 'uz' ? 'O\'lcham' : (language === 'ru' ? 'Размер' : 'Size'), values: ['S', 'M', 'L'] }, { name: language === 'uz' ? 'Rang' : (language === 'ru' ? 'Цвет' : 'Color'), values: [] }],
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !storeId) return;

    setIsSubmitting(true);
    try {
      let productData: any;

      if (imageFile) {
        productData = new FormData();
        productData.append('store', storeId.toString());
        productData.append('name', formData.name);
        productData.append('name_uz', formData.name_uz || '');
        productData.append('name_ru', formData.name_ru || '');
        // Only send slug if it's not empty, otherwise backend will generate it
        if (formData.slug) productData.append('slug', formData.slug);
        
        // Handle optional category: don't send empty string, send null if empty
        if (formData.category_id) {
            productData.append('category', formData.category_id);
        }
        
        productData.append('price', formData.price || '0');
        productData.append('stock', formData.stock || '0');
        productData.append('sku', formData.sku || '');
        productData.append('description', formData.description || '');
        productData.append('description_uz', formData.description_uz || '');
        productData.append('description_ru', formData.description_ru || '');
        productData.append('seo_tags', formData.seo_tags || '');
        productData.append('seo_tags_uz', formData.seo_tags_uz || '');
        productData.append('seo_tags_ru', formData.seo_tags_ru || '');
        productData.append('active', String(formData.active));
        productData.append('image', imageFile);
        if (formData.has_variants) {
          productData.append('variants', JSON.stringify(formData.variants));
        }
      } else {
        productData = {
          store: storeId,
          name: formData.name,
          name_uz: formData.name_uz,
          name_ru: formData.name_ru,
          slug: formData.slug || undefined, // undefined to let backend handle it
          category: formData.category_id ? parseInt(formData.category_id) : null,
          price: parseFloat(formData.price) || 0,
          stock: parseInt(formData.stock) || 0,
          sku: formData.sku,
          description: formData.description,
          description_uz: formData.description_uz,
          description_ru: formData.description_ru,
          seo_tags: formData.seo_tags,
          seo_tags_uz: formData.seo_tags_uz,
          seo_tags_ru: formData.seo_tags_ru,
          active: formData.active,
          variants: formData.has_variants ? formData.variants : [],
        };
      }

      if (editingProduct) {
        await productApi.update(editingProduct.id, productData);
      } else {
        await productApi.create(productData);
      }

      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { name: '', values: [] }]
    }));
  };

  const removeAttribute = (idx: number) => {
    const newAttrs = formData.attributes.filter((_, i) => i !== idx);
    const newVariants = generateVariants(newAttrs);
    setFormData(prev => ({ ...prev, attributes: newAttrs, variants: newVariants }));
  };

  const handleAttributeChange = (index: number, field: 'name' | 'values', value: any) => {
    const newAttrs = [...formData.attributes];
    newAttrs[index] = { ...newAttrs[index], [field]: value };

    const newVariants = generateVariants(newAttrs);
    setFormData(prev => ({
      ...prev,
      attributes: newAttrs,
      variants: newVariants
    }));
  };

  const generateVariants = (attrs: { name: string; values: string[] }[]) => {
    const activeAttrs = attrs.filter(a => a.name && a.values.length > 0);
    if (activeAttrs.length === 0) return [];

    let combinations: any[] = [{}];

    activeAttrs.forEach(attr => {
      const newCombinations: any[] = [];
      combinations.forEach(combo => {
        attr.values.forEach(val => {
          newCombinations.push({
            ...combo,
            [attr.name]: val
          });
        });
      });
      combinations = newCombinations;
    });

    return combinations.map((combo, idx) => {
      // Try to find existing variant to preserve its data
      const existing = formData.variants.find(v =>
        Object.entries(combo).every(([k, val]) => v.attributes[k] === val)
      );

      return existing || {
        attributes: combo,
        price: formData.price || '0',
        stock: formData.stock || '0',
        sku: formData.sku ? `${formData.sku}-${idx + 1}` : `SKU-${idx + 1}`,
        active: true
      };
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('deleteProductConfirm'))) return;

    try {
      await productApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const getStockStatus = (stock: number, velocity: number = 0) => {
    if (stock === 0) return { label: t('outOfStock'), color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };

    // Prediction logic: days remaining = stock / velocity
    const daysRemaining = velocity > 0 ? Math.floor(stock / velocity) : null;

    if (daysRemaining !== null && daysRemaining <= 3) {
      return {
        label: t('restockSoon'),
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse-glow',
        days: daysRemaining
      };
    }

    if (stock < 10 || (daysRemaining !== null && daysRemaining <= 7)) {
      return {
        label: t('lowStock'),
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        days: daysRemaining
      };
    }

    return {
      label: t('inStock'),
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      days: daysRemaining
    };
  };


  const calculateVelocity = (_product: any) => {
    // Mock velocity: random between 0.5 and 5 units per day for demo
    // In production, this would be computed from historical order items
    return parseFloat((Math.random() * 3 + 0.1).toFixed(1));
  };


  const handleGenerateAIDescription = async () => {
    if (!formData.name) return;

    setIsGeneratingAI(true);
    try {
      const categoryName = categories.find(c => c.id === parseInt(formData.category_id))?.name;
      const response = await productApi.generateDescription(formData.name, categoryName, language);
      setFormData(prev => ({ ...prev, description: response.data.description }));
    } catch (error) {
      console.error('Failed to generate AI description:', error);
    }
    setIsGeneratingAI(false);
  };

  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

  const handleGenerateSEOTags = async () => {
    if (!formData.name) return;

    setIsGeneratingSEO(true);
    try {
      const response = await aiApi.generateSeoTags({
        name: formData.name,
        description: formData.description,
        language: language
      });
      setFormData(prev => ({ ...prev, seo_tags: response.data.seo_tags }));
    } catch (error) {
      console.error('Failed to generate SEO tags:', error);
    }
    setIsGeneratingSEO(false);
  };

  const handleAutoTranslate = async () => {
    if (!formData.name) return;

    setIsTranslating(true);
    try {
      const sourceLang = language === 'uz' || language === 'ru' || language === 'en' ? language : 'en';
      const response = await aiApi.translateProduct({
        name: formData.name,
        description: formData.description,
        source_lang: sourceLang
      });

      const { name_uz, name_ru, name_en, description_uz, description_ru, description_en } = response.data;

      setFormData(prev => ({
        ...prev,
        name: name_en || prev.name,
        name_uz: name_uz || prev.name_uz,
        name_ru: name_ru || prev.name_ru,
        description: description_uz || prev.description, // Default back to UZ for main description if possible
        description_uz: description_uz,
        description_ru: description_ru,
        description_en: description_en
      }));
    } catch (error) {
      console.error('Failed to translate product:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await productApi.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting products:', error);
      alert(t('errorExporting') || 'Error exporting products');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const response = await productApi.importExcel(file, storeId);
      const { created, updated, errors } = response.data;

      let message = `${t('importedSuccessfully') || 'Import completed'}:\n`;
      message += `${t('created') || 'Created'}: ${created}\n`;
      message += `${t('updated') || 'Updated'}: ${updated}`;

      if (errors && errors.length > 0) {
        message += `\n\n${t('errors') || 'Errors'}:\n${errors.join('\n')}`;
      }

      alert(message);
      loadData();
    } catch (error: any) {
      console.error('Error importing products:', error);
      alert(error.response?.data?.error || t('errorImporting') || 'Error importing products');
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-[var(--brand-primary)] animate-spin mb-6" />
        <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase font-heading">{t('products')}</h1>
          <div className="flex items-center gap-4">
            <div className="h-0.5 w-12 bg-[var(--brand-primary)] rounded-full opacity-50" />
            <p className="text-[var(--text-secondary)] uppercase tracking-[0.2em] text-[10px] font-bold">{products.length} {t('productsInStore')}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              icon={<Download className="w-5 h-5" />}
              className="h-14 px-6 border-[var(--color-border)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
            >
              {t('export')}
            </Button>
            <div className="relative">
              <input
                type="file"
                id="bulk-import"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                disabled={importing}
              />
              <Button
                onClick={() => document.getElementById('bulk-import')?.click()}
                variant="outline"
                icon={importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                className="h-14 px-6 border-[var(--color-border)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
                disabled={importing}
              >
                {importing ? t('importing') : t('import')}
              </Button>
            </div>
          </div>
          <Button onClick={() => openModal()} icon={<Plus className="w-5 h-5" />} className="h-14 px-10 shadow-2xl shadow-[var(--brand-primary-glow)] bg-[var(--brand-primary)] text-[var(--primary-foreground)]">
            {t('addProduct')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`${t('search')}...`}
              className="w-full pl-16 pr-6 py-5 rounded-2xl border-none bg-transparent focus:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-bold text-sm"
            />
          </div>
          <div className="w-px h-10 bg-[var(--color-border)] self-center hidden sm:block opacity-50" />
          <div className="flex items-center gap-4 px-6">
            <Filter className="w-5 h-5 text-[var(--text-muted)]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-5 bg-transparent border-none focus:ring-0 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.25em] cursor-pointer hover:text-[var(--text-primary)] transition-all"
            >
              <option value="all">{t('allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map((product, index) => {
          const velocity = calculateVelocity(product);
          const stockStatus = getStockStatus(product.stock, velocity);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
            >
              <GlassCard className="overflow-hidden group border-[var(--color-border)] hover:border-[var(--brand-primary)] transition-all duration-700 shadow-sm hover:shadow-2xl hover:shadow-[var(--brand-primary-glow)] relative bg-[var(--color-surface)]">
                <div className="aspect-[4/5] relative overflow-hidden bg-[var(--color-surface-raised)]">
                  {product.image || product.images?.[0] ? (
                    <img
                      src={product.image || product.images?.[0]?.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] opacity-20 group-hover:opacity-30 transition-opacity">
                      <ImageIcon className="w-24 h-24" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-1000" />

                  <div className="absolute top-5 right-5 flex flex-col gap-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-700 ease-out">
                    <button
                      onClick={() => setSelectedMarketingProduct(product)}
                      className="p-4 rounded-2xl bg-[var(--color-surface)] backdrop-blur-3xl hover:bg-emerald-500 transition-all border border-[var(--color-border-bright)] hover:border-emerald-400 group/btn shadow-2xl"
                      title={t('aiMarketing')}
                    >
                      <Megaphone className="w-5 h-5 text-[var(--text-primary)] group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => openModal(product)}
                      className="p-4 rounded-2xl bg-[var(--color-surface)] backdrop-blur-3xl hover:bg-[var(--brand-primary)] transition-all border border-[var(--color-border-bright)] hover:border-[var(--brand-primary)] group/btn shadow-2xl"
                    >
                      <Edit2 className="w-5 h-5 text-[var(--text-primary)] group-hover/btn:text-[var(--primary-foreground)] group-hover/btn:scale-110 transition-all" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-4 rounded-2xl bg-[var(--color-surface)] backdrop-blur-3xl hover:bg-rose-500 transition-all border border-[var(--color-border-bright)] hover:border-rose-400 group/btn shadow-2xl"
                    >
                      <Trash2 className="w-5 h-5 text-[var(--text-primary)] group-hover/btn:text-white group-hover/btn:scale-110 transition-all" />
                    </button>
                  </div>

                  <div className="absolute top-5 left-5">
                    <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border-bright backdrop-blur-xl ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                </div>

                <div className="p-8 relative">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.25em]">
                      {ln(categories.find(c => c.id === product.category) || { name: product.category_name }, 'name')}
                    </p>
                    <div className="h-1 w-1 bg-[var(--color-border)] rounded-full" />
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{product.sku}</p>
                  </div>

                  <h3 className="font-black text-[var(--text-primary)] truncate text-xl tracking-tight uppercase font-heading group-hover:text-[var(--brand-primary)] transition-colors mb-4">
                    {ln(product, 'name')}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="relative group/price">
                      <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter">
                        {product.price?.toLocaleString()} <span className="text-[10px] text-[var(--text-muted)] font-black ml-1 uppercase">{currency}</span>
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl ${product.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[var(--color-surface-raised)] text-[var(--text-muted)] border-[var(--color-border)]'} border`}>
                      {product.active ? t('active') : t('inactive')}
                    </span>
                  </div>

                  {/* Prediction Insight */}
                  <div className="mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('velocity')}</p>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-[var(--brand-secondary)]" />
                        <span className="text-sm font-black text-[var(--text-primary)]">{velocity} <span className="text-[9px] text-[var(--text-muted)]">/day</span></span>
                      </div>
                    </div>
                    {stockStatus.days != null && (
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{language === 'uz' ? 'Qoldiq' : (language === 'ru' ? 'Остаток' : 'Residue')}</p>
                        <p className={`text-sm font-black ${stockStatus.days <= 3 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {stockStatus.days} <span className="text-[9px] uppercase">{language === 'uz' ? 'kun' : (language === 'ru' ? 'дн' : 'days')}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Overhaul */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[var(--color-overlay)] backdrop-blur-md z-50 pointer-events-auto"
              onClick={() => !isSubmitting && setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] z-[60] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="p-8 lg:p-12 border-b border-[var(--color-border)] flex items-center justify-between relative bg-[var(--color-surface-raised)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-30" />
                <div>
                  <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase font-heading">
                    {editingProduct ? t('editProduct') : t('addProduct')}
                  </h2>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.3em] mt-3 font-black flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                    {t('productConfiguration')}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-all group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 scrollbar-hide">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] ml-1">{t('universalIdentifier')}</label>
                        <button
                          type="button"
                          onClick={handleAutoTranslate}
                          disabled={isTranslating || !formData.name}
                          className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border shadow-sm transition-all flex items-center gap-3 ${!formData.name
                            ? 'opacity-30 cursor-not-allowed border-[var(--color-border)] text-[var(--text-muted)]'
                            : 'border-[var(--brand-secondary-glow)] text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-glow)]'
                            }`}
                        >
                          {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {t('aiLocalize')}
                        </button>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex-1">
                          <Input
                            label={t('productNameMain')}
                            value={formData.name}
                            onChange={(v) => setFormData(prev => ({
                              ...prev,
                              name: v,
                              slug: !editingProduct ? v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : prev.slug
                            }))}
                            placeholder="Premium Collection T-Shirt"
                            required
                          />
                        </div>
                        {/* Image Upload */}
                        <div className="w-32 flex-shrink-0">
                          <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block text-center">{t('imageUpload')}</label>
                          <div
                            className="h-24 w-full border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--brand-primary)]/50 transition-colors overflow-hidden group"
                            onClick={() => document.getElementById('product-image')?.click()}
                          >
                            {imagePreview || editingProduct?.image ? (
                              <img src={imagePreview || editingProduct?.image} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
                            )}
                            <input
                              id="product-image"
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
                      <div className="grid grid-cols-2 gap-6">
                        <Input
                          label={t('nameUz')}
                          value={formData.name_uz}
                          onChange={(v) => setFormData(prev => ({ ...prev, name_uz: v }))}
                          placeholder="Nomi"
                        />
                        <Input
                          label={t('nameRu')}
                          value={formData.name_ru}
                          onChange={(v) => setFormData(prev => ({ ...prev, name_ru: v }))}
                          placeholder="Название"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 p-6 bg-[var(--color-surface-raised)] rounded-3xl border border-[var(--color-border)]">
                      <Input
                        label={t('price')}
                        type="number"
                        value={formData.price}
                        onChange={(v) => setFormData(prev => ({ ...prev, price: v }))}
                        icon={<span className="text-xs font-black opacity-40">{currency}</span>}
                        required
                      />
                      <Input
                        label={t('stock')}
                        type="number"
                        value={formData.stock}
                        onChange={(v) => setFormData(prev => ({ ...prev, stock: v }))}
                        icon={<Gauge className="w-4 h-4" />}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] ml-1">{t('category')}</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                        className="w-full px-6 py-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-primary)] focus:ring-4 focus:ring-[var(--brand-primary-glow)] focus:border-[var(--brand-primary)] transition-all font-black text-sm outline-none shadow-sm"
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Variants Toggle */}
                    <div className="flex items-center gap-6 p-8 rounded-3xl bg-indigo-50 border border-indigo-100 mt-8">
                      <input
                        type="checkbox"
                        checked={formData.has_variants}
                        onChange={(e) => setFormData(prev => ({ ...prev, has_variants: e.target.checked }))}
                        className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 bg-white border-indigo-200 cursor-pointer"
                      />
                      <div>
                        <p className="font-black text-indigo-700 text-[11px] uppercase tracking-[0.2em]">{t('productVariants')}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 font-bold leading-relaxed">{t('sizesColorsEtc')}</p>
                      </div>
                    </div>

                    {formData.has_variants && (
                      <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500 mt-8">
                        {/* Attributes configuration */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] ml-1">{t('attributes')}</h3>
                            <Button variant="outline" size="sm" onClick={addAttribute} className="h-8 px-4 text-[9px] border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                              {t('addAttribute')}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {formData.attributes.map((attr, idx) => (
                              <div key={idx} className="p-6 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <Input
                                      label={t('name')}
                                      value={attr.name}
                                      onChange={(v: string) => handleAttributeChange(idx, 'name', v)}
                                      placeholder={t('exampleColorSize')}
                                      className="h-10 text-xs"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeAttribute(idx)}
                                    className="mt-6 p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Qiymatlar (vergul bilan ajrating)</label>
                                  <Input
                                    value={attr.values.join(', ')}
                                    onChange={(v: string) => handleAttributeChange(idx, 'values', v.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="Qizil, Moviy, Yashil"
                                    className="h-10 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Variants table */}
                        {formData.variants.length > 0 && (
                          <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] ml-1">Kombinatsiyalar</h3>
                            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-sm bg-white">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                  <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--color-border)]">
                                    <tr>
                                      <th className="px-6 py-4">Variant</th>
                                      <th className="px-6 py-4">SKU</th>
                                      <th className="px-6 py-4">Narxi</th>
                                      <th className="px-6 py-4">Soni</th>
                                      <th className="px-6 py-4 text-center">Faol</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--color-border)]">
                                    {formData.variants.map((variant, vIdx) => (
                                      <tr key={vIdx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                          <div className="flex flex-wrap gap-1">
                                            {Object.entries(variant.attributes).map(([k, v]) => (
                                              <span key={k} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-100">
                                                {v as string}
                                              </span>
                                            ))}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <input
                                            value={variant.sku}
                                            onChange={(e) => {
                                              const newVariants = [...formData.variants];
                                              newVariants[vIdx].sku = e.target.value;
                                              setFormData(prev => ({ ...prev, variants: newVariants }));
                                            }}
                                            className="w-full bg-transparent border-none text-[11px] font-bold text-[var(--text-primary)] outline-none focus:ring-0"
                                          />
                                        </td>
                                        <td className="px-6 py-4">
                                          <input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => {
                                              const newVariants = [...formData.variants];
                                              newVariants[vIdx].price = e.target.value;
                                              setFormData(prev => ({ ...prev, variants: newVariants }));
                                            }}
                                            className="w-24 bg-transparent border-none text-[11px] font-bold text-[var(--text-primary)] outline-none focus:ring-0"
                                          />
                                        </td>
                                        <td className="px-6 py-4">
                                          <input
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) => {
                                              const newVariants = [...formData.variants];
                                              newVariants[vIdx].stock = e.target.value;
                                              setFormData(prev => ({ ...prev, variants: newVariants }));
                                            }}
                                            className="w-16 bg-transparent border-none text-[11px] font-bold text-[var(--text-primary)] outline-none focus:ring-0"
                                          />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          <input
                                            type="checkbox"
                                            checked={variant.active}
                                            onChange={(e) => {
                                              const newVariants = [...formData.variants];
                                              newVariants[vIdx].active = e.target.checked;
                                              setFormData(prev => ({ ...prev, variants: newVariants }));
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-indigo-200"
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] ml-1">Detail Analysis</label>
                        <button
                          type="button"
                          onClick={handleGenerateAIDescription}
                          disabled={isGeneratingAI || !formData.name}
                          className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border shadow-sm transition-all flex items-center gap-3 ${!formData.name
                            ? 'opacity-30 cursor-not-allowed border-[var(--color-border)] text-[var(--text-muted)]'
                            : 'border-[var(--brand-primary-glow)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-glow)]'
                            }`}
                        >
                          {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          AI Insight
                        </button>
                      </div>
                      <TextArea
                        label="Description (Main)"
                        value={formData.description}
                        onChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
                        placeholder="Crafted from premium silk..."
                        rows={6}
                      />
                      <TextArea
                        label="UZ Description"
                        value={formData.description_uz}
                        onChange={(v) => setFormData(prev => ({ ...prev, description_uz: v }))}
                        placeholder="O'zbekcha tavsifi"
                        rows={4}
                      />
                      <TextArea
                        label="RU Description"
                        value={formData.description_ru}
                        onChange={(v) => setFormData(prev => ({ ...prev, description_ru: v }))}
                        placeholder="Русское описание"
                        rows={4}
                      />
                    </div>
                    {/* SEO & Discoverability */}
                    <div className="space-y-4 pt-8 border-t border-[var(--color-border)]">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] ml-1">SEO & Discoverability</label>
                        {/* AI SEO Tags */}
                        <button
                          type="button"
                          onClick={handleGenerateSEOTags}
                          disabled={isGeneratingSEO || !formData.name}
                          className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border shadow-sm transition-all flex items-center gap-3 ${!formData.name
                            ? 'opacity-30 cursor-not-allowed border-[var(--color-border)] text-[var(--text-muted)]'
                            : 'border-[var(--brand-primary-glow)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-glow)]'
                            }`}
                        >
                          {isGeneratingSEO ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          AI SEO Tags
                        </button>
                      </div>
                      <TextArea
                        label="SEO Tags (Main)"
                        value={formData.seo_tags}
                        onChange={(v) => setFormData(prev => ({ ...prev, seo_tags: v }))}
                        placeholder="t-shirt, premium, fashion, cotton"
                        rows={2}
                      />
                      <TextArea
                        label="UZ SEO Tags"
                        value={formData.seo_tags_uz}
                        onChange={(v) => setFormData(prev => ({ ...prev, seo_tags_uz: v }))}
                        placeholder="futbolka, premium, moda, paxta"
                        rows={2}
                      />
                      <TextArea
                        label="RU SEO Tags"
                        value={formData.seo_tags_ru}
                        onChange={(v) => setFormData(prev => ({ ...prev, seo_tags_ru: v }))}
                        placeholder="футболка, премиум, мода, хлопок"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center gap-6 p-8 rounded-3xl bg-emerald-50 border border-emerald-100">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                        className="w-6 h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 bg-white border-emerald-200 cursor-pointer"
                      />
                      <div>
                        <p className="font-black text-emerald-700 text-[11px] uppercase tracking-[0.2em]">{t('active')}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 font-bold leading-relaxed">{t('activeHelper')}</p>
                      </div>
                    </div>

                    {/* AI Review Summary (Visible in edit mode) */}
                    {editingProduct && editingProduct.id && (
                      <div className="pt-8 border-t border-[var(--color-border)]">
                        <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                          {language === 'uz' ? 'AI Sharh Tahlili' : 'AI Review Analysis'}
                        </h3>
                        <AIReviewSummary productId={editingProduct.id} language={language} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 lg:p-12 border-t border-[var(--color-border)] flex gap-6 justify-end bg-slate-50">
                <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting} className="h-14 px-10 rounded-2xl">
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting} className="h-14 min-w-[200px] rounded-2xl shadow-xl bg-[var(--brand-primary)] text-[var(--primary-foreground)]">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t('save')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MarketingModal
        isOpen={!!selectedMarketingProduct}
        onClose={() => setSelectedMarketingProduct(null)}
        product={selectedMarketingProduct}
        language={language}
      />
    </div>
  );
}

export default Products;
