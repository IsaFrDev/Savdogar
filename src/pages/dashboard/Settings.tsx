import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Trash2, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Settings as SettingsIcon,
  Shield,
  CreditCard,
  Bell,
  Palette,
  CloudUpload,
  Check,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info,
  Lock,
  Smartphone,
  Eye,
  Store,
  Sparkles,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabaseApi } from '../../services/supabaseService';
import { GlassCard } from '../../components/GlassCard';

interface SettingsProps {
  storeId?: number;
}

export function Settings({ storeId }: SettingsProps) {
  const { t, language, ln } = useApp();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'contact' | 'payments' | 'notifications' | 'security'>('general');
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Payment Gateway Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<any>(null);
  const [paymentKeys, setPaymentKeys] = useState({ merchant_id: '', secret_key: '' });

  useEffect(() => {
    if (storeId) {
      loadSettings();
    }
  }, [storeId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await supabaseApi.stores.get(storeId!);
      setStoreData(data);
      setLogoPreview(data.logo);
    } catch (error) {
      console.error('Failed to load settings from Supabase:', error);
    }
    setLoading(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storeId) return;

    setIsSubmitting(true);
    try {
      let dataToSave: any = storeData;
      
      // Agar logotip o'zgargan bo'lsa (Hozircha oddiy object sifatida saqlaymiz)
      // Storage-ga yuklash logic-ni keyinroq qo'shishimiz mumkin
      
      await supabaseApi.stores.update(storeId, dataToSave);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadSettings();
    } catch (error) {
      console.error('Failed to save settings to Supabase:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (gateway: any) => {
    setSelectedGateway(gateway);
    const credentials = storeData?.payment_credentials?.[gateway.id] || { merchant_id: '', secret_key: '' };
    setPaymentKeys(credentials);
    setPaymentModalOpen(true);
  };

  const handleSavePaymentKeys = async () => {
    if (!storeId || !selectedGateway) return;
    
    // Create updated data
    const updatedCredentials = {
      ...(storeData.payment_credentials || {}),
      [selectedGateway.id]: paymentKeys
    };
    
    // Enable the method if keys are provided
    const isEnabled = paymentKeys.merchant_id.trim() !== '' && paymentKeys.secret_key.trim() !== '';
    const updatedMethods = {
      ...(storeData.payment_methods || {}),
      [selectedGateway.id]: isEnabled
    };

    setStoreData((prev: any) => ({
      ...prev,
      payment_credentials: updatedCredentials,
      payment_methods: updatedMethods
    }));

    setPaymentModalOpen(false);
    
    // We optionally save right away to make it real-time
    try {
       await supabaseApi.stores.update(storeId, {
         payment_credentials: updatedCredentials,
         payment_methods: updatedMethods
       });
    } catch (e) {
       console.error("Failed to sync payment keys to Supabase:", e);
    }
  };

  const handleChange = (field: string, value: any) => {
    setStoreData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading && !storeData) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-slate-950 animate-spin mb-6" />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: t('umumiy'), icon: SettingsIcon },
    { id: 'appearance', label: t('tashqiKorinish'), icon: Palette },
    { id: 'contact', label: t('aloqa'), icon: Phone },
    { id: 'payments', label: t('tolovlar'), icon: CreditCard },
    { id: 'notifications', label: t('bildirishnomalar'), icon: Bell },
    { id: 'security', label: t('xavfsizlik'), icon: Shield },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-slate-950 rounded-full shadow-xl shadow-slate-950/20" />
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">{t('configurationHub')}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('settings')}</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-[10px] font-black">{t('storeManagementCenter')}</p>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className={`h-16 px-12 rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center gap-4 shadow-2xl ${
            success ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-slate-950 text-white shadow-xl hover:bg-slate-900 hover:scale-105 active:scale-95'
          }`}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : success ? <Check size={18} /> : <Save size={18} />}
          {success ? t('saved') : t('save')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="flex flex-col gap-3 sticky top-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-5 p-6 rounded-[28px] border transition-all duration-500 group relative overflow-hidden ${
                  activeTab === tab.id 
                    ? 'bg-white border-slate-100 text-slate-950 shadow-xl shadow-slate-200/50' 
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-950'
                }`}
              >
                <tab.icon size={22} className={`${activeTab === tab.id ? 'text-slate-950' : 'text-slate-300 group-hover:text-slate-950'} transition-colors`} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute right-6 w-1.5 h-1.5 bg-slate-950 rounded-full" />
                )}
              </button>
            ))}
            
            <div className="mt-12 p-8 bg-slate-950 text-white rounded-[40px] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <Zap size={64} className="text-indigo-500" />
               </div>
               <h4 className="text-white font-black uppercase tracking-tighter text-lg mb-2 relative z-10">{t('premiumPlan')}</h4>
               <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-6 relative z-10">{t('allFeaturesAccess')}</p>
               <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all relative z-10 shadow-xl hover:bg-slate-50">{t('upgradePlan')}</button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="p-12 bg-white border-2 border-slate-50 rounded-[48px] shadow-2xl shadow-slate-200/30 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 blur-[80px] rounded-full -ml-24 -mb-24" />

                {activeTab === 'general' && (
                  <div className="space-y-12 relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-950">
                          <Store size={32} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('generalInfo')}</h3>
                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1.5">{t('storeBrandingHelper')}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                      <div className="md:col-span-4 space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('storeLogo')}</label>
                        <div 
                          className="aspect-square rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-slate-950 transition-all overflow-hidden group relative"
                          onClick={() => document.getElementById('store-logo')?.click()}
                        >
                          {logoPreview ? (
                            <img src={logoPreview} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                          ) : (
                            <div className="flex flex-col items-center gap-4">
                               <CloudUpload size={48} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t('uploadLogo')}</span>
                            </div>
                          )}
                          <input
                            id="store-logo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLogoFile(file);
                                setLogoPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-8 space-y-10">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('storeName')}</label>
                            <input
                              value={storeData.name}
                              onChange={(e) => handleChange('name', e.target.value)}
                              className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-950 font-black outline-none focus:border-slate-950 transition-all text-xl tracking-tighter uppercase"
                              placeholder={t('storeName') + '...'}
                            />
                         </div>

                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('storeSlug')}</label>
                            <div className="relative">
                               <input
                                value={storeData.slug}
                                onChange={(e) => handleChange('slug', e.target.value)}
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 pr-32 text-indigo-600 font-black outline-none focus:border-slate-950 transition-all lowercase"
                                placeholder="my-store"
                               />
                               <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px] uppercase">.bozorchi-ai.vercel.app</span>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('storeDescription')}</label>
                            <textarea
                              value={storeData.description}
                              onChange={(e) => handleChange('description', e.target.value)}
                              rows={5}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-6 text-slate-950 font-medium outline-none focus:border-slate-950 transition-all no-scrollbar leading-relaxed"
                              placeholder={t('storeDescriptionPlaceholder')}
                            />
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-12 relative z-10">
                     <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-950">
                          <Palette size={32} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('designAndColors')}</h3>
                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1.5">{t('visualInterfaceHelper')}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('primaryColor')}</label>
                          <div className="flex items-center gap-4">
                             <input 
                                type="color" 
                                value={storeData.primary_color || '#000000'} 
                                onChange={(e) => handleChange('primary_color', e.target.value)}
                                className="w-16 h-16 rounded-2xl bg-white border border-slate-100 p-1 cursor-pointer overflow-hidden"
                             />
                             <input 
                                value={storeData.primary_color || '#000000'} 
                                onChange={(e) => handleChange('primary_color', e.target.value)}
                                className="flex-1 h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-950 font-black outline-none font-mono"
                             />
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('secondaryColor')}</label>
                          <div className="flex items-center gap-4">
                             <input 
                                type="color" 
                                value={storeData.secondary_color || '#64748b'} 
                                onChange={(e) => handleChange('secondary_color', e.target.value)}
                                className="w-16 h-16 rounded-2xl bg-white border border-slate-100 p-1 cursor-pointer overflow-hidden"
                             />
                             <input 
                                value={storeData.secondary_color || '#64748b'} 
                                onChange={(e) => handleChange('secondary_color', e.target.value)}
                                className="flex-1 h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-950 font-black outline-none font-mono"
                             />
                          </div>
                       </div>

                       <div className="col-span-full p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex items-center justify-between group">
                          <div>
                             <h4 className="text-slate-950 font-black text-lg uppercase tracking-tight mb-1 flex items-center gap-3">
                                {t('darkModeAutopilot')}
                                <Sparkles size={18} className="text-indigo-600 animate-pulse" />
                             </h4>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('darkModeAutopilotHelper')}</p>
                          </div>
                          <button className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-110 transition-transform">
                             <Check size={24} />
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-12 relative z-10">
                     <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-950">
                          <Phone size={32} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('contactInfo')}</h3>
                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1.5">{t('contactChannelsHelper')}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-3">
                             <Phone size={14} className="text-slate-950" /> {t('phone')}
                          </label>
                          <input
                            value={storeData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-950 font-black outline-none focus:border-slate-950 transition-all tabular-nums"
                            placeholder="+998 90 123 45 67"
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-3">
                             <Mail size={14} className="text-slate-950" /> {t('email')}
                          </label>
                          <input
                            value={storeData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-950 font-black outline-none focus:border-slate-950 transition-all"
                            placeholder="hello@store.uz"
                          />
                       </div>
                       <div className="col-span-full space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-3">
                             <MapPin size={14} className="text-slate-950" /> {t('address')}
                          </label>
                          <input
                            value={storeData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 text-slate-950 font-black outline-none focus:border-slate-950 transition-all"
                            placeholder="Toshkent sh., Yunusobod tumani..."
                          />
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-12 relative z-10">
                     <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-950">
                          <CreditCard size={32} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('paymentSystems')}</h3>
                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1.5">{t('financeManagementHelper')}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {[
                         { id: 'payme', name: 'Payme', logo: 'https://cdn.payme.uz/logo/payme_color.png' },
                         { id: 'click', name: 'Click', logo: 'https://click.uz/wp-content/themes/click/img/logo.png' },
                         { id: 'uzum', name: 'Uzum Pay', logo: 'https://static.uzum.uz/icons/uzum-pay-logo.png' }
                       ].map(gateway => {
                         const isActive = storeData?.payment_methods?.[gateway.id] === true;
                         return (
                         <div key={gateway.id} className={`p-8 bg-slate-50 border ${isActive ? 'border-emerald-500 shadow-emerald-500/10' : 'border-slate-100'} rounded-[32px] hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between`}>
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md">
                                  <img src={gateway.logo} alt={gateway.name} className={`max-w-full h-auto transition-all ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} />
                                </div>
                                 <div>
                                    <h4 className="text-slate-950 font-black uppercase tracking-tight text-lg">{gateway.name}</h4>
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                      Status: {isActive ? t('activeStatus') || 'FAOL' : t('notActivated')}
                                    </p>
                                 </div>
                            </div>
                            <button 
                              onClick={() => handleOpenPaymentModal(gateway)}
                              className={`px-6 py-3 bg-white border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${isActive ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-slate-100 text-slate-950 hover:bg-slate-950 hover:text-white'}`}
                            >
                              {isActive ? t('configure') || 'Sozlash' : t('connect')}
                            </button>
                         </div>
                       )})}
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-12 relative z-10">
                     <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-950">
                          <Shield size={32} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase font-heading">{t('security')}</h3>
                         <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1.5">{t('dataProtectionHelper')}</p>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-8">
                             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-md">
                                <Lock size={28} />
                             </div>
                             <div>
                                <h4 className="text-slate-950 font-black text-lg uppercase tracking-tight mb-1">{t('twoFactorAuth')}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('protectYourAccount')}</p>
                             </div>
                          </div>
                          <button className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm">
                             <X size={24} />
                          </button>
                       </div>

                       <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-8">
                             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-md">
                                <Smartphone size={28} />
                             </div>
                             <div>
                                <h4 className="text-slate-950 font-black text-lg uppercase tracking-tight mb-1">{t('loginHistory')}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('checkRecentActivity')}</p>
                             </div>
                          </div>
                          <button className="px-8 py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all shadow-sm">{t('view')}</button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Payment Credentials Modal */}
      <AnimatePresence>
        {paymentModalOpen && selectedGateway && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 p-2 flex items-center justify-center border border-slate-100">
                  <img src={selectedGateway.logo} alt={selectedGateway.name} className="max-w-full h-auto" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">{selectedGateway.name} Integration</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('enterApiKeys') || 'API Klyuchlarni kiriting'}</p>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('merchantId') || 'Merchant ID'}</label>
                  <input
                    type="text"
                    value={paymentKeys.merchant_id}
                    onChange={(e) => setPaymentKeys(prev => ({ ...prev, merchant_id: e.target.value }))}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-slate-950 font-bold outline-none focus:border-slate-950 transition-all text-sm"
                    placeholder={selectedGateway.name + " ID"}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('secretKey') || 'Secret Key (Maxfiy Kalit)'}</label>
                  <input
                    type="password"
                    value={paymentKeys.secret_key}
                    onChange={(e) => setPaymentKeys(prev => ({ ...prev, secret_key: e.target.value }))}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-slate-950 font-bold outline-none focus:border-slate-950 transition-all text-sm"
                    placeholder="*****************"
                  />
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                  <Shield size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-bold leading-relaxed">{t('aesEncryptionNote') || 'Ushbu klyuchlar AES-256 algoritmi bilan shifrlanib saqlanadi. Ular faqatgina tranzaksiya o\'tkazish uchun ishlatiladi va o\'g\'irlanishdan himoyalangan.'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  {t('cancel') || 'Bekor qilish'}
                </button>
                <button 
                  onClick={handleSavePaymentKeys}
                  className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all"
                >
                  {t('confirm') || 'Tasdiqlash'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
