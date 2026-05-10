import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Star,
  MapPin,
  Eye,
  MessageSquare,
  FolderOpen,
  QrCode,
  Sparkles,
  Tag,
  Heart,
  Send,
  Wand2,
  Image,
  Layers,
  CreditCard,
  DollarSign,
  Megaphone,
  Users,
  Gift,
  Trophy,
  Activity,
  Zap,
  Target,
  LayoutGrid,
  Bell,
  Search,
  Globe,
  Download,
  Plus,
  Terminal,
  Cpu
} from 'lucide-react';
import { useApp, Store as StoreType } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabaseApi } from '../services/supabaseService';
import { getMediaUrl } from '../utils/media';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { Overview } from './dashboard/Overview';
import { Products } from './dashboard/Products';
import { Orders } from './dashboard/Orders';
import { StoreChatDashboard } from './dashboard/StoreChatDashboard';
import { Categories } from './dashboard/Categories';
import { Settings as SettingsPage } from './dashboard/Settings';
import AIStudio from './dashboard/AiStudio';
import { Discounts } from './dashboard/Discounts';
import POSInterface from './dashboard/POSInterface';
import ERPDashboard from './dashboard/ERPDashboard';
import { WishlistPage } from './dashboard/Wishlist';
import { NotificationCenter } from '../components/NotificationCenter';
import { QRCodeManager } from '../components/QRCodeManager';
import { StoreStylist } from '../components/StoreStylist';
import { MarketingCampaigns } from './dashboard/MarketingCampaigns';
import { EmployeeManagement } from './dashboard/EmployeeManagement';
import { PromotionsManager } from './dashboard/PromotionsManager';
import { GamificationDashboard } from './dashboard/GamificationDashboard';
import { InventoryDashboard } from './dashboard/InventoryDashboard';
import UserProfile from './dashboard/UserProfile';
import Marketing from './dashboard/Marketing';
import AiCreativeSuite from './dashboard/AiCreativeSuite';
import AiImageStudio from './dashboard/AiImageStudio';
import AiFittingRoom from './dashboard/AiFittingRoom';
import { Banners } from './dashboard/Banners';
import { Branches } from './dashboard/Branches';
import { Staff } from './dashboard/Staff';
import { IKPU } from './dashboard/IKPU';
import { Warehouse } from './dashboard/Warehouse';
import { PlatformSettings } from './dashboard/PlatformSettings';
import { PaymentSettings } from './dashboard/PaymentSettings';
import { DeliverySettings } from './dashboard/DeliverySettings';
import { TariffPlan } from './dashboard/TariffPlan';
import { Customers } from './dashboard/Customers';
import { StoreAIBuilder } from './dashboard/StoreAIBuilder';
import { DebtManagement } from './dashboard/DebtManagement';
import { useStoreWebSocket } from '../hooks/useStoreWebSocket';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DashboardProps {
  onLogout: () => void;
  onCreateStore: () => void;
  onBackToAdmin?: () => void;
  onViewStore?: (id: number) => void;
  managedStoreId?: number;
  initialTab?: string;
}

export function Dashboard({ onLogout, onCreateStore, onBackToAdmin, onViewStore, managedStoreId, initialTab }: DashboardProps) {
  const { t, language, setStores: setGlobalStores, currentStore: globalStore, setCurrentStore: setGlobalStore, ln } = useApp();
  const { user, logout } = useAuth();
  const { canInstall, install, isIOS, isInstalled } = usePWAInstall();
  const isSuperAdmin = user?.role === 'superadmin';

  const [stores, setStores] = useState<StoreType[]>([]);
  const [marketplaceStores, setMarketplaceStores] = useState<StoreType[]>([]);
  const [currentStore, setCurrentStore] = useState<StoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1280 : false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1280 : true);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // WebSocket for real-time updates
  const { status: wsStatus } = useStoreWebSocket(currentStore?.id || null, (event: any) => {
    if (event.type === 'store_updated') {
      if (currentStore && event.store_id === currentStore.id) {
        setCurrentStore(prev => ({ ...prev, ...event.data }));
      }
      loadStores();
    } else if (event.type === 'order_created') {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } else if (event.type === 'chat_event' && event.event === 'new_message' && activeTab !== 'support') {
      setUnreadMessages(prev => prev + 1);
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeResizeListener?.(handleResize) || window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (currentStore && (!globalStore || globalStore.id !== currentStore.id)) {
      setGlobalStore(currentStore);
    }
  }, [currentStore, globalStore, setGlobalStore]);

  const loadStores = async () => {
    setLoading(true);
    try {
      // Supabase-dan do'konlarni olish
      const response = await supabaseApi.stores.list();
      const storesArray = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setStores(storesArray as any);
      if (typeof setGlobalStores === 'function') setGlobalStores(storesArray as any);
      if (storesArray.length > 0 && !currentStore) setCurrentStore(storesArray[0] as any);
    } catch (error) {
      console.error('Failed to load stores from Supabase:', error);
    }
    setLoading(false);
  };

  const adminGroups = [
    {
      title: t('commerce'),
      tabs: [
        { id: 'overview', label: t('overview'), icon: LayoutDashboard },
        { id: 'orders', label: t('orders'), icon: ShoppingCart },
        { id: 'pos', label: t('posTerminal'), icon: CreditCard },
        { id: 'products', label: t('products'), icon: Package },
        { id: 'categories', label: t('categories'), icon: FolderOpen },
        { id: 'customers', label: t('customers'), icon: Users },
        { id: 'support', label: t('supportChat'), icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : undefined },
      ]
    },
    {
      title: t('inventoryTitle'),
      tabs: [
        { id: 'inventory', label: t('warehouseHub'), icon: Package },
        { id: 'ikpu', label: t('taxCodes'), icon: QrCode },
        { id: 'erp', label: t('erpUltimate'), icon: DollarSign },
        { id: 'debts', label: t('debtManagement'), icon: CreditCard },
      ]
    },
    {
      title: t('growthEngine'),
      tabs: [
        { id: 'marketing', label: t('marketingHub'), icon: Megaphone },
        { id: 'campaigns', label: t('aiCampaigns'), icon: Target },
        { id: 'promotions', label: t('flashDeals'), icon: Zap },
        { id: 'gamification', label: t('loyaltyQuests'), icon: Trophy },
        { id: 'discounts', label: t('vouchers'), icon: Tag },
        { id: 'banners', label: t('visualAds'), icon: Image },
      ]
    },
    {
      title: t('aiIntelligence'),
      tabs: [
        { id: 'ai-studio', label: t('aiStudio'), icon: Sparkles },
        { id: 'ai-creative', label: t('creativeSuite'), icon: Wand2 },
        { id: 'ai-builder', label: t('designBuilder'), icon: LayoutGrid },
        { id: 'ai-fitting-room', label: t('virtualFitting'), icon: Layers, hidden: currentStore?.business_type !== 'clothing' },
      ]
    },
    {
      title: t('infrastructure'),
      tabs: [
        { id: 'settings', label: t('settings'), icon: Settings },
        { id: 'employees', label: t('team'), icon: Users },
        { id: 'branches', label: t('branches'), icon: MapPin },
        { id: 'platforms', label: t('integration'), icon: Send },
        { id: 'tariff', label: t('tariff'), icon: Star },
      ]
    }
  ];

  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
        <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-xs">{t('syncingLinks')}</p>
      </div>
    );

    if (stores.length === 0) return (
      <div className="flex flex-col items-center justify-center py-40 px-6 text-center">
        <div className="w-24 h-24 rounded-[32px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-10">
           <Store size={48} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{t('noActiveStores')}</h2>
        <p className="text-slate-500 max-w-sm mb-12 font-medium">{t('createFirstHub')}</p>
        <button onClick={onCreateStore} className="h-16 px-12 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all">{t('createFirstStore')}</button>
      </div>
    );

    switch (activeTab) {
      case 'products': return <Products storeId={currentStore?.id} />;
      case 'orders': return <Orders storeId={currentStore?.id} />;
      case 'pos': return <POSInterface />;
      case 'erp': return <ERPDashboard />;
      case 'categories': return <Categories storeId={currentStore?.id} />;
      case 'qr': return <QRCodeManager storeId={currentStore?.id?.toString() || ''} />;
      case 'ai-studio': return <AIStudio store={currentStore} onTabChange={setActiveTab} />;
      case 'ai-creative': return <AiCreativeSuite storeId={currentStore?.id} />;
      case 'ai-builder': return <StoreAIBuilder storeId={currentStore?.id!} onReload={loadStores} />;
      case 'ai-fitting-room': return <AiFittingRoom storeId={currentStore?.id} />;
      case 'marketing': return <Marketing />;
      case 'campaigns': return <MarketingCampaigns />;
      case 'promotions': return <PromotionsManager />;
      case 'gamification': return <GamificationDashboard />;
      case 'support': return <StoreChatDashboard />;
      case 'settings': return <SettingsPage storeId={currentStore?.id} onUpdate={loadStores} />;
      case 'employees': return <EmployeeManagement storeId={currentStore?.id} />;
      case 'discounts': return <Discounts storeId={currentStore?.id} />;
      case 'banners': return <Banners />;
      case 'branches': return <Branches />;
      case 'ikpu': return <IKPU />;
      case 'inventory': return <InventoryDashboard />;
      case 'platforms': return <PlatformSettings />;
      case 'tariff': return <TariffPlan />;
      case 'customers': return <Customers />;
      case 'debts': return <DebtManagement />;
      default: return <Overview storeId={currentStore?.id} onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-200/40 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar Navigation - Ultra Premium White Glass */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 88 }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-slate-100 z-50 flex flex-col transition-all duration-500 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)]"
      >
        <div className="p-6 h-24 flex items-center justify-between border-b border-slate-50">
           <div className="flex items-center gap-3">
              <div 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-11 h-11 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-950/20 group cursor-pointer hover:scale-105 transition-all"
              >
                 <Zap size={20} className="group-hover:rotate-12 transition-transform" />
              </div>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                   <h1 className="text-xl font-black tracking-tight uppercase font-heading leading-none text-slate-950">Savdoon</h1>
                   <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] mt-1 block">Growth v4.0</span>
                </motion.div>
              )}
           </div>
        </div>

        {/* Store Selector - Redesigned for Light Mode */}
        {sidebarOpen && currentStore && (
          <div className="px-5 py-6">
             <button 
               onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
               className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-950 transition-all flex items-center gap-3 group relative overflow-hidden shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]"
             >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <Store size={18} className="transition-colors" />
                </div>
                <div className="flex-1 text-left min-w-0">
                   <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sector</p>
                   <p className="text-sm font-black text-slate-950 truncate uppercase tracking-tight">{ln(currentStore, 'name')}</p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${storeDropdownOpen ? 'rotate-180' : ''}`} />
             </button>
             
             <AnimatePresence>
                {storeDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-2 bg-white border-2 border-slate-100 rounded-3xl shadow-2xl overflow-hidden"
                  >
                    {stores.map(store => (
                      <button 
                        key={store.id} 
                        onClick={() => { setCurrentStore(store); setStoreDropdownOpen(false); }}
                        className="w-full p-4 rounded-2xl hover:bg-slate-50 flex items-center gap-4 transition-all"
                      >
                         <div className="w-8 h-8 rounded-lg bg-white shadow-sm overflow-hidden p-0.5 border border-slate-100">
                            {store.logo ? <img src={getMediaUrl(store.logo)} className="w-full h-full object-cover rounded-md" /> : <Store size={14} className="text-slate-400" />}
                         </div>
                         <span className="text-xs font-black text-slate-400 uppercase tracking-tight hover:text-slate-950">{ln(store, 'name')}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        )}

        {/* Navigation Matrix */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8 space-y-10">
           {adminGroups.map((group, idx) => (
             <div key={idx} className="space-y-3">
                {sidebarOpen && (
                  <div className="px-4 flex items-center gap-3">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">{group.title}</span>
                     <div className="flex-1 h-px bg-slate-50" />
                  </div>
                )}
                 <div className="space-y-1">
                   {group.tabs.filter(t => !t.hidden).map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => { setActiveTab(tab.id); if (isMobile) setSidebarOpen(false); }}
                       className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-300 relative group ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20' : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50/80 backdrop-blur-sm'}`}
                     >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-white/10' : 'group-hover:bg-slate-950/5'}`}>
                           <tab.icon size={sidebarOpen ? 18 : 20} className={`shrink-0 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                        </div>
                        {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>}
                        {activeTab === tab.id && (
                          <motion.div layoutId="navIndicator" className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                        )}
                        {tab.badge && sidebarOpen && (
                          <span className="absolute right-5 px-2 py-0.5 bg-rose-500 text-white text-[7px] font-black rounded-lg animate-pulse shadow-lg">{tab.badge}</span>
                        )}
                     </button>
                   ))}
                </div>
             </div>
           ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/20">
           <div className={`flex items-center gap-3 ${sidebarOpen ? 'p-3 rounded-2xl bg-white border border-slate-100 shadow-sm' : 'justify-center'}`}>
              <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSidebarOpen(!sidebarOpen)}>
                 {user?.first_name?.[0] || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-black text-slate-950 truncate uppercase tracking-tight">{user?.first_name || user?.username}</p>
                   <p className="text-[7px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">Admin</p>
                </div>
              )}
              {sidebarOpen && (
                <button onClick={handleLogout} className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center border border-transparent hover:border-rose-100">
                   <LogOut size={16} />
                </button>
              )}
           </div>
        </div>
      </motion.aside>

      {/* Main Content Hub */}
      <main 
        className="transition-all duration-500 min-h-screen pt-24 px-6 lg:px-12 relative z-10"
        style={{ marginLeft: isMobile ? 0 : (sidebarOpen ? 280 : 88) }}
      >
        {/* Global Control Bar */}
        <div className="fixed top-0 right-0 left-0 h-24 px-12 z-40 pointer-events-none flex items-center justify-end gap-5" style={{ left: isMobile ? 0 : (sidebarOpen ? 280 : 88) }}>
           <div className="pointer-events-auto flex items-center gap-3 p-2.5 bg-white/80 backdrop-blur-3xl border border-slate-50 rounded-2xl shadow-xl shadow-slate-200/40">
              <button 
                onClick={() => {
                  if (currentStore?.slug) {
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
                    const url = isLocal 
                      ? `${window.location.origin}/?store=${currentStore.slug}`
                      : `https://${currentStore.slug}.savdoon.uz`;
                    window.open(url, '_blank');
                  } else {
                    alert('Do\'kon manzili topilmadi');
                  }
                }}
                className="h-10 px-5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
              >
                 <Globe size={14} />
                 Do'konni ko'rish
              </button>
              <div className="w-px h-6 bg-slate-100 mx-1.5" />
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all cursor-pointer shadow-sm">
                 <Search size={18} />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all cursor-pointer relative shadow-sm">
                 <Bell size={18} />
                 <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </div>
              <div className="w-px h-6 bg-slate-100 mx-1.5" />
              <LanguageSwitcher />
              <div className="w-px h-6 bg-slate-100 mx-1.5" />
              <ThemeToggle />
           </div>
           
           <div className="pointer-events-auto flex items-center gap-3 p-2.5 bg-slate-950 rounded-2xl shadow-xl shadow-slate-950/20 px-6 h-[60px]">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
                 <Cpu size={16} className="animate-pulse" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-tight">{t('neuralStatus')}</span>
                 <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] leading-tight">{t('systemsNominal')}</span>
              </div>
           </div>
        </div>

        {/* Dynamic Page Rendering */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (currentStore?.id || '')}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[1600px] mx-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quick Access Floating Panel */}
      <div className="fixed bottom-10 right-10 z-[60] flex flex-col gap-4">
         <AnimatePresence>
            {showQuickActions && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="bg-white border-2 border-slate-100 rounded-[32px] p-6 shadow-2xl mb-4 w-72"
              >
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">{t('quickTerminal')}</h4>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'POS', icon: CreditCard, tab: 'pos' },
                      { label: 'Chat', icon: MessageSquare, tab: 'support' },
                      { label: 'AI', icon: Sparkles, tab: 'ai-studio' },
                      { label: 'New', icon: Plus, tab: 'products' }
                    ].map(action => (
                      <button 
                        key={action.label}
                        onClick={() => { setActiveTab(action.tab); setShowQuickActions(false); }}
                        className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-950 hover:text-white transition-all flex flex-col items-center gap-2"
                      >
                         <action.icon size={18} />
                         <span className="text-[8px] font-black uppercase tracking-widest">{action.label}</span>
                      </button>
                    ))}
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
         <motion.button 
           onClick={() => setShowQuickActions(!showQuickActions)}
           whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}
           className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-4 border-white backdrop-blur-xl transition-all shadow-2xl ${showQuickActions ? 'bg-indigo-600 text-white rotate-90' : 'bg-slate-950 text-white'}`}
         >
            {showQuickActions ? <X size={24} /> : <Terminal size={24} />}
         </motion.button>
      </div>
    </div>
  );
}