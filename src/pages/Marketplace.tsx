import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  MapPin, 
  Star, 
  Search, 
  LogIn, 
  UserPlus,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useApp, Store as StoreType } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabaseApi } from '../services/supabaseService';
import { getMediaUrl } from '../utils/media';
import { Button } from '../components/Button';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

interface MarketplaceProps {
  onLogin: () => void;
  onRegister: () => void;
  onDashboard: () => void;
  onViewStore: (id: number) => void;
}

export function Marketplace({ onLogin, onRegister, onDashboard, onViewStore }: MarketplaceProps) {
  const { t, ln } = useApp();
  const { isAuthenticated } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNearby, setShowNearby] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<StoreType[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const response = await supabaseApi.stores.getMarketplace();
      // Safely get data as array
      const storesData = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      // Sort by rating or newest
      const sorted = storesData.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      setStores(sorted);
    } catch (error) {
      console.error('Failed to load marketplace stores:', error);
    }
    setLoading(false);
  };

  const loadNearbyStores = async () => {
    if (!navigator.geolocation) return;
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await supabaseApi.stores.getNearby(latitude, longitude);
          setNearbyStores(response.data);
          setShowNearby(true);
        } catch (error) {
          console.error('Failed to load nearby stores:', error);
        }
        setNearbyLoading(false);
      },
      () => setNearbyLoading(false)
    );
  };

  const filteredStores = (showNearby ? nearbyStores : stores).filter(store => 
    ln(store, 'name').toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.business_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--text-main)] transition-colors duration-500 overflow-x-hidden font-body relative">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-[var(--brand-primary-glow)] blur-[140px] rounded-full opacity-20 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-[var(--brand-secondary-glow,var(--brand-primary-glow))] blur-[140px] rounded-full opacity-10" />
      </div>

      {/* Persistent Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-[var(--bg-sidebar)]/80 backdrop-blur-xl border-b border-[var(--glass-border)] flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-lg shadow-[var(--brand-primary-glow)]">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <span className="text-2xl font-black text-[var(--text-main)] tracking-tighter uppercase hidden sm:block">
            Savdoon<span className="text-[var(--brand-primary)]">.</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center mr-4">
            <ThemeToggle />
            <div className="w-px h-6 bg-[var(--glass-border)] mx-4" />
            <LanguageSwitcher />
          </div>
          
          {!isAuthenticated ? (
            <>
              <Button 
                variant="ghost" 
                onClick={onLogin}
                className="text-xs font-black uppercase tracking-widest hover:bg-[var(--brand-primary)]/10"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {t('login') || 'Log In'}
              </Button>
              
              <Button 
                variant="primary" 
                onClick={onRegister}
                className="text-xs font-black uppercase tracking-widest hidden sm:flex"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t('register') || 'Sign Up'}
              </Button>
            </>
          ) : (
            <Button 
              variant="primary" 
              onClick={onDashboard}
              className="text-xs font-black uppercase tracking-widest"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              {t('dashboard') || 'Dashboard'}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Simple Hero Section */}
        <section className="mb-20 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-xs font-black uppercase tracking-widest mb-6"
            >
                <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                </motion.div>
                <span>{t('nextGenPlatform') || 'Next-Gen E-commerce Platform'}</span>
            </motion.div>
            
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-black text-[var(--text-main)] tracking-tighter uppercase mb-6 leading-[0.9]"
            >
                {t('heroTitlePart1') || 'Everything you need'} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary,var(--brand-primary))]">
                    {t('heroTitlePart2') || 'in one place.'}
                </span>
            </motion.h1>
            
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-[var(--text-dim)] max-w-2xl mx-auto mb-10 font-medium"
            >
                {t('heroSubtitle') || 'Discover premium stores, track orders, and experience the future of shopping with AI-powered personalized recommendations.'}
            </motion.p>
            
            {/* Search Bar */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="max-w-2xl mx-auto relative group"
            >
                <div className="absolute inset-x-0 -bottom-2 h-12 bg-[var(--brand-primary)]/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center bg-[var(--color-surface-raised)] border border-[var(--glass-border)] rounded-2xl h-14 px-5 focus-within:border-[var(--brand-primary)] transition-all">
                    <Search className="w-5 h-5 text-[var(--text-dim)]" />
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder={t('searchMarketplacePlaceholder') || "Search stores, products, or types..."}
                        className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-[var(--text-main)] placeholder-[var(--text-dim)]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[10px] font-black uppercase text-[var(--brand-primary)]">
                            {navigator.platform.indexOf('Mac') > -1 ? '⌘' : 'Ctrl'} + K
                        </kbd>
                    </div>
                </div>
            </motion.div>
        </section>

        {/* Categories / Filters Section */}
        <section className="mb-12">
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            if (showNearby) setShowNearby(false);
                            else loadNearbyStores();
                        }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            showNearby 
                            ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary-glow)]' 
                            : 'bg-white/5 border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-white/10'
                        }`}
                    >
                        <MapPin className="w-4 h-4" />
                        {nearbyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (showNearby ? t('showingAll') || 'Showing All' : t('nearbyStoresBtn') || 'Nearby Stores')}
                    </button>
                    
                    <div className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-[var(--glass-border)] text-[var(--text-dim)]">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {t('storesAvailable', { count: filteredStores.length })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] hover:underline decoration-2 underline-offset-4">
                        {t('viewMarketplaceMap') || 'View Marketplace Map'}
                    </button>
                </div>
            </div>
        </section>

        {/* Store Grid */}
        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <Loader2 className="w-12 h-12 text-[var(--brand-primary)] animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">{t('loadingMagic') || 'Loading Magic...'}</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-[var(--glass-border)]">
                <Store className="w-20 h-20 text-[var(--text-dim)] mx-auto mb-6 opacity-10" />
                <p className="text-lg font-bold text-[var(--text-dim)] uppercase tracking-widest">
                    {searchQuery ? (t('noMatchesFound') || "No matches found for your search") : (t('marketplaceResting') || "The marketplace is currently resting")}
                </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStores.map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 3) * 0.1 }}
                  onClick={() => onViewStore(store.id)}
                  className="group bg-[var(--color-surface-raised,rgba(255,255,255,0.03))] rounded-[2rem] overflow-hidden border border-[var(--glass-border)] hover:border-[var(--brand-primary)] transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--brand-primary-glow)] cursor-pointer flex flex-col h-full relative"
                >
                  <div className="h-44 bg-slate-900 relative overflow-hidden">
                    {store.logo ? (
                      <img 
                        src={getMediaUrl(store.logo) || undefined} 
                        alt={store.name} 
                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                        <Store className="w-16 h-16 text-white/5" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 z-10">
                        <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            <span className="text-xs font-black text-white">{store.rating || '5.0'}</span>
                        </div>
                    </div>

                    <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand-primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {t('verified') || 'Verified'}
                        </div>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-black text-[var(--text-main)] truncate uppercase tracking-tighter group-hover:text-[var(--brand-primary)] transition-colors">
                                {ln(store, 'name')}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                                    {store.business_type}
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[var(--brand-primary)]/10 group-hover:border-[var(--brand-primary)]/30 transition-colors">
                            <ArrowRight className="w-5 h-5 text-[var(--text-dim)] group-hover:text-[var(--brand-primary)] group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    <p className="text-[var(--text-dim)] text-sm font-medium leading-relaxed line-clamp-2 mb-8 flex-1">
                      {ln(store, 'description') || (t('verifiedStoreDesc') || "Explore unique products and premium quality services offered by this verified store.")}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-[var(--glass-border)] mt-auto">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                            <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                            <span className="truncate max-w-[150px]">{store.pickup_address || t('remoteStore') || 'Mall Selection'}</span>
                        </div>
                        <div className="flex items-center -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--color-bg)] bg-slate-800 overflow-hidden ring-1 ring-white/5">
                                    <img src={`https://i.pravatar.cc/100?u=${store.id+i}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-[var(--glass-border)] bg-[var(--color-surface-raised)] py-12 px-6 lg:px-12 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
                    <span className="text-sm font-black text-white">S</span>
                </div>
                <span className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">Savdoon</span>
            </div>
            
            <p className="text-sm font-medium text-[var(--text-dim)]">
                © 2026 Savdoon. {t('footerBuiltFor') || 'Built for the modern ecosystem.'}
            </p>

            <div className="flex items-center gap-6">
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-[var(--brand-primary)] transition-colors">{t('termsLink') || 'Terms'}</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-[var(--brand-primary)] transition-colors">{t('privacyLink') || 'Privacy'}</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-[var(--brand-primary)] transition-colors">{t('contactLink') || 'Contact'}</a>
            </div>
        </div>
      </footer>
    </div>
  );
}
