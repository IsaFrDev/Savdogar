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
  EyeOff,
  Sparkles,
  Zap,
  LayoutGrid,
  MousePointer2,
  CloudUpload,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

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

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const loadData = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [bannersData, productsData, categoriesData] = await Promise.all([
        supabaseApi.banners.list(currentStore.id),
        supabaseApi.products.list(currentStore.id),
        supabaseApi.categories.list(currentStore.id)
      ]);
      setBanners(bannersData);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load banners data from Supabase:', error);
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
      setMobilePreview(banner.mobile_image || null);
      setDesktopPreview(banner.desktop_image || null);
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
      let mobile_image = mobilePreview;
      let desktop_image = desktopPreview;

      if (mobileFile) {
        const path = `${currentStore.id}/mobile_${Date.now()}`;
        mobile_image = await supabaseApi.storage.upload('banners', path, mobileFile);
      }
      if (desktopFile) {
        const path = `${currentStore.id}/desktop_${Date.now()}`;
        desktop_image = await supabaseApi.storage.upload('banners', path, desktopFile);
      }

      const bannerData = {
        banner_type: bannerType,
        title,
        link_type: linkType,
        link_value: linkValue,
        order: parseInt(order.toString()),
        is_active: isActive,
        mobile_image,
        desktop_image
      };

      if (editingBanner) {
        await supabaseApi.banners.update(currentStore.id, editingBanner.id, bannerData);
      } else {
        await supabaseApi.banners.create(currentStore.id, bannerData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save banner to Supabase:', error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!currentStore?.id || !confirm('O\'chirilsinmi?')) return;
    try {
      await supabaseApi.banners.delete(currentStore.id, id);
      loadData();
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const toggleStatus = async (banner: Banner) => {
    if (!currentStore?.id) return;
    try {
      await supabaseApi.banners.update(currentStore.id, banner.id, { is_active: !banner.is_active });
      loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
             <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Visual Merchandising</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading">Bannerlar</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black">Do'koningiz interfeysini vizual boyiting</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()} 
          className="h-16 px-10 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-4"
        >
          <Plus size={20} />
          Yangi Banner
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {banners.map((banner, index) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard className="p-0 border-slate-200 bg-white hover:border-indigo-500/30 transition-all duration-700 shadow-xl relative rounded-[48px] overflow-hidden border">
              {/* Banner Preview Area */}
              <div className="aspect-[16/7] relative overflow-hidden group/img">
                {banner.desktop_image ? (
                  <img src={banner.desktop_image} alt={banner.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800 bg-slate-950">
                    <ImageIcon size={64} className="opacity-10" />
                  </div>
                )}
                
                {/* Status Overlays */}
                <div className="absolute top-8 left-8 flex flex-col gap-3">
                   <span className="px-4 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-xl border border-white/10 text-white text-[9px] font-black uppercase tracking-widest shadow-2xl">
                     {banner.banner_type === 'main' ? 'Asosiy Sahifa' : 'Kategoriya'}
                   </span>
                   {!banner.is_active && (
                     <span className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest border border-rose-400/20 shadow-2xl">
                        Faollashtirilmagan
                     </span>
                   )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 backdrop-blur-[2px] flex items-center justify-center gap-6">
                   <button onClick={() => handleOpenModal(banner)} className="w-14 h-14 bg-white text-slate-900 rounded-[20px] flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"><Type size={24} /></button>
                   <button onClick={() => toggleStatus(banner)} className={`w-14 h-14 rounded-[20px] flex items-center justify-center hover:scale-110 transition-transform shadow-2xl ${banner.is_active ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {banner.is_active ? <EyeOff size={24} /> : <Eye size={24} />}
                   </button>
                   <button onClick={() => handleDelete(banner.id)} className="w-14 h-14 bg-rose-500 text-white rounded-[20px] flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"><Trash2 size={24} /></button>
                </div>
              </div>

              {/* Banner Info Content */}
              <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50 relative">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                   <Sparkles size={80} className="text-indigo-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-3 mb-2">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Banner ID: #{banner.id}</p>
                      <div className="w-1 h-1 bg-slate-700 rounded-full" />
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest tabular-nums">Order: {banner.order}</p>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase font-heading truncate group-hover:text-indigo-600 transition-colors">
                     {banner.title || 'Untitled Banner'}
                   </h3>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mb-1">Target Link</p>
                      <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                         <Link2 size={12} />
                         {banner.link_type === 'none' ? 'Hech qayerga' : banner.link_type}
                      </div>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <ChevronRight size={24} />
                   </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full empty-state-card py-40 flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="w-24 h-24 mb-10 text-slate-200" />
            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-[0.3em]">Bannerlar mavjud emas</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Do'koningizni bezash uchun yangi banner qo'shing</p>
          </div>
        )}
      </div>

      {/* Modern Banner Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-[56px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-heading">
                    {editingBanner ? 'Bannerni Tahrirlash' : 'Yangi Banner'}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center">
                  <X size={28} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar">
                {/* Banner Type Toggle */}
                <div className="grid grid-cols-2 gap-6">
                   <button 
                     onClick={() => setBannerType('main')}
                     className={`p-10 rounded-[40px] border-2 transition-all duration-500 text-left relative overflow-hidden group ${bannerType === 'main' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                   >
                      <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-colors ${bannerType === 'main' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <LayoutGrid size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Asosiy Banner</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bosh sahifa yuqorisida</p>
                      </div>
                      {bannerType === 'main' && <motion.div layoutId="activeBanner" className="absolute top-6 right-6 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,1)]" />}
                   </button>
                   <button 
                     onClick={() => setBannerType('category')}
                     className={`p-10 rounded-[40px] border-2 transition-all duration-500 text-left relative overflow-hidden group ${bannerType === 'category' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                   >
                      <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-colors ${bannerType === 'category' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Zap size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Kategoriya Banneri</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Maxsus bo'limlar uchun</p>
                      </div>
                      {bannerType === 'category' && <motion.div layoutId="activeBanner" className="absolute top-6 right-6 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,1)]" />}
                   </button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Banner Sarlavhasi</label>
                  <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-20 bg-slate-50 border border-slate-100 rounded-[28px] px-8 text-xl font-black text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-500/50 transition-all uppercase tracking-tighter"
                    placeholder="Masalan: Yangi Kolleksiya 2024"
                  />
                </div>

                {/* Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 flex items-center gap-3">
                         <Monitor size={14} /> Desktop Image
                      </label>
                      <div 
                        onClick={() => document.getElementById('desktop-upload')?.click()}
                        className="aspect-[16/7] rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-all overflow-hidden relative group"
                      >
                         {desktopPreview ? (
                           <img src={desktopPreview} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                         ) : (
                           <div className="flex flex-col items-center gap-4">
                              <CloudUpload size={40} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fayl tanlang</span>
                           </div>
                         )}
                         <input id="desktop-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'desktop')} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 flex items-center gap-3">
                         <Smartphone size={14} /> Mobile Image
                      </label>
                      <div 
                        onClick={() => document.getElementById('mobile-upload')?.click()}
                        className="aspect-[16/7] rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-all overflow-hidden relative group"
                      >
                         {mobilePreview ? (
                           <img src={mobilePreview} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                         ) : (
                           <div className="flex flex-col items-center gap-4">
                              <CloudUpload size={40} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fayl tanlang</span>
                           </div>
                         )}
                         <input id="mobile-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'mobile')} />
                      </div>
                   </div>
                </div>

                {/* Link Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Link Turi</label>
                      <div className="relative">
                        <select 
                          value={linkType}
                          onChange={(e) => setLinkType(e.target.value as any)}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-900 font-black outline-none focus:border-indigo-500/50 transition-all appearance-none"
                        >
                          <option value="none">Havolasiz</option>
                          <option value="category">Kategoriya</option>
                          <option value="product">Mahsulot</option>
                          <option value="url">Tashqi URL</option>
                        </select>
                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 text-slate-700 pointer-events-none" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Link Qiymati</label>
                      <input 
                        value={linkValue} 
                        onChange={(e) => setLinkValue(e.target.value)}
                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-900 font-bold outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="ID yoki Manzil..."
                      />
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-12 py-10 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-6">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSaving}
                  className="h-16 px-10 border border-slate-200 text-slate-500 rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all"
                >
                  Bekor Qilish
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || (!editingBanner && !desktopFile && !mobileFile)}
                  className="h-16 px-16 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Saqlash</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
