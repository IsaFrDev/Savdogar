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
  Layers
} from 'lucide-react';
import { useApp, Store as StoreType } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { storeApi } from '../services/api';
import { getMediaUrl } from '../utils/media';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { Overview } from './dashboard/Overview';
import { Products } from './dashboard/Products';
import { Orders } from './dashboard/Orders';
import { StoreChatDashboard } from './dashboard/StoreChatDashboard';
import { Categories } from './dashboard/Categories';
import { SettingsPage } from './dashboard/Settings';
import AIStudio from './dashboard/AiStudio';
import { Discounts } from './dashboard/Discounts';
import { WishlistPage } from './dashboard/Wishlist';
import { NotificationCenter } from '../components/NotificationCenter';
import { QRCodeManager } from '../components/QRCodeManager';
import { StoreStylist } from '../components/StoreStylist';
import UserProfile from './dashboard/UserProfile';
import { Marketing } from './dashboard/Marketing';
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
import { useStoreWebSocket } from '../hooks/useStoreWebSocket';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';

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
  const isCustomer = user?.role === 'customer';
  const isSuperAdmin = user?.role === 'superadmin';

  const [stores, setStores] = useState<StoreType[]>([]);
  const [marketplaceStores, setMarketplaceStores] = useState<StoreType[]>([]);
  const [currentStore, setCurrentStore] = useState<StoreType | null>(null);
  const [loading, setLoading] = useState(!isCustomer || !!initialTab);

  const [activeTab, setActiveTab] = useState<string>(initialTab || (isCustomer ? 'discover' : 'overview'));
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : true);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // WebSocket for real-time updates
  const { status: wsStatus, reconnect: reconnectWs } = useStoreWebSocket(currentStore?.id || null, (event: any) => {
    if (event.type === 'store_updated') {
      console.log('Store updated via WebSocket, refreshing...', event.data);
      // Update local state immediately if it's the current store
      if (currentStore && event.store_id === currentStore.id) {
        setCurrentStore(prev => ({ ...prev, ...event.data }));
      }
      // Reload all stores to keep everything in sync
      loadStores();
    } else if (event.type === 'chat_event' || (event.message && event.message.type === 'chat_event')) {
      // Handle real-time chat notifications
      const chatData = event.message || event;
      if (chatData.event === 'new_message' && activeTab !== 'support') {
        setUnreadMessages(prev => prev + 1);
      }
    }
  });

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isCustomer) {
      loadStores();
    }
    loadMarketplace();
  }, [isCustomer]);

  // Sync with global context
  useEffect(() => {
    if (currentStore && (!globalStore || globalStore.id !== currentStore.id)) {
      setGlobalStore(currentStore);
    }
  }, [currentStore, globalStore, setGlobalStore]);

  // Handle initial tab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'support') {
      setUnreadMessages(0);
    }
  }, [activeTab]);

  const loadMarketplace = async () => {
    try {
      const response = await storeApi.getMarketplace();
      const sorted = response.data.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      setMarketplaceStores(sorted);
    } catch (error) {
      console.error('Failed to load marketplace stores:', error);
    }
  };

  const loadNearbyStores = async () => {
    if (!navigator.geolocation) {
      alert(language === 'uz' ? "Sizning brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi" : "Your browser doesn't support geolocation");
      return;
    }

    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await storeApi.getNearby(latitude, longitude);
          setNearbyStores(response.data);
          setShowNearby(true);
        } catch (error) {
          console.error('Failed to load nearby stores:', error);
          alert(language === 'uz' ? "Yaqin do'konlarni yuklashda xatolik" : "Failed to load nearby stores");
        }
        setNearbyLoading(false);
      },
      (error) => {
        setNearbyLoading(false);
        console.error('Geolocation error:', error);
        alert(language === 'uz' ? "Joylashuvingizni aniqlab bo'lmadi" : "Could not determine your location");
      }
    );
  };

  const loadStores = async () => {
    setLoading(true);
    try {
      if (managedStoreId && isSuperAdmin) {
        // Superadmin impersonating a specific store
        const response = await storeApi.get(managedStoreId);
        const storeData = response.data;
        setStores([storeData]);
        setCurrentStore(storeData);
        if (typeof setGlobalStores === 'function') {
           setGlobalStores([storeData]);
        }
      } else {
        const response = await storeApi.list();
        setStores(response.data);
        if (typeof setGlobalStores === 'function') {
          setGlobalStores(response.data);
        }
        if (response.data.length > 0) {
          if (!currentStore) {
            setCurrentStore(response.data[0]);
          } else {
            // Refresh the current store data if it's already selected
            const updated = response.data.find((s: any) => s.id === currentStore.id);
            if (updated) {
              setCurrentStore(updated);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
    setLoading(false);
  };

  const adminGroups = [
    {
      title: t('sales') || 'Savdo',
      tabs: [
        { id: 'overview', label: t('overview'), icon: LayoutDashboard },
        { id: 'orders', label: t('orders'), icon: ShoppingCart },
        { id: 'products', label: t('products'), icon: Package },
        { id: 'categories', label: t('categories') || 'Kategoriyalar', icon: FolderOpen },
        { id: 'customers', label: t('customers') || 'Mijozlar', icon: Star },
        { id: 'support', label: t('support') || 'Chat', icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : undefined },
      ]
    },
    {
      title: t('inventory') || 'Omborxona',
      tabs: [
        { id: 'warehouse', label: t('warehouse') || 'Ombor', icon: Store },
        { id: 'ikpu', label: 'IKPU', icon: QrCode },
      ]
    },
    {
      title: t('marketing') || 'Marketing',
      tabs: [
        { id: 'marketing', label: t('marketing'), icon: Send },
        { id: 'discounts', label: t('discounts'), icon: Tag },
        { id: 'banners', label: t('banners') || 'Bannerlar', icon: Image },
      ]
    },
    {
      title: t('aiTools') || 'AI Imkoniyatlar',
      tabs: [
        { id: 'ai-studio', label: t('aiStudio') || 'AI Studio', icon: Sparkles },
        { id: 'ai-creative', label: t('aiCreative') || 'AI Creative', icon: Wand2 },
        { id: 'ai-stylist', label: t('aiStylist') || 'AI Stylist', icon: Wand2 },
        { id: 'ai-image-studio', label: t('aiImageStudio') || 'AI Image Studio', icon: Image },
        {
          id: 'ai-fitting-room',
          label: t('aiFittingRoom') || 'Virtual Fitting Room',
          icon: Layers,
          hidden: currentStore?.business_type !== 'clothing'
        },
      ]
    },
    {
      title: t('settings') || 'Sozlamalar',
      tabs: [
        { id: 'settings', label: t('settings'), icon: Settings },
        { id: 'branches', label: t('branches') || 'Filiallar', icon: MapPin },
        { id: 'staff', label: t('staff') || 'Xodimlar', icon: ShieldCheck },
        { id: 'payments', label: t('payments') || 'To\'lovlar', icon: ShoppingCart },
        { id: 'delivery', label: t('delivery') || 'Yetkazib berish', icon: Package },
        { id: 'platforms', label: t('platforms') || 'Platformalar', icon: Send },
        { id: 'tariff', label: t('tariff') || 'Tarif', icon: Star },
      ]
    }
  ] as { title: string; tabs: { id: string; label: string; icon: any; badge?: any; hidden?: boolean }[] }[];

  const customerTabs = [
    { id: 'discover', label: t('discoverStores') || 'Discover', icon: Store },
    { id: 'wishlist', label: t('wishlist'), icon: Heart },
    { id: 'my-orders', label: t('myOrders') || 'My Orders', icon: ShoppingCart },
    { id: 'profile', label: t('profileTitle') || 'Profile', icon: Settings },
  ];

  const showAdminTabs = !isCustomer && (!isSuperAdmin || stores.length > 0);
  
  const getTabs = () => {
    if (isCustomer) return customerTabs;
    if (isSuperAdmin && !showAdminTabs) return customerTabs;
    
    // For admin, we flatten the groups for the tab selection logic
    const allAdminTabs = adminGroups.flatMap(group => group.tabs);
    if (isSuperAdmin && showAdminTabs) {
        return [...customerTabs, { id: 'divider', label: '', icon: () => null, disabled: true }, ...allAdminTabs];
    }
    return allAdminTabs;
  };

  const tabs = getTabs();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest">{t('loading') || 'Yuklanmoqda...'}</p>
        </div>
      );
    }

    const customerTabIds = ['discover', 'wishlist', 'my-orders', 'profile'];
    if (isCustomer || customerTabIds.includes(activeTab)) {
      switch (activeTab) {
        case 'discover':
          return (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-2 uppercase">
                    {t('discoverStores')}
                  </h1>
                  <p className="text-[var(--text-dim)] font-medium tracking-wide">
                    {t('discoverStoresSubtitle')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (showNearby) setShowNearby(false);
                      else loadNearbyStores();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showNearby ? 'bg-[var(--brand-primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--brand-primary-glow)]' : 'bg-[var(--brand-primary)]/5 border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-[var(--brand-primary)]/10'
                      }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {nearbyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (showNearby ? t('all') : t('nearby'))}
                  </button>
                  <div className="px-4 py-2 bg-[var(--brand-primary)]/5 border border-[var(--glass-border)] rounded-xl text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]">
                    {t('storesAvailable', { count: (showNearby ? nearbyStores : marketplaceStores).length })}
                  </div>
                </div>
              </div>

              {(showNearby ? nearbyStores : marketplaceStores).length === 0 ? (
                <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-3xl border border-[var(--glass-border)]">
                  <Store className="w-16 h-16 text-[var(--text-dim)] mx-auto mb-6 opacity-20" />
                  <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest">
                    {showNearby
                      ? t('noNearbyStores')
                      : t('noOpenStores')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(showNearby ? nearbyStores : marketplaceStores).map((store, index) => (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewStore?.(store.id);
                      }}
                      className="group glass-card rounded-3xl overflow-hidden border-[var(--glass-border)] hover:border-[var(--brand-primary)] transition-all shadow-2xl hover:shadow-[var(--brand-primary-glow)] cursor-pointer relative z-0"
                    >
                      <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 relative">
                        {store.logo ? (
                          <img src={getMediaUrl(store.logo) || undefined} alt={store.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="w-12 h-12 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                          </div>
                        )}
                        {index < 3 && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                            Top Store
                          </div>
                        )}
                        {store.status && store.status !== 'approved' && (
                          <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg z-10">
                            {language === 'uz' ? 'Tekshirilmoqda' : 'Under Review'}
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-[var(--text-main)] truncate group-hover:text-[var(--brand-primary)] transition-colors uppercase tracking-tight">
                              {ln(store, 'name')}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="text-xs font-black">{store.rating || '5.0'}</span>
                              </div>
                              <span className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-widest">
                                ({store.rating_count || 0} reviews)
                              </span>
                            </div>
                          </div>


                          {onViewStore && (
                            <button
                              onClick={() => onViewStore(store.id)}
                              className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-toq,var(--brand-primary))] text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[var(--brand-primary-glow)]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}
                        </div>

                        <p className="text-[var(--text-dim)] text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                          {ln(store, 'description') || (language === 'ru' ? "Информация об этом магазине еще не добавлена." : language === 'uz' ? "Ushbu do'kon haqida ma'lumot hali qo'shilmagan." : "No description available for this store.")}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--brand-primary)]/5 border border-[var(--glass-border)]">
                            <Package className="w-3 h-3 text-[var(--brand-primary)]" />
                            <span>{store.business_type}</span>
                          </div>
                          {store.pickup_address && (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-[var(--brand-secondary)]" />
                              <span className="truncate">{store.pickup_address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        case 'my-orders':
          return (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">{t('myOrders') || 'Mening Buyurtmalarim'}</h1>
              </div>
              <div className="glass-card rounded-3xl p-20 text-center border-[var(--glass-border)] shadow-xl bg-[var(--color-surface-raised)] border-dashed">
                <Package className="w-16 h-16 text-[var(--text-dim)] mx-auto mb-6 opacity-20" />
                <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-sm">
                  {language === 'uz' ? "Sizda hali buyurtmalar yo'q" : language === 'ru' ? "U vas poka net zakazov" : "You don't have any orders yet"}
                </p>
              </div>
            </div>
          );
        case 'wishlist':
          return <WishlistPage />;
        case 'profile':
          return <UserProfile />;
        default:
          return null;
      }
    }

    if (stores.length === 0) {
      return (
        <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-[2.5rem] border border-[var(--glass-border)]">
          <Store className="w-16 h-16 text-[var(--text-dim)] mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-black text-[var(--text-main)] mb-2 tracking-tight uppercase">{t('noStoreFound') || "Do'kon topilmadi"}</h2>
          <p className="text-[var(--text-dim)] mb-8 font-medium">
            {language === 'uz' ? 'Sotishni boshlash uchun birinchi do\'koningizni yarating.' : 'Create your first store to start selling.'}
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onCreateStore}
              className="px-8 py-3 bg-[var(--brand-primary)] text-[var(--primary-foreground)] rounded-xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[var(--brand-primary-glow)] active:scale-95 leading-none h-12"
            >
              {t('createStore')}
            </button>
            {user?.role === 'superadmin' && onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-6 py-2 text-[var(--brand-primary)] hover:brightness-125 transition-colors font-bold text-xs uppercase tracking-widest"
              >
                ← {t('backToAdmin')}
              </button>
            )}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'products': return <Products storeId={currentStore?.id} />;
      case 'orders': return <Orders storeId={currentStore?.id} />;
      case 'categories': return <Categories storeId={currentStore?.id} />;
      case 'qr': return <QRCodeManager storeId={currentStore?.id?.toString() || ''} />;
      case 'ai-studio': return <AIStudio store={currentStore} onTabChange={setActiveTab} />;
      case 'ai-creative': return <AiCreativeSuite storeId={currentStore?.id} />;
      case 'ai-image-studio': return <AiImageStudio />;
      case 'ai-fitting-room': return <AiFittingRoom storeId={currentStore?.id} />;
      case 'marketing': return <Marketing />;
      case 'support': return <StoreChatDashboard />;
      case 'ai-stylist': return (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface-raised)] rounded-3xl border border-[var(--glass-border)]">
            <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-4 uppercase text-center">
              {t('aiStylist')}
            </h1>
            <p className="text-[var(--text-dim)] font-medium tracking-wide mb-8 text-center max-w-md">
              {language === 'uz' ? "Do'koningiz ko'rinishini sun'iy intellekt yordamida yangilang. Logotipni yuklang va aqlli dizaynni qo'llang." : "Revamp your store appearance with AI. Upload your logo and apply smart designs."}
            </p>
            <StoreStylist
              currentLogo={currentStore?.logo}
              currentPrimary={currentStore?.primary_color || '#FFCE29'}
              currentSecondary={currentStore?.secondary_color || '#1C3B65'}
              onApply={async (primary, secondary, themeConfig, logoFile) => {
                if (currentStore?.id) {
                  try {
                    const formData = new FormData();
                    formData.append('primary_color', primary);
                    formData.append('secondary_color', secondary);
                    formData.append('theme_config', JSON.stringify(themeConfig));
                    if (logoFile) {
                      formData.append('logo', logoFile);
                    }

                    await storeApi.update(currentStore.id, formData);
                    await loadStores();
                    alert(t('saveSuccess'));
                  } catch (error) {
                    console.error('Failed to update stylist:', error);
                  }
                }
              }}
              language={language}
            />
          </div>
        </div>
      );
      case 'settings': return (
        <SettingsPage storeId={currentStore?.id} onUpdate={loadStores} />
      );
      case 'discounts': return <Discounts storeId={currentStore?.id} />;
      case 'banners': return <Banners />;
      case 'branches': return <Branches />;
      case 'staff': return <Staff />;
      case 'ikpu': return <IKPU />;
      case 'warehouse': return <Warehouse />;
      case 'platforms': return <PlatformSettings />;
      case 'payments': return <PaymentSettings />;
      case 'delivery': return <DeliverySettings />;
      case 'tariff': return <TariffPlan />;
      case 'customers': return <Customers />;
      default: return <Overview storeId={currentStore?.id} />;
    }
  };

  return (
    <div className="min-h-screen relative text-[var(--text-primary)] transition-colors duration-500 overflow-x-hidden font-body" style={{ fontFamily: 'var(--font-family)' }}>
      {/* Visual Depth Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-[var(--brand-primary-glow)] blur-[120px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[var(--brand-primary-glow)] blur-[120px] rounded-full opacity-30" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 280 : (sidebarOpen ? 280 : 88),
          x: isMobile ? (sidebarOpen ? 0 : -280) : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full bg-[var(--bg-sidebar)] backdrop-blur-3xl border-r border-[var(--glass-border)] z-50 overflow-hidden flex flex-col shadow-2xl"
        style={{ borderRadius: sidebarOpen ? '0' : '0 var(--border-radius) var(--border-radius) 0' }}
      >
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between gap-4 h-24 border-b border-[var(--color-border)]">
            <button
              onClick={() => setActiveTab(isCustomer ? 'discover' : 'overview')}
              className="flex items-center gap-4 hover:opacity-80 transition-all outline-none group"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-1">
                {currentStore?.logo ? (
                  <img
                    src={getMediaUrl(currentStore.logo) || undefined}
                    alt={currentStore.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <img
                    src="/savdoon-logo.jpg"
                    alt="Savdoon Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                )}
              </div>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-black text-2xl tracking-tight text-[var(--text-primary)] uppercase font-heading truncate"
                >
                  {ln(currentStore, 'name') || 'Savdoon'}
                </motion.span>
              )}
            </button>
            {sidebarOpen && isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden">
                <X className="w-6 h-6" />
              </button>
            )}

            {/* WebSocket Refresh Button */}
            <button
              onClick={() => {
                reconnectWs();
                // Simple feedback: a quick flash or rotation is already handled by CSS if we add it
              }}
              className={`p-2.5 rounded-xl border border-[var(--glass-border)] transition-all flex items-center justify-center group ${wsStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' :
                wsStatus === 'connecting' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                  'bg-rose-500/10 text-rose-500 animate-bounce'
                }`}
              title={wsStatus === 'connected' ? 'Connected (Click to refresh)' : 'Disconnected (Click to reconnect)'}
            >
              <Sparkles className={`w-4 h-4 transition-transform group-active:rotate-180 duration-500`} />
            </button>
          </div>

          {/* Store Selector (Admin) */}
          <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scrollbar-hide">
            {sidebarOpen && !isCustomer && currentStore && (
              <div className="px-2">
                <div className="relative group">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                      className="flex-1 p-4 rounded-[1.75rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] hover:border-[var(--brand-primary)]/40 backdrop-blur-2xl transition-all duration-300 flex items-center gap-4 group/store shadow-xl overflow-hidden relative h-[72px]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 to-transparent opacity-0 group-hover/store:opacity-100 transition-opacity" />
                      <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden p-1.5 shadow-xl ring-1 ring-white/10 relative z-10 transition-transform group-hover/store:scale-105 flex-shrink-0">
                        {currentStore.logo ? (
                          <img src={getMediaUrl(currentStore.logo) || undefined} alt={currentStore.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center rounded-xl">
                            <Store className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0 relative z-10 py-1">
                        <p className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-[0.25em] leading-tight mb-1 opacity-80 group-hover/store:opacity-100 transition-opacity">
                          Active<br />Store
                        </p>
                        <p className="text-[15px] font-black text-[var(--text-primary)] truncate leading-none tracking-tight">{ln(currentStore, 'name')}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-all duration-300 group-hover/store:text-[var(--brand-primary)] relative z-10 flex-shrink-0 ${storeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {storeDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setStoreDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute left-0 right-0 mt-3 bg-[var(--color-surface-raised)] backdrop-blur-2xl rounded-2xl border border-[var(--color-border-bright)] overflow-hidden z-50 p-2 shadow-2xl ring-1 ring-white/10"
                        >
                          {stores.map((store) => (
                            <button
                              key={store.id}
                              onClick={() => {
                                setCurrentStore(store);
                                setStoreDropdownOpen(false);
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left rounded-xl transition-all flex items-center gap-4 ${currentStore.id === store.id ? 'bg-[var(--brand-primary-glow)] text-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--text-primary)]'
                                }`}

                            >
                              {store.logo ? (
                                <img src={getMediaUrl(store.logo) || undefined} alt={store.name} className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <Store className="w-4 h-4" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold block truncate">{ln(store, 'name')}</span>
                                <span className="text-[9px] opacity-60 block truncate uppercase tracking-widest font-black">{store.status}</span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Navigation Sections */}
            <nav className="flex-1 py-4 overflow-y-auto no-scrollbar space-y-4">
              {(isCustomer || (isSuperAdmin && !showAdminTabs)) ? (
                customerTabs.map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                        setActiveTab(tab.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${activeTab === tab.id
                        ? 'bg-[var(--brand-primary-glow)] text-[var(--brand-primary)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--color-border)]'
                        }`}
                  >
                    <tab.icon className={`w-6 h-6 flex-shrink-0 transition-all ${activeTab === tab.id ? 'text-[var(--brand-primary)] scale-110' : 'group-hover:text-[var(--brand-primary)]'}`} />
                    {sidebarOpen && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] font-bold tracking-tight">
                            {tab.label}
                        </motion.span>
                    )}
                  </button>
                ))
              ) : (
                adminGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-1">
                        {sidebarOpen && (
                            <div className="px-6 py-2">
                                <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-60">
                                    {group.title}
                                </h3>
                            </div>
                        )}
                        {group.tabs.filter(tab => !tab.hidden).map((tab: any) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${activeTab === tab.id
                                    ? 'bg-[var(--brand-primary-glow)] text-[var(--brand-primary)] shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--color-border)]'
                                    }`}
                            >
                                <tab.icon className={`w-6 h-6 flex-shrink-0 transition-all ${activeTab === tab.id ? 'text-[var(--brand-primary)] scale-110' : 'group-hover:text-[var(--brand-primary)]'}`} />
                                {sidebarOpen && (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] font-bold tracking-tight">
                                        {tab.label}
                                    </motion.span>
                                )}
                                {tab.badge !== undefined && sidebarOpen && (
                                    <span className="absolute right-4 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <motion.div layoutId="activeTabGlow" className="absolute left-0 w-1.5 h-8 bg-[var(--brand-primary)] rounded-r-full shadow-[0_0_15px_var(--brand-primary-glow)]" />
                                )}
                            </button>
                        ))}
                    </div>
                ))
              )}
            </nav>

            {onBackToAdmin && (
              <div className="px-4 py-4 mt-auto border-t border-[var(--color-border)]">
                <button
                  onClick={onBackToAdmin}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-600/10 text-amber-600 hover:from-amber-500 hover:to-orange-600 hover:text-white transition-all duration-300 group shadow-sm border border-amber-500/20"
                >
                  <ShieldCheck className="w-6 h-6 flex-shrink-0 group-hover:rotate-12 transition-transform" />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[12px] font-black uppercase tracking-widest"
                    >
                      Admin Panel
                    </motion.span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* PWA Install Button */}
          {canInstall && (
            <div className="px-6 py-4">
              <button
                onClick={install}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white shadow-xl shadow-[var(--brand-primary-glow)] hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                   <Download className="w-5 h-5 text-white animate-bounce" />
                </div>
                {sidebarOpen && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-tight opacity-80">
                      App
                    </p>
                    <p className="text-sm font-black truncate leading-tight">
                      Install Now
                    </p>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* iOS Install Prompt */}
          {isIOS && !isInstalled && (
            <div className="px-6 py-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                 iOS: Add to Home Screen
              </div>
            </div>
          )}

          {/* User Menu Overhaul */}
          <div className="p-6 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-black shadow-lg shadow-[var(--brand-primary-glow)] flex-shrink-0 text-xl overflow-hidden ring-2 ring-white/10">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-black text-[var(--text-primary)] truncate">
                    {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                  </p>
                  <p className="text-[9px] text-[var(--brand-primary)] truncate uppercase tracking-[0.2em] font-black mt-1 opacity-80">
                    {(user?.role === 'superadmin' || user?.is_superuser) ? t('superadminRole') : user?.role === 'store_admin' ? t('storeAdminRole') : t('customerRole')}
                  </p>
                </div>
              )}
              {sidebarOpen && (
                <div className="flex flex-col gap-1">
                  {onBackToAdmin && user?.role === 'superadmin' && (
                    <button
                      onClick={onBackToAdmin}
                      className="p-2.5 hover:bg-[var(--brand-primary-glow)] rounded-xl transition-all group/admin"
                      title={t('backToAdmin')}
                    >
                      <ShieldCheck className="w-5 h-5 text-[var(--brand-primary)] group-hover/admin:scale-110 transition-all" />
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2.5 hover:bg-rose-500/10 rounded-xl transition-all group/logout"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 text-[var(--text-muted)] group-hover/logout:text-rose-500 group-hover/logout:rotate-12 transition-all" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-500 min-h-screen ml-0 ${sidebarOpen && !isMobile ? 'lg:ml-[280px]' : (!isMobile ? 'lg:ml-[88px]' : '')
          }`}
      >
        <header className="sticky top-0 z-30 bg-[var(--bg-header)] backdrop-blur-2xl border-b border-[var(--glass-border)] h-16 lg:h-24">
          <div className="flex items-center justify-between px-4 lg:px-12 h-full gap-3 lg:gap-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-3 rounded-2xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-[var(--color-border)] shadow-sm"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="w-px h-8 bg-[var(--color-border)] hidden sm:block" />

              <div className="flex flex-col">
                <h2 className="text-base lg:text-xl font-black text-[var(--text-primary)] tracking-tight font-heading uppercase truncate max-w-[150px] sm:max-w-none">
                  {tabs.find(t => t.id === activeTab)?.label || 'Savdoon'}
                </h2>
                <div className="hidden sm:flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">System Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-6">
              {!isCustomer && currentStore && (
                <button
                  onClick={() => onViewStore?.(currentStore.id)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[var(--brand-primary)] hover:text-white border border-[var(--brand-primary)]/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{t('viewStorefront') || 'View Store'}</span>
                </button>
              )}
              {onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 group border-none"
                >
                  <ShieldCheck className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </button>
              )}
              <div className="hidden sm:flex items-center gap-3">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <div className="hidden sm:block w-px h-8 bg-[var(--color-border)]" />
              <NotificationCenter />
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}