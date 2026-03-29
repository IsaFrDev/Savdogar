import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X, 
  Loader2, 
  Smartphone, 
  Monitor, 
  AlertCircle, 
  Info,
  Type,
  Link2,
  ListOrdered,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { bannerApi, productApi, categoryApi } from '../../services/api';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { getMediaUrl } from '../../utils/media';

interface Banner {
  id: number;
  banner_type: 'main' | 'category';
  title: string;
  mobile_image: string | null;
  desktop_image: string | null;
  link_type: 'none' | 'category' | 'product' | 'url';
  link_value: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

export function Banners() {
  const { t, language, currentStore } = useApp();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerType, setBannerType] = useState<'main' | 'category'>('main');
  const [title, setTitle] = useState('');
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<'none' | 'category' | 'product' | 'url'>('none');
  const [linkValue, setLinkValue] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Lists for link selection
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const loadData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [bannersRes, productsRes, categoriesRes] = await Promise.all([
        bannerApi.list(currentStore.id),
        productApi.list({ store: currentStore.id, active: true }),
        categoryApi.list(currentStore.id)
      ]);
      setBanners(bannersRes.data);
      setProducts(productsRes.data.results || productsRes.data || []);
      setCategories(categoriesRes.data.results || categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to load banners data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentStore?.id]);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerType(banner.banner_type);
      setTitle(banner.title);
      setLinkType(banner.link_type);
      setLinkValue(banner.link_value);
      setOrder(banner.order);
      setIsActive(banner.is_active);
      setMobilePreview(banner.mobile_image ? getMediaUrl(banner.mobile_image) : null);
      setDesktopPreview(banner.desktop_image ? getMediaUrl(banner.desktop_image) : null);
    } else {
      setEditingBanner(null);
      setBannerType('main');
      setTitle('');
      setLinkType('none');
      setLinkValue('');
      setOrder(banners.length);
      setIsActive(true);
      setMobileFile(null);
      setDesktopFile(null);
      setMobilePreview(null);
      setDesktopPreview(null);
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'mobile' | 'desktop') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert(language === 'uz' ? 'Fayl hajmi 10MB dan oshmasligi kerak' : 'File size should not exceed 10MB');
        return;
      }
      if (type === 'mobile') {
        setMobileFile(file);
        setMobilePreview(URL.createObjectURL(file));
      } else {
        setDesktopFile(file);
        setDesktopPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSave = async () => {
    if (!currentStore?.id) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('banner_type', bannerType);
      formData.append('title', title);
      formData.append('link_type', linkType);
      formData.append('link_value', linkValue);
      formData.append('order', order.toString());
      formData.append('is_active', isActive.toString());
      
      if (mobileFile) formData.append('mobile_image', mobileFile);
      if (desktopFile) formData.append('desktop_image', desktopFile);

      if (editingBanner) {
        await bannerApi.update(currentStore.id, editingBanner.id, formData);
      } else {
        await bannerApi.create(currentStore.id, formData);
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save banner:', error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!currentStore?.id || !confirm(language === 'uz' ? "O'chirilsinmi?" : "Delete banner?")) return;
    try {
      await bannerApi.delete(currentStore.id, id);
      loadData();
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const toggleStatus = async (banner: Banner) => {
    if (!currentStore?.id) return;
    try {
      await bannerApi.update(currentStore.id, banner.id, { is_active: !banner.is_active });
      loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">
            {language === 'uz' ? 'Bannerlar' : 'Banners'}
          </h1>
          <p className="text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] text-[10px] font-bold">
            {language === 'uz' ? "Do'koningiz uchun reklama bannerlarini boshqaring" : "Manage promotional banners for your store"}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-indigo-500/20">
          <Plus className="w-5 h-5" />
          {language === 'uz' ? "Banner qo'shish" : 'Add Banner'}
        </Button>
      </div>

      {banners.length === 0 ? (
        <GlassCard className="p-20 text-center border-dashed border-2 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
            <ImageIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">
            {language === 'uz' ? "Bannerlar mavjud emas" : "No Banners Yet"}
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
            {language === 'uz' ? "Kolleksiyalar, aksiyalar va yangiliklarni reklama qilish uchun bannerlar qo'shing." : "Add banners to promote collections, sales, and news."}
          </p>
          <Button variant="outline" onClick={() => handleOpenModal()} className="rounded-xl px-8 h-12">
            {language === 'uz' ? "Birinchi bannerni qo'shish" : 'Add your first banner'}
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {banners.map((banner) => (
            <motion.div
              layout
              key={banner.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative"
            >
              <GlassCard className={`overflow-hidden border-2 transition-all duration-500 h-full flex flex-col ${banner.is_active ? 'border-transparent' : 'border-slate-200 opacity-60'}`}>
                {/* Banner Preview */}
                <div className="relative aspect-[16/7] bg-slate-100 overflow-hidden">
                  {banner.desktop_image ? (
                    <img src={getMediaUrl(banner.desktop_image) || undefined} alt={banner.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  
                  {/* Overlay Tags */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                      {banner.banner_type === 'main' ? (language === 'uz' ? 'Asosiy' : 'Main') : (language === 'uz' ? 'Kategoriya' : 'Category')}
                    </span>
                    {!banner.is_active && (
                      <span className="px-3 py-1.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest border border-rose-400/20 shadow-lg">
                        {language === 'uz' ? 'Faol emas' : 'Inactive'}
                      </span>
                    )}
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                    <button 
                      onClick={() => handleOpenModal(banner)}
                      className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                      <Type className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toggleStatus(banner)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl ${banner.is_active ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}
                    >
                      {banner.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(banner.id)}
                      className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter truncate w-full pr-8">
                      {banner.title || (language === 'uz' ? 'Sarlavhasiz banner' : 'Untitled Banner')}
                    </h3>
                    <span className="text-slate-400 font-black text-xs">#{banner.order}</span>
                  </div>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-slate-500">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{banner.link_type}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className="text-indigo-500 max-w-[150px] truncate">{banner.link_value || 'None'}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Banner Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pt-20 pb-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                    {editingBanner ? (language === 'uz' ? 'Bannerni tahrirlash' : 'Edit Banner') : (language === 'uz' ? "Yangi banner qo'shish" : 'Add New Banner')}
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">
                    {language === 'uz' ? 'Barcha reklamalarni shu yerda sozlang' : 'Configure all promotional settings here'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar space-y-10">
                {/* Banner Type Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Banner Turi</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setBannerType('main')}
                      className={`p-6 rounded-3xl border-2 transition-all text-left ${bannerType === 'main' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <h4 className={`font-black text-sm uppercase tracking-wide mb-1 ${bannerType === 'main' ? 'text-indigo-600' : 'text-slate-700'}`}>Asosiy Banner</h4>
                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">Bosh sahifaning eng yuqori qismida ko'rinadi.</p>
                    </button>
                    <button 
                      onClick={() => setBannerType('category')}
                      className={`p-6 rounded-3xl border-2 transition-all text-left ${bannerType === 'category' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <h4 className={`font-black text-sm uppercase tracking-wide mb-1 ${bannerType === 'category' ? 'text-indigo-600' : 'text-slate-700'}`}>Kategoriya Banneri</h4>
                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">Maxsus kategoriyalar uchun reklama banneri.</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Banner Sarlavhasi</label>
                  <Input 
                    value={title} 
                    onChange={setTitle} 
                    placeholder={language === 'uz' ? 'Masalan: Yangi yil chegirmalari' : 'e.g. New Year Deals'} 
                    className="!rounded-2xl !bg-slate-50 !border-slate-100 focus:!border-indigo-500/50 !h-14 font-bold"
                  />
                </div>

                {/* Image Upload Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Desktop Banner */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5" /> Desktop Banner (1600x500)
                    </label>
                    <div className="relative aspect-[16/5] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group">
                      {desktopPreview ? (
                        <>
                          <img src={desktopPreview} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer px-6 py-2 bg-white rounded-xl text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl">
                              O'zgartirish
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'desktop')} />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2 p-6">
                          <Plus className="w-8 h-8 text-slate-300" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Yuklash</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'desktop')} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Mobile Banner */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5" /> Mobile Banner (1000x400)
                    </label>
                    <div className="relative aspect-[10/4] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group">
                      {mobilePreview ? (
                        <>
                          <img src={mobilePreview} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer px-6 py-2 bg-white rounded-xl text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl">
                              O'zgartirish
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'mobile')} />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2 p-6">
                          <Plus className="w-8 h-8 text-slate-300" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Yuklash</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'mobile')} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Link Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Link turi</label>
                    <select 
                      value={linkType}
                      onChange={(e) => {
                        setLinkType(e.target.value as any);
                        setLinkValue('');
                      }}
                      className="w-full h-14 rounded-2xl bg-slate-50 border-slate-100 border px-6 font-bold text-sm outline-none focus:border-indigo-500/50 appearance-none"
                    >
                      <option value="none">Hech qanday havolasiz</option>
                      <option value="category">Kategoriyaga o'tish</option>
                      <option value="product">Maxsus mahsulotga o'tish</option>
                      <option value="url">Tashqi havolaga o'tish</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                      {linkType === 'none' ? 'Havola qiymati' : linkType === 'url' ? 'Veb-sayt manzili' : linkType === 'category' ? 'Kategoriyani tanlang' : 'Mahsulotni tanlang'}
                    </label>
                    
                    {linkType === 'none' && (
                      <Input disabled value="" onChange={() => {}} placeholder="..." className="!rounded-2xl !bg-slate-100/50 !border-slate-100 !h-14 opacity-50" />
                    )}
                    
                    {linkType === 'url' && (
                      <Input 
                        value={linkValue} 
                        onChange={setLinkValue} 
                        placeholder="https://..." 
                        className="!rounded-2xl !bg-slate-50 !border-slate-100 !h-14 font-bold"
                      />
                    )}
                    
                    {linkType === 'category' && (
                      <select 
                        value={linkValue}
                        onChange={(e) => setLinkValue(e.target.value)}
                        className="w-full h-14 rounded-2xl bg-slate-50 border-slate-100 border px-6 font-bold text-sm outline-none focus:border-indigo-500/50 appearance-none"
                      >
                        <option value="">Kategoriyani tanlang</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                    
                    {linkType === 'product' && (
                      <select 
                        value={linkValue}
                        onChange={(e) => setLinkValue(e.target.value)}
                        className="w-full h-14 rounded-2xl bg-slate-50 border-slate-100 border px-6 font-bold text-sm outline-none focus:border-indigo-500/50 appearance-none"
                      >
                        <option value="">Mahsulotni tanlang</option>
                        {products.map(prod => (
                          <option key={prod.id} value={prod.id}>{prod.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="flex flex-wrap items-center gap-10 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Navbat tartibi:</label>
                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                      <button 
                        onClick={() => setOrder(Math.max(0, order - 1))}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 active:scale-90 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-black text-slate-800 text-sm">{order}</span>
                      <button 
                        onClick={() => setOrder(order + 1)}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 active:scale-90 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                      <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-all duration-300 relative">
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isActive ? 'translate-x-6' : ''}`} />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-800 transition-colors">
                      {isActive ? (language === 'uz' ? 'Hozirda faol' : 'Active Now') : (language === 'uz' ? 'Faol emas' : 'Inactive')}
                    </span>
                  </label>
                </div>

                {/* Advice Card */}
                <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Info className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h5 className="font-black text-indigo-900 text-sm uppercase tracking-wide mb-1">Banner bo'yicha tavsiyalar</h5>
                    <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                      Banner qisqa, tushunarli matn va aniq CTA (harakatga chorlovchi) bilan boyitilgan bo'lishi kerak. Fayl hajmi 10 MB gacha.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px]">
                  {language === 'uz' ? 'Bekor qilish' : 'Cancel'}
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || (!editingBanner && !desktopFile && !mobileFile)} 
                  className="rounded-2xl h-14 px-12 font-black uppercase tracking-widest text-[11px] bg-indigo-500 text-white shadow-2xl shadow-indigo-500/30"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingBanner ? (language === 'uz' ? 'Saqlash' : 'Save Changes') : (language === 'uz' ? "Qo'shish" : 'Add Banner')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
