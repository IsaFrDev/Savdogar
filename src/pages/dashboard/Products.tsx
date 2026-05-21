import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Sparkles, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Gauge, 
  Megaphone, 
  Upload, 
  Download,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Box,
  Eye,
  Check,
  Globe,
  Settings2,
  Layers,
  ArrowUpRight,
  Wand2,
  Search as SearchIcon,
  ShieldCheck,
  LayoutGrid,
  FileSearch,
  Languages
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { Modal } from '../../components/Modal';

const UNIT_CHOICES = [
  { id: 'litr', label: 'litr' },
  { id: 'kub_metr', label: 'kub metr' },
  { id: 'kvadrat_metr', label: 'kvadrat metr' },
  { id: 'tonna', label: 'tonna' },
  { id: 'santimetr', label: 'santimetr' },
  { id: 'gramm', label: 'gramm' },
  { id: 'kilogramm', label: 'kilogramm' },
  { id: 'portsiya', label: 'portsiya' },
  { id: 'metr', label: 'metr' },
  { id: 'dona', label: 'dona' },
  { id: 'upakovka', label: 'Upakovka' },
  { id: 'korobka', label: 'Korobka' },
  { id: 'pachka', label: 'Pachka' },
  { id: 'blok', label: 'Blok' },
];


interface ProductsProps {
  storeId?: number;
}

export function Products({ storeId }: ProductsProps) {
  const { t, language, currency, ln, formatPrice, currentStore } = useApp();
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
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);

  const handleRemoveBackground = () => {
    setIsEnhancingImage(true);
    setTimeout(() => {
      setIsEnhancingImage(false);
      // Simulating clean, high-fidelity transparent background image replacement
      setImagePreview("https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop");
    }, 1800);
  };

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
    unit: 'dona',
    branches: [] as number[],
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [productAttributes, setProductAttributes] = useState<any[]>([]);


  useEffect(() => {
    if (currentStore?.id) {
      loadData();
    }
  }, [currentStore]);

  const loadData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      // Supabase-dan ma'lumotlarni olish
      const [productsData, categoriesData, staffData] = await Promise.all([
        supabaseApi.products.list(currentStore.id),
        supabaseApi.categories.list(currentStore.id),
        supabaseApi.staff.list(currentStore.id),
      ]);
      setProducts(Array.isArray(productsData.data) ? productsData.data : (Array.isArray(productsData) ? productsData : []));
      setCategories(Array.isArray(categoriesData) ? categoriesData : (Array.isArray((categoriesData as any).data) ? (categoriesData as any).data : []));
      setBranches(Array.isArray(staffData) ? staffData : (Array.isArray((staffData as any).data) ? (staffData as any).data : [])); // Bu yerda filiallar o'rniga hozircha staff ishlatyapmiz
    } catch (error) {
      console.error('Failed to load products/categories from Supabase:', error);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
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
        stock: product.stock_quantity?.toString() || '0',
        sku: product.sku || '',
        description: product.description || '',
        description_uz: product.description_uz || '',
        description_ru: product.description_ru || '',
        seo_tags: product.seo_tags || '',
        seo_tags_uz: product.seo_tags_uz || '',
        seo_tags_ru: product.seo_tags_ru || '',
        active: product.active,
        unit: product.unit || 'dona',
        branches: product.branches || [],
      });
      setProductVariants(product.variants || []);
      // Map attributes if they exist
      setProductAttributes(product.product_attributes?.map((attr: any) => ({
        name: attr.name,
        is_multiple: attr.is_multiple_choice,
        options: attr.values.map((v: any) => ({ name: v.name, price: v.price }))
      })) || []);
      setImagePreview(product.image || null);

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
        seo_tags_ru: '',
        active: true,
        unit: 'dona',
        branches: [],
      });
      setProductVariants([]);
      setProductAttributes([]);
      setImagePreview(null);
    }

    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !currentStore?.id) return;

    setIsSubmitting(true);
    try {
      const data: any = {
        store: currentStore.id,
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock) || 0,
        category: formData.category_id ? parseInt(formData.category_id) : null,
        unit: formData.unit,
        branches: formData.branches,
        variants: productVariants.map(v => ({
          sku: `${formData.sku || 'v'}-${v.name.toLowerCase()}`,
          price: parseFloat(v.price) || 0,
          attributes: { [formData.unit]: v.name },
          stock: parseInt(formData.stock) || 0
        })),
        attributes: productAttributes.map(attr => ({
          name: attr.name,
          is_multiple_choice: attr.is_multiple,
          values: attr.options.map((opt: any) => ({ name: opt.name, price: parseFloat(opt.price) || 0 }))
        }))
      };

      if (editingProduct) {
        await supabaseApi.products.update(editingProduct.id, data);
      } else {
        await supabaseApi.products.create(data);
      }

      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!formData.name) return;
    setIsGeneratingAI(true);
    try {
      const categoryName = categories.find(c => c.id === parseInt(formData.category_id))?.name;
      const response = await supabaseApi.ai.generateDescription(formData.name, categoryName, language);
      setFormData(prev => ({ ...prev, description: response.data.description }));
    } catch (error) {
      console.error('Failed to generate AI description in Supabase:', error);
    }
    setIsGeneratingAI(false);
  };

  const handleGenerateSEOTags = async () => {
    if (!formData.name) return;
    setIsGeneratingSEO(true);
    try {
      const response = await supabaseApi.ai.generateSeoTags({
        name: formData.name,
        description: formData.description,
        language: language
      });
      setFormData(prev => ({ ...prev, seo_tags: response.data.seo_tags }));
    } catch (error) {
      console.error('Failed to generate SEO tags in Supabase:', error);
    }
    setIsGeneratingSEO(false);
  };

  const handleAutoTranslate = async () => {
    if (!formData.name) return;
    setIsTranslating(true);
    try {
      const response = await supabaseApi.ai.translateProduct({
        name: formData.name,
        description: formData.description,
        source_lang: 'uz'
      });
      const d = response.data;
      setFormData(prev => ({
        ...prev,
        name_uz: d.name_uz || prev.name_uz,
        name_ru: d.name_ru || prev.name_ru,
        description_uz: d.description_uz || prev.description_uz,
        description_ru: d.description_ru || prev.description_ru
      }));
    } catch (error) {
      console.error('Failed to translate product in Supabase:', error);
    }
    setIsTranslating(false);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white">
        <Loader2 className="w-16 h-16 text-slate-950 animate-spin mb-6 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Inventory Matrix Loading</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -m-12 p-12 space-y-16 text-slate-950 font-sans selection:bg-slate-950 selection:text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1.5 bg-slate-950 rounded-full" />
            <span className="text-xs font-black text-slate-950 uppercase tracking-[0.5em]">Inventory Hub</span>
          </div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase font-heading leading-none">
            Products <span className="text-slate-300">Catalog</span>
          </h1>
          <p className="text-slate-400 mt-6 uppercase tracking-[0.2em] text-[10px] font-black flex items-center gap-3">
            <LayoutGrid size={14} className="text-indigo-500" /> {products.length} Faol Mahsulotlar Mavjud
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <button onClick={() => {}} className="h-16 px-8 bg-slate-50 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center gap-3">
             <Download size={18} /> Eksport
           </button>
           <button 
             onClick={() => openModal()}
             className="h-16 px-10 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-950/20 hover:scale-105 transition-all flex items-center gap-3"
           >
             <Plus size={18} className="stroke-[3px]" /> Yangi Tovar
           </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-3 rounded-[32px] shadow-2xl shadow-slate-200/40 border border-slate-50">
         <div className="flex-1 relative group bg-slate-50 rounded-2xl border border-slate-50 focus-within:border-slate-950/10 transition-all">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-all" size={20} />
            <input 
               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-16 pr-6 h-16 bg-transparent border-none rounded-2xl text-sm font-black text-slate-950 placeholder:text-slate-200 focus:ring-0 outline-none"
               placeholder="Nomi yoki SKU bo'yicha qidirish..."
            />
         </div>
         <div className="flex items-center gap-6 px-6">
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-3">
               <Filter size={16} className="text-slate-400" />
               <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:text-slate-950 transition-all outline-none"
                >
                  <option value="all">Barcha Kategoriyalar</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
            </div>
         </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <div className="bg-white border-2 border-slate-50 rounded-[48px] overflow-hidden shadow-xl shadow-slate-200/30 hover:border-slate-950/10 transition-all duration-700 h-full flex flex-col relative">
              {/* Product Image Section */}
              <div className="aspect-square relative overflow-hidden bg-slate-50 group-hover:scale-105 transition-transform duration-1000">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Box size={80} strokeWidth={1} />
                  </div>
                )}
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center gap-4">
                  <button onClick={() => { setEditingProduct(product); setShowModal(true); }} className="w-14 h-14 bg-white text-slate-950 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all">
                    <Edit2 size={22} />
                  </button>
                  <button className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all">
                    <Trash2 size={22} />
                  </button>
                </div>
                
                {/* Stock Badge */}
                <div className={`absolute top-6 left-6 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl ${
                  product.stock_quantity > 10 ? 'bg-emerald-500 text-white' : product.stock_quantity > 0 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} dona` : 'Sotilgan'}
                </div>
              </div>

              {/* Product Info Section */}
              <div className="p-6 space-y-4 flex-1 flex flex-col relative z-10 bg-white">
                <div>
                   <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">{categories.find(c => c.id === product.category)?.name || 'General'}</p>
                   <h3 className="text-lg font-black text-slate-950 tracking-tight uppercase leading-tight group-hover:text-indigo-600 transition-colors truncate">{product.name}</h3>
                </div>

                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                     <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Narxi</p>
                     <span className="text-xl font-black text-slate-950 tabular-nums tracking-tighter">
                        {formatPrice(product.price)}
                     </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Qoldiq</p>
                    <span className="text-base font-black text-slate-950 tabular-nums">{product.stock_quantity} dona</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Mahsulot Tahrirlash">
         <div className="p-12 space-y-12 bg-white max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {/* Left Side */}
               <div className="space-y-8">
                  <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center cursor-pointer hover:border-slate-950 transition-all overflow-hidden relative group">
                     {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-slate-200" />}
                     <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest">Rasm Yuklash</div>
                     
                     {/* AI Background removal loader */}
                     {isEnhancingImage && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white z-20">
                           <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                           <span className="text-[10px] font-black uppercase tracking-[0.25em] text-center px-4 animate-pulse">
                              {t('enhancingBackground') || "Fon tozalanmoqda..."}
                           </span>
                        </div>
                     )}
                  </div>

                  {imagePreview && (
                     <button
                        type="button"
                        onClick={handleRemoveBackground}
                        disabled={isEnhancingImage}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-3xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                     >
                        <Sparkles size={16} className="animate-pulse" /> {t('aiEnhanceBackground') || "AI Fon Tozalash"}
                     </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Narx (UZS)</label>
                        <input value={formData.price} onChange={(e) => setFormData(p => ({...p, price: e.target.value}))} className="w-full h-20 bg-slate-50 border border-slate-50 rounded-3xl px-8 font-black text-slate-950 text-xl outline-none focus:border-slate-950/10" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Soni</label>
                        <input value={formData.stock} onChange={(e) => setFormData(p => ({...p, stock: e.target.value}))} className="w-full h-20 bg-slate-50 border border-slate-50 rounded-3xl px-8 font-black text-slate-950 text-xl outline-none focus:border-slate-950/10" />
                     </div>
                  </div>
               </div>

                {/* Right Side */}
               <div className="space-y-10">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Asosiy Nomi</label>
                        <button onClick={handleAutoTranslate} className="flex items-center gap-3 text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all"><Languages size={14} /> AI Tarjima</button>
                     </div>
                     <input value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} className="w-full h-20 bg-slate-50 border border-slate-50 rounded-3xl px-8 font-black text-slate-950 text-xl outline-none focus:border-slate-950/10 uppercase" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">O'lchov Birligi</label>
                        <select 
                          value={formData.unit} 
                          onChange={(e) => setFormData(p => ({...p, unit: e.target.value}))}
                          className="w-full h-20 bg-slate-50 border border-slate-50 rounded-3xl px-8 font-black text-slate-950 text-sm outline-none focus:border-slate-950/10"
                        >
                           {UNIT_CHOICES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                        </select>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Filiallar</label>
                        <div className="flex flex-wrap gap-2 p-2 min-h-[5rem] bg-slate-50 border border-slate-50 rounded-3xl">
                           {branches.map(b => (
                             <button 
                               key={b.id}
                               onClick={() => {
                                 const exists = formData.branches.includes(b.id);
                                 setFormData(p => ({
                                   ...p,
                                   branches: exists ? p.branches.filter(id => id !== b.id) : [...p.branches, b.id]
                                 }));
                               }}
                               className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.branches.includes(b.id) ? 'bg-slate-950 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                             >
                               {b.name}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Variants / Parameters Section */}
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-widest">Mahsulot xarakteristikalari</h4>
                        <button 
                          onClick={() => setProductVariants(p => [...p, { name: '', unit: formData.unit, price: '' }])}
                          className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          <Plus size={14} /> Parametr qo'shing
                        </button>
                     </div>
                     
                     <div className="space-y-4">
                        {productVariants.map((v, i) => (
                           <div key={i} className="grid grid-cols-3 gap-4 items-end bg-slate-50/50 p-6 rounded-3xl border border-slate-50">
                              <div className="space-y-2 col-span-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nomi</label>
                                 <input 
                                   value={v.name} 
                                   onChange={(e) => {
                                     const newV = [...productVariants];
                                     newV[i].name = e.target.value;
                                     setProductVariants(newV);
                                   }}
                                   className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-950 outline-none focus:border-slate-950" 
                                   placeholder="Masalan: Katta"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">O'lchov</label>
                                 <select 
                                   value={v.unit} 
                                   onChange={(e) => {
                                     const newV = [...productVariants];
                                     newV[i].unit = e.target.value;
                                     setProductVariants(newV);
                                   }}
                                   className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none"
                                 >
                                    {UNIT_CHOICES.map(uc => <option key={uc.id} value={uc.id}>{uc.label}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <div className="flex items-center justify-between">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Narx</label>
                                    <button onClick={() => setProductVariants(p => p.filter((_, idx) => idx !== i))} className="text-rose-500"><Trash2 size={12} /></button>
                                 </div>
                                 <input 
                                   value={v.price} 
                                   onChange={(e) => {
                                     const newV = [...productVariants];
                                     newV[i].price = e.target.value;
                                     setProductVariants(newV);
                                   }}
                                   className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-950 outline-none focus:border-slate-950" 
                                   placeholder="Narx"
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Additional Characteristics Section */}
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-widest">Qo'shimcha xarakteristikalar</h4>
                        <button 
                          onClick={() => setProductAttributes(p => [...p, { name: '', is_multiple: false, options: [{ name: '', price: '' }] }])}
                          className="flex items-center gap-2 text-fuchsia-600 font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          <Plus size={14} /> Qo'shimcha parametr qo'shing
                        </button>
                     </div>

                     <div className="space-y-8">
                        {productAttributes.map((attr, ai) => (
                           <div key={ai} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6 relative">
                              <button onClick={() => setProductAttributes(p => p.filter((_, idx) => idx !== ai))} className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors"><X size={16} /></button>
                              
                              <div className="flex gap-8">
                                 <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="radio" checked={!attr.is_multiple} onChange={() => {
                                      const newA = [...productAttributes];
                                      newA[ai].is_multiple = false;
                                      setProductAttributes(newA);
                                    }} className="sr-only" />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${!attr.is_multiple ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                       {!attr.is_multiple && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Yagona tanlov</span>
                                       <span className="text-[8px] text-slate-400 font-bold">Faqat bittasini tanlash mumkin</span>
                                    </div>
                                 </label>
                                 <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="radio" checked={attr.is_multiple} onChange={() => {
                                      const newA = [...productAttributes];
                                      newA[ai].is_multiple = true;
                                      setProductAttributes(newA);
                                    }} className="sr-only" />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${attr.is_multiple ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                       {attr.is_multiple && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Bir nechta tanlash</span>
                                       <span className="text-[8px] text-slate-400 font-bold">Bir nechta tanlash mumkin</span>
                                    </div>
                                 </label>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Qo'shimcha xarakteristika nomi</label>
                                 <input 
                                   value={attr.name} 
                                   onChange={(e) => {
                                     const newA = [...productAttributes];
                                     newA[ai].name = e.target.value;
                                     setProductAttributes(newA);
                                   }}
                                   className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-950 outline-none" 
                                   placeholder="Masalan: Souslar / Rangi"
                                 />
                              </div>

                              <div className="space-y-3">
                                 {attr.options.map((opt: any, oi: number) => (
                                    <div key={oi} className="grid grid-cols-2 gap-4 items-end">
                                       <div className="space-y-2">
                                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Nomi</label>
                                          <input 
                                            value={opt.name} 
                                            onChange={(e) => {
                                              const newA = [...productAttributes];
                                              newA[ai].options[oi].name = e.target.value;
                                              setProductAttributes(newA);
                                            }}
                                            className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-950 outline-none" 
                                            placeholder="Masalan: Sarimsoqli"
                                          />
                                       </div>
                                       <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Narx</label>
                                             <button onClick={() => {
                                               const newA = [...productAttributes];
                                               newA[ai].options = newA[ai].options.filter((_: any, idx: number) => idx !== oi);
                                               setProductAttributes(newA);
                                             }} className="text-rose-500"><Trash2 size={12} /></button>
                                          </div>
                                          <input 
                                            value={opt.price} 
                                            onChange={(e) => {
                                              const newA = [...productAttributes];
                                              newA[ai].options[oi].price = e.target.value;
                                              setProductAttributes(newA);
                                            }}
                                            className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-950 outline-none" 
                                            placeholder="Narx"
                                          />
                                       </div>
                                    </div>
                                 ))}
                                 <button 
                                   onClick={() => {
                                     const newA = [...productAttributes];
                                     newA[ai].options.push({ name: '', price: '' });
                                     setProductAttributes(newA);
                                   }}
                                   className="flex items-center gap-2 text-indigo-600 font-black text-[8px] uppercase tracking-widest mt-2"
                                 >
                                    <Plus size={12} /> Qo'shish
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Tavsif</label>
                        <button onClick={handleGenerateAIDescription} className="flex items-center gap-3 text-fuchsia-600 font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all"><Sparkles size={14} /> AI Tavsif</button>
                     </div>
                     <textarea rows={6} value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full bg-slate-50 border border-slate-50 rounded-[32px] p-8 font-bold text-slate-600 outline-none focus:border-slate-950/10" />
                  </div>


                  <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><FileSearch size={16} /> SEO & Smart Tags</h4>
                        <button onClick={handleGenerateSEOTags} className="text-emerald-600 font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all"><Wand2 size={14} /> AI Generatsiya</button>
                     </div>
                     <input value={formData.seo_tags} onChange={(e) => setFormData(p => ({...p, seo_tags: e.target.value}))} className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 text-xs font-bold text-slate-500 placeholder:text-slate-200 outline-none" placeholder="Keywords, meta-tags..." />
                  </div>
               </div>
            </div>

            <button onClick={handleSave} className="w-full h-24 bg-slate-950 text-white rounded-[40px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
               O'zgarishlarni Saqlash
            </button>
         </div>
      </Modal>
    </div>
  );
}
