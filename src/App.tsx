import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import AuthProvider, { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StoreWizard } from './pages/StoreWizard';
import { StorePendingApproval } from './components/StorePendingApproval';

import { Dashboard } from './pages/Dashboard';
import AiBusinessIntelligence from './pages/dashboard/AiBusinessIntelligence';

import { Storefront } from './pages/Storefront';
import { AdminLogin } from './pages/AdminLogin';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { storeApi } from './services/api';
import { useApp } from './context/AppContext';
import { Button } from './components/Button';
import { ShieldAlert, Clock, Hammer } from 'lucide-react';
import { motion } from 'framer-motion';
import RejectionModal from './components/RejectionModal';


type Page = 'login' | 'register' | 'wizard' | 'pending-approval' | 'dashboard' | 'storefront' | 'admin-login' | 'super-admin' | 'ai-intel';

function AppContent() {
  const { isLoading, isAuthenticated, isSuperAdmin, user, logout } = useAuth();
  const { maintenanceMode, t } = useApp();
  const [page, setPage] = useState<Page>(() => {
    const saved = sessionStorage.getItem('last_page');
    return (saved as Page) || 'login';
  });
  const [storeId, setStoreId] = useState<number | undefined>(() => {
    const saved = sessionStorage.getItem('last_store_id');
    return saved ? parseInt(saved) : undefined;
  });
  const [isPendingStore, setIsPendingStore] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [pendingStoreName, setPendingStoreName] = useState('');
  const [dashboardTab, setDashboardTab] = useState<string | undefined>(undefined);

  // Sync page and storeId to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('last_page', page);
    if (storeId) {
      sessionStorage.setItem('last_store_id', storeId.toString());
    } else {
      sessionStorage.removeItem('last_store_id');
    }
  }, [page, storeId]);

  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(error => {
            console.log('SW registration failed: ', error);
          });
      });
    }
  }, []);

  // Check URL for subdomain or special paths
  useEffect(() => {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;

    if (pathname.includes('/adminka') || pathname === '/admin') {
      setPage('admin-login');
      window.history.replaceState({}, '', '/');
      return;
    }

    if (pathname.includes('/wizard')) {
      setPage('wizard');
      window.history.replaceState({}, '', '/');
      return;
    }

    const checkSubdomain = async () => {
      // 1. Check for explicit store slug in query params (useful for dev/testing)
      const queryParams = new URLSearchParams(window.location.search);
      const forcedSlug = queryParams.get('store');
      const isHardRefresh = (window.performance?.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "reload";

      let storeSlug = forcedSlug;

      if (!storeSlug) {
        // 2. Detect IP addresses (e.g., 192.168.x.x) and ignore them
        const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
        if (isIP || hostname === 'localhost') {
           // On main domain, ensure storeState is clean
           if (!page) {
             setStoreId(undefined);
             sessionStorage.removeItem('last_store_id');
           }
           return;
        }

        // 3. Normal subdomain logic
        const parts = hostname.split('.');
        // For subdomains (e.g., shop.bozorchi.local or shop.bozorchi-ai.vercel.app)
        if (parts.length >= 3 && !hostname.includes('ngrok-free.app') && !hostname.includes('vercel.app')) {
          storeSlug = parts[0];
          if (storeSlug === 'www' || storeSlug === 'admin') storeSlug = null;
        }
      }

      if (storeSlug) {
        try {
          const response = await storeApi.getBySlug(storeSlug);
          if (response.data.is_pending_or_rejected) {
            setIsPendingStore(true);
            setPendingStoreName(response.data.name);
            setPage('storefront');
          } else if (response.data.maintenance_mode) {
            setIsMaintenanceMode(true);
            setPendingStoreName(response.data.name);
            setPage('storefront');
          } else {
            setStoreId(response.data.id);
            setPage('storefront');
            setIsPendingStore(false);
            setIsMaintenanceMode(false);
          }
        } catch (error: any) {
          console.error('Subdomain check failed:', error);
          if (forcedSlug) setPage('login');
        }
      } else {
        // No store slug - ensure we are not "stuck" in storefront page by saved state
        if (page === 'storefront') {
          setPage('login');
          setStoreId(undefined);
          sessionStorage.removeItem('last_store_id');
        }
        
        // Force SW update check on refresh if we are on main domain
        if (isHardRefresh && 'serviceWorker' in navigator) {
           navigator.serviceWorker.getRegistrations().then(regs => {
             for(let reg of regs) reg.update();
           });
        }
      }
    };

    checkSubdomain();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Only redirect if we are on a landing/auth page, not if we are browsing the marketplace
      const authPages: Page[] = ['login', 'register', 'admin-login'];
      const onAuthPage = authPages.includes(page);

      if (onAuthPage) {
        if (isSuperAdmin) {
          setPage('super-admin');
        } else {
          setPage('dashboard');
        }
      }
    }
  }, [isAuthenticated, isSuperAdmin, user, isLoading, page]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl font-bold text-[var(--primary-foreground)]">S</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto" />
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setPage('login');
  };



  if (maintenanceMode && !isSuperAdmin && page !== 'admin-login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--brand-primary)]/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--brand-secondary)]/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center relative z-10"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)]/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <Hammer className="w-10 h-10 text-[var(--brand-primary)] animate-bounce" />
          </div>

          <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter">
            Texnik Ishlar
          </h1>

          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
            Tizimda yangilanishlar amalga oshirilmoqda. Iltimos, birozdan so'ng qaytib kiring.
          </p>

          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 text-left">
              <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Kutilayotgan davomiylik</p>
                <p className="text-sm font-bold text-white">Taxminan 30-60 daqiqa</p>
              </div>
            </div>

            <button
              onClick={() => setPage('admin-login')}
              className="mt-6 py-4 px-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 group"
            >
              <ShieldAlert className="w-4 h-4 text-[var(--brand-primary)] group-hover:scale-110 transition-transform" />
              Admin sifatida kirish
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  if (isMaintenanceMode && page === 'storefront') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center relative z-10"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative group">
            <Hammer className="w-10 h-10 text-amber-500" />
          </div>

          <h1 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase">
            {pendingStoreName}
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Ta'mirlash Ishlari
          </div>

          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 text-balance">
            Ushbu do'kon vaqtincha yopiq. Tez orada qaytamiz!
          </p>

          <Button
            variant="outline"
            onClick={() => {
              window.location.href = window.location.origin;
            }}
            className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-white font-bold"
          >
            {t('goBack')}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isPendingStore && page === 'storefront') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--brand-primary)]/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--brand-secondary)]/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center relative z-10"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)]/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <Clock className="w-10 h-10 text-[var(--brand-primary)]" />
          </div>

          <h1 className="text-4xl font-black text-white mb-6 tracking-tighter">
            {pendingStoreName}
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-sm font-bold mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
            {t('pendingApprovalTitle')}
          </div>

          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 text-balance">
            {t('pendingApprovalMsg')}
          </p>

          <Button
            variant="outline"
            onClick={() => setPage('login')}
            className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-white font-bold"
          >
            {t('goBack')}
          </Button>
        </motion.div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'login':
        return (
          <Login
            onLogin={() => setPage('dashboard')}
            onRegister={() => setPage('register')}
          />
        );
      case 'register':
        return (
          <Register
            onSuccess={() => {
              if (user?.role === 'store_admin') {
                setPage('wizard');
              } else {
                setPage('dashboard');
              }
            }}
            onLogin={() => setPage('login')}
          />
        );
      case 'wizard':
        return (
          <StoreWizard
            onComplete={(storeId: number, _storeName: string) => {
              setStoreId(storeId);
              setIsPendingStore(false);
              setDashboardTab('overview');
              setPage('dashboard');
            }}
          />
        );
      case 'pending-approval':
        return (
          <StorePendingApproval
            storeName={pendingStoreName}
            storeStatus="pending"
            onRetry={() => setPage('wizard')}
          />
        );
      case 'ai-intel':
        return <AiBusinessIntelligence />;
      case 'dashboard':
        return (
          <Dashboard
            onLogout={handleLogout}
            onCreateStore={() => setPage('wizard')}
            onBackToAdmin={user?.role === 'superadmin' ? () => setPage('super-admin') : undefined}
            onViewStore={(id) => {
              setStoreId(id);
              setPage('storefront');
            }}
            managedStoreId={storeId}
            initialTab={dashboardTab}
          />
        );
      case 'storefront':
        return (
          <Storefront
            storeId={storeId}
            onBack={() => setPage('dashboard')}
            onBackToAdmin={user?.role === 'superadmin' ? () => setPage('super-admin') : undefined}
          />
        );
      case 'admin-login':
        return (
          <AdminLogin
            onLogin={() => setPage('super-admin')}
            onBack={() => setPage('login')}
          />
        );

      case 'super-admin':
        return (
          <SuperAdminDashboard
            onLogout={handleLogout}
            onCreateStore={() => {
              setStoreId(undefined); // Clear store context just in case
              setPage('wizard');
            }}
            onSwitchToUserView={() => {
              setDashboardTab('discover');
              setPage('dashboard');
            }}
            onManageStore={(id) => {
              setStoreId(id);
              setPage('dashboard');
            }}
          />
        );
      default:
        return (
          <Login
            onLogin={() => setPage('dashboard')}
            onRegister={() => setPage('register')}
          />
        );
    }
  };

  return (
    <div className="relative">
      {renderPage()}
      <RejectionModal />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
