// Context provider for global app state
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language, translations } from '../i18n/translations';

interface User {
  id: string;
  name: string;
  email: string;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  business_type: string;
  description: string;
  catalog_mode: boolean;
  pickup_address: string;
  latitude: string;
  longitude: string;
  telegram_bot?: string;
  chat_id?: string;
  status?: string;
  rating?: number;
  rating_count?: number;
  default_language: Language;
  base_currency: 'UZS' | 'USD' | 'RUB';
  use_auto_rates: boolean;
  manual_exchange_rates: { USD?: number; RUB?: number };
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  phone?: string;
  email?: string;
  instagram_url?: string;
  telegram_channel?: string;
  facebook_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  website_url?: string;
  telegram_username?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  working_hours?: any;
  payment_methods?: any;
  delivery_settings?: any;
  balance?: number;
  subscription_expiry?: string;
  subscription_price?: number;
  plan?: string;
  eskiz_email?: string;
  eskiz_token?: string;
  is_phone_verified?: boolean;
  theme_config?: {
    fontFamily?: string;
    borderRadius?: string;
    glassOpacity?: string;
    layout?: 'modern' | 'classic' | 'minimalist' | 'playful';
    texture?: string;
  };
}

interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  images: string[];
  description: string;
  active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  storeId: string;
  customer: { name: string; email: string; phone: string };
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'outForDelivery' | 'completed' | 'cancelled';
  deliveryType: 'pickup' | 'delivery';
  address?: string;
  notes?: string;
  date: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
  user: User | null;
  setUser: (user: User | null) => void;
  stores: Store[];
  setStores: (stores: Store[]) => void;
  addStore: (store: Store) => void;
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (val: boolean) => void;
  currency: string;
  setCurrency: (val: string) => void;
  customColors: { primary: string; secondary: string; accent: string };
  setCustomColors: (colors: { primary: string; secondary: string; accent: string }) => void;
  exchangeRates: { USD: number; RUB: number };
  setExchangeRates: (rates: { USD: number; RUB: number }) => void;
  themeMode: 'light' | 'ai';
  setThemeMode: (mode: 'light' | 'ai') => void;
  formatPrice: (amount: number, currencyOverride?: string) => string;
  ln: (obj: any, field: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);



export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('savdoon_lan');
    if (saved === 'en') return 'uz';
    return (saved as Language) || 'uz';
  });
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [maintenanceMode, setMaintenanceModeState] = useState(() => localStorage.getItem('savdoon_maintenance') === 'true');
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('savdoon_currency') || 'UZS');
  const [exchangeRates, setExchangeRatesState] = useState<{ USD: number; RUB: number }>(() => {
    const saved = localStorage.getItem('savdoon_exchange_rates');
    return saved ? JSON.parse(saved) : { USD: 12800, RUB: 140 };
  });

  const setExchangeRates = (rates: { USD: number; RUB: number }) => {
    setExchangeRatesState(rates);
    localStorage.setItem('savdoon_exchange_rates', JSON.stringify(rates));
  };

  const themeMode: 'light' | 'ai' = 'light';
  const setThemeMode = () => console.warn('Theme is locked to light mode.');

  const [customColors, setCustomColorsState] = useState<{ primary: string; secondary: string; accent: string }>(() => {
    const saved = localStorage.getItem('savdoon_custom_colors');
    return saved ? JSON.parse(saved) : { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f43f5e' };
  });

  useEffect(() => {
    if (currentStore) {
      if (currentStore.use_auto_rates) {
        import('../services/api').then(({ storeApi }) => {
          storeApi.getExchangeRates().then(res => setExchangeRates(res.data)).catch(err => console.error(err));
        });
      } else if (currentStore.manual_exchange_rates) {
        setExchangeRates({
          USD: currentStore.manual_exchange_rates.USD || 12800,
          RUB: currentStore.manual_exchange_rates.RUB || 140
        });
      }
    }
  }, [currentStore?.use_auto_rates, currentStore?.manual_exchange_rates]);

  // Sync branding colors with currentStore
  useEffect(() => {
    if (currentStore?.primary_color && currentStore?.secondary_color) {
      setCustomColorsState({
        primary: currentStore.primary_color,
        secondary: currentStore.secondary_color,
        accent: currentStore.accent_color || '#f43f5e'
      });
    } else {
      // Reset to defaults if store has no custom branding
      setCustomColorsState({ primary: '#6366f1', secondary: '#8b5cf6', accent: '#f43f5e' });
    }
  }, [currentStore?.id, currentStore?.primary_color, currentStore?.secondary_color, currentStore?.accent_color]);

  const setCustomColors = (colors: { primary: string; secondary: string; accent: string }) => {
    setCustomColorsState(colors);
    localStorage.setItem('savdoon_custom_colors', JSON.stringify(colors));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('savdoon_lan', lang);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const dict = (translations[language] as any) || {};
    let text = dict[key] || key;
    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const ln = (obj: any, field: string): string => {
    if (!obj) return '';
    // Priority: field_lang (e.g. name_ru) -> field (e.g. name) -> first available field_lang -> empty
    const langField = `${field}_${language}`;
    if (obj[langField]) return obj[langField];
    if (obj[field]) return obj[field];

    // Fallback to other languages if primary is missing
    const fallbacks = ['uz', 'ru', 'en'];
    for (const fb of fallbacks) {
      const fbField = `${field}_${fb}`;
      if (obj[fbField]) return obj[fbField];
    }

    return '';
  };

  const addStore = (store: Store) => setStores([...stores, store]);
  const addProduct = (product: Product) => setProducts([...products, product]);
  const updateProduct = (product: Product) => setProducts(products.map(p => p.id === product.id ? product : p));
  const deleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));

  const addToCart = (p: Product) => {
    const existing = cart.find(item => item.product.id === p.id);
    if (existing) setCart(cart.map(item => item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { product: p, quantity: 1 }]);
  };

  const removeFromCart = (pid: string) => setCart(cart.filter(item => item.product.id !== pid));
  const updateCartQuantity = (pid: string, qty: number) => {
    if (qty <= 0) removeFromCart(pid);
    else setCart(cart.map(item => item.product.id === pid ? { ...item, quantity: qty } : item));
  };
  const clearCart = () => setCart([]);

  const addOrder = (o: Order) => setOrders([o, ...orders]);
  const updateOrderStatus = (id: string, s: Order['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: s } : o));
  };

  const setMaintenanceMode = (val: boolean) => {
    setMaintenanceModeState(val);
    localStorage.setItem('savdoon_maintenance', String(val));
  };

  const setCurrency = (val: string) => {
    setCurrencyState(val);
    localStorage.setItem('savdoon_currency', val);
  };

  const formatPrice = (amount: number, currencyOverride?: string) => {
    const targetCurrency = currencyOverride || currency;
    const baseCurrency = currentStore?.base_currency || 'UZS';
    let convertedAmount = amount;
    if (baseCurrency === 'USD') convertedAmount = amount * exchangeRates.USD;
    if (baseCurrency === 'RUB') convertedAmount = amount * exchangeRates.RUB;
    if (targetCurrency === 'USD') convertedAmount = convertedAmount / exchangeRates.USD;
    if (targetCurrency === 'RUB') convertedAmount = convertedAmount / exchangeRates.RUB;
    const symbol = targetCurrency === 'USD' ? '$' : targetCurrency === 'RUB' ? '₽' : 'sum';
    return `${convertedAmount.toLocaleString(undefined, { maximumFractionDigits: targetCurrency === 'UZS' ? 0 : 2 })} ${symbol}`;
  };

  useEffect(() => {
    const root = window.document.documentElement;

    // Theme switching logic
    root.classList.remove('light-theme', 'ai-theme');
    if (themeMode === 'light') root.classList.add('light-theme');
    else root.classList.add('ai-theme');

    const p = customColors.primary;
    const s = customColors.secondary;
    const a = customColors.accent;

    root.style.setProperty('--primary', p);
    root.style.setProperty('--secondary', s);
    root.style.setProperty('--accent', a);
    root.style.setProperty('--brand-primary', p);
    root.style.setProperty('--brand-secondary', s);
    root.style.setProperty('--brand-accent', a);
    root.style.setProperty('--brand-primary-glow', `${p}1a`); // 10% opacity

    // Holistic Theme Variables
    root.style.setProperty('--bg-sidebar', 'rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--bg-header', 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--glass-border', 'rgba(15, 23, 42, 0.12)');
    root.style.setProperty('--bg-surface', 'rgba(241, 245, 249, 0.8)');
    root.style.setProperty('--bg-gradient', `
      radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.12) 0, transparent 50%),
      radial-gradient(at 50% 100%, rgba(124, 58, 237, 0.08) 0, transparent 50%),
      radial-gradient(at 100% 0%, rgba(244, 63, 94, 0.06) 0, transparent 50%)
    `);

    // AI Design Engine Variables
    if (currentStore?.theme_config) {
      const tc = currentStore.theme_config;
      if (tc.fontFamily) root.style.setProperty('--font-family', tc.fontFamily);
      if (tc.borderRadius) root.style.setProperty('--border-radius', tc.borderRadius);
      if (tc.glassOpacity) root.style.setProperty('--glass-opacity', tc.glassOpacity);
      if (tc.texture) root.style.setProperty('--bg-texture', tc.texture);
    } else {
      // Fallbacks
      root.style.setProperty('--font-family', "'Inter', sans-serif");
      root.style.setProperty('--border-radius', "2rem");
      root.style.setProperty('--glass-opacity', "0.05");
    }
  }, [customColors, currentStore, themeMode]);

  return (
    <AppContext.Provider value={{
      language, setLanguage, t,
      user, setUser,
      stores, setStores, addStore, currentStore, setCurrentStore,
      products, addProduct, updateProduct, deleteProduct,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
      orders, addOrder, updateOrderStatus,
      maintenanceMode, setMaintenanceMode,
      currency, setCurrency,
      customColors, setCustomColors,
      exchangeRates, setExchangeRates, formatPrice,
      themeMode, setThemeMode, ln
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
