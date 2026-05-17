import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Plus, Minus, Trash2, ArrowRight, Check, Package, Loader2, Search, Star, Heart, SlidersHorizontal, Sparkles, Play, MapPin, User, Phone, ShieldCheck, ChevronRight, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabaseApi } from '../services/supabaseService';
import { getMediaUrl } from '../utils/media';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { AIAssistant } from '../components/AIAssistant';
import { ChatSupport } from '../components/ChatSupport';
import { DeliveryOptions } from '../components/DeliveryOptions';
import { NotificationCenter } from '../components/NotificationCenter';
import { RecommendationSection } from '../components/RecommendationSection';
import { VoiceSearch } from '../components/VoiceSearch';
import { AIReviewSummary } from '../components/AIReviewSummary';
import { VisualSearch } from '../components/VisualSearch';
import { ShareButton } from '../components/ShareButton';
import { AiConcierge } from '../components/AiConcierge';
import { ReelsFeed } from '../components/ReelsFeed';
import { GroupBuyCard } from '../components/GroupBuyCard';
import { FlashSaleTimer } from '../components/FlashSaleTimer';
import { NearbyStores } from '../components/NearbyStores';
import { OrderTracking } from '../components/OrderTracking';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { SearchDropdown } from '../components/SearchDropdown';
import { ProfileModal } from '../components/ProfileModal';
import { CartModal } from '../components/CartModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { toast } from 'react-hot-toast';

// Sanitize HTML to prevent XSS attacks.
// Scripts, event handlers, and dangerous attributes are stripped.
// Store owners can use HTML/CSS for layout but cannot execute JavaScript.
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'ul', 'ol', 'li', 'section', 'article', 'header', 'footer',
      'nav', 'main', 'aside', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'label', 'style', 'link', 'strong', 'em', 'b', 'i', 'br', 'hr',
      'figure', 'figcaption', 'picture', 'source',
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'href', 'src', 'srcset', 'alt', 'title',
      'target', 'rel', 'type', 'aria-*', 'role', 'data-*',
    ],
    // Explicitly forbid anything that can execute code
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  });
};
import 'swiper/css/effect-fade';

interface StorefrontProps {
  onBack: () => void;
  onBackToAdmin?: () => void;
  storeId?: number;
  isPreview?: boolean;
  onElementSelect?: (elementDetails: any) => void;
}

// Helper to isolate custom CSS
function ShadowRoot({ children }: { children: React.ReactNode }) {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (shadowHostRef.current && !shadowRoot) {
      let root = shadowHostRef.current.shadowRoot;
      if (!root) {
        root = shadowHostRef.current.attachShadow({ mode: 'open' });
      }

      let container = root.querySelector('#shadow-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'shadow-container';
        container.className = 'w-full h-full';
        root.appendChild(container);
      }

      setShadowRoot(container as unknown as ShadowRoot);
    }
  }, [shadowRoot]);

  return (
    <div ref={shadowHostRef} className="shadow-host w-full h-full">
      {shadowRoot && ReactDOM.createPortal(children, shadowRoot)}
    </div>
  );
}


export function Storefront({ onBack, onBackToAdmin, storeId, isPreview, onElementSelect }: StorefrontProps) {
  const { t, language, currency, user, formatPrice, ln } = useApp();
  const { user: authUser } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const storefrontRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000000 });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<any>(null);

  // Checkout form
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod] = useState<'cash'>('cash');
  const [notes, setNotes] = useState('');
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('Manzilni tanlang');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'orders' | 'addresses' | 'notifications'>('info');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(JSON.parse(localStorage.getItem('recentSearches') || '[]'));
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<'active' | 'all'>('active');
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  // Intercept clicks for Visual Editor
  useEffect(() => {
    if (!isPreview || !onElementSelect) return;
    const container = storefrontRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      
      // Compute styles
      const styles = window.getComputedStyle(target);
      
      // Calculate path to element for targeted updates
      let path = [];
      let current: HTMLElement | null = target;
      while (current && current !== container) {
        let index = 0;
        let sibling = current.previousElementSibling;
        while (sibling) {
          if (sibling.tagName === current.tagName) index++;
          sibling = sibling.previousElementSibling;
        }
        path.unshift(`${current.tagName.toLowerCase()}${index > 0 ? `:nth-of-type(${index + 1})` : ''}`);
        current = current.parentElement;
      }
      const selectorPath = path.join(' > ');

      onElementSelect({
        tagName: target.tagName,
        text: target.innerText,
        html: target.innerHTML,
        className: target.className,
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
        href: (target as HTMLAnchorElement).href || null,
        src: (target as HTMLImageElement).src || null,
        id: target.id,
        selectorPath
      });
    };

    container.addEventListener('click', handleClick, true);
    return () => container.removeEventListener('click', handleClick, true);
  }, [isPreview, onElementSelect, store]);

  // (Tailwind CDN injection removed for performance optimization - M5 Competition Phase 3)

  // Real-time Inventory and Categories Sync using Supabase Realtime
  useEffect(() => {
    if (!storeId || !supabase) return;

    // Subscribe to products changes for this store
    const productsChannel = supabase.channel(`public:products:store=${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('Realtime product update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedProduct = payload.new as any;
            setProducts(prev => {
              const index = prev.findIndex(p => p.id === updatedProduct.id);
              if (index !== -1) {
                const newProducts = [...prev];
                newProducts[index] = { ...newProducts[index], ...updatedProduct };
                return newProducts;
              } else if (payload.eventType === 'INSERT') {
                return [updatedProduct, ...prev];
              }
              return prev;
            });
            
            // If the selected product was updated, update it too
            if (selectedProduct && selectedProduct.id === updatedProduct.id) {
              setSelectedProduct(prev => ({ ...prev, ...updatedProduct }));
            }
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
            if (selectedProduct && selectedProduct.id === payload.old.id) {
              setSelectedProduct(null);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to categories changes
    const categoriesChannel = supabase.channel(`public:categories:store=${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedCat = payload.new as any;
            setCategories(prev => {
              const index = prev.findIndex(c => c.id === updatedCat.id);
              if (index !== -1) {
                const newCats = [...prev];
                newCats[index] = { ...newCats[index], ...updatedCat };
                return newCats;
              } else if (payload.eventType === 'INSERT') {
                return [...prev, updatedCat];
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [storeId, selectedProduct]);

  // Apply dynamic theme and favicon
  useEffect(() => {
    if (store) {
      const root = document.documentElement;
      const theme = store.theme_config || {};

      // Apply colors
      root.style.setProperty('--primary', store.primary_color || theme.primary_color || '#6366F1');
      root.style.setProperty('--secondary', store.secondary_color || theme.secondary_color || '#8B5CF6');
      root.style.setProperty('--accent', theme.accent_color || '#F43F5E');
      root.style.setProperty('--surface', theme.surface_color || '#FFFFFF');
      root.style.setProperty('--banner-radius', '2rem');

      // Apply favicon
      if (store.favicon) {
        const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = getMediaUrl(store.favicon);
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      // Update page title
      document.title = `${store.name} | Savdogar`;
    }
  }, [store]);

  // Handle QR-Order deep link (?product=slug)
  useEffect(() => {
    if (products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const productSlug = params.get('product');
      if (productSlug) {
        const product = products.find(p => p.slug === productSlug);
        if (product) {
          setSelectedProduct(product);
        }
      }
    }
  }, [products]);

  useEffect(() => {
    if (selectedProduct) {
      loadReviews(selectedProduct.id);
      setSelectedAttributes({});
      setCurrentVariant(null);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct && (selectedProduct.variants?.length || 0) > 0) {
      // Find matching variant
      const match = selectedProduct.variants.find((v: any) =>
        Object.entries(v.attributes).every(([k, val]) => selectedAttributes[k] === val) &&
        Object.keys(v.attributes).length === Object.keys(selectedAttributes).length
      );
      setCurrentVariant(match || null);
    } else {
      setCurrentVariant(null);
    }
  }, [selectedAttributes, selectedProduct]);

  useEffect(() => {
    if (checkoutOpen && storeId) {
      loadLoyaltyPoints();
    }
  }, [checkoutOpen, storeId]);

  useEffect(() => {
    if (showProfileModal) {
      loadOrders();
      loadAddresses();
    }
  }, [showProfileModal]);

  const loadOrders = async () => {
    try {
      const data = await supabaseApi.orders.listUserOrders();
      setUserOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
      // Fallback for demo
      setUserOrders([
        { id: 1, order_number: '54321', created_at: new Date().toISOString(), total: 450000, status: 'processing' },
        { id: 2, order_number: '54320', created_at: new Date(Date.now() - 86400000).toISOString(), total: 120000, status: 'completed' }
      ]);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await supabaseApi.accounts.getAddresses();
      setUserAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses', error);
      // Fallback to localStorage
      const local = JSON.parse(localStorage.getItem('userAddresses') || '[]');
      if (local.length > 0) {
        setUserAddresses(local);
      } else {
        const mock = [
          { id: 1, name: 'Uy', address: 'Toshkent sh., Yunusobod tumani, 19-mavze, 45-uy', is_default: true },
          { id: 2, name: 'Ish', address: 'Toshkent sh., Chilonzor tumani, Qatortol ko\'chasi, 12-uy', is_default: false }
        ];
        setUserAddresses(mock);
        localStorage.setItem('userAddresses', JSON.stringify(mock));
      }
    }
  };

  const deleteAddress = (id: number) => {
    const updated = userAddresses.filter(a => a.id !== id);
    setUserAddresses(updated);
    localStorage.setItem('userAddresses', JSON.stringify(updated));
    toast.success('Manzil o\'chirildi');
  };

  const setDefaultAddress = (id: number) => {
    const updated = userAddresses.map(a => ({
      ...a,
      is_default: a.id === id
    }));
    setUserAddresses(updated);
    localStorage.setItem('userAddresses', JSON.stringify(updated));
    const defaultAddr = updated.find(a => a.id === id);
    if (defaultAddr) setDeliveryAddress(defaultAddr.address);
    toast.success('Asosiy manzil o\'zgartirildi');
  };

  const addAddress = () => {
    const name = prompt('Manzil nomi (masalan: Uy, Ish):');
    const address = prompt('To\'liq manzil:');
    if (name && address) {
      const newAddr = {
        id: Date.now(),
        name,
        address,
        is_default: userAddresses.length === 0
      };
      const updated = [...userAddresses, newAddr];
      setUserAddresses(updated);
      localStorage.setItem('userAddresses', JSON.stringify(updated));
      if (newAddr.is_default) setDeliveryAddress(newAddr.address);
      toast.success('Yangi manzil qo\'shildi');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadLoyaltyPoints = async () => {

    try {
      const response = await supabaseApi.loyalty.getPoints();
      const storePoints = response.data.find((p: any) => p.store === storeId);
      if (storePoints) {
        setLoyaltyPoints(storePoints.points);
      }
    } catch (error) {
      console.error('Failed to load loyalty points:', error);
    }
  };

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPreview && onBackToAdmin) {
      (window as any).backToAdmin = onBackToAdmin;
    }
    return () => {
      delete (window as any).backToAdmin;
    };
  }, [isPreview, onBackToAdmin]);

  const loadStoreData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeData, productsData, categoriesData] = await Promise.all([
        supabaseApi.stores.get(storeId!),
        supabaseApi.products.list(storeId!),
        supabaseApi.categories.list(storeId!),
      ]);
      setStore(storeData);
      setProducts(Array.isArray(productsData.data) ? productsData.data : (Array.isArray(productsData) ? productsData : []));
      setCategories(Array.isArray(categoriesData) ? categoriesData : (Array.isArray((categoriesData as any).data) ? (categoriesData as any).data : []));
    } catch (err: any) {
      console.error('Failed to load storefront data from Supabase:', err);
      setError(err.message || 'Failed to load store');
    }
    setLoading(false);
  };

  const loadWishlist = async () => {
    try {
      const response = await supabaseApi.wishlist.list();
      setWishlist(response.data.map((item: any) => item.product));
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  // Dynamic SEO meta tags
  useEffect(() => {
    if (store) {
      document.title = `${store.name} - Savdogar`;

      const updateMeta = (name: string, content: string, property: boolean = false) => {
        let el = document.querySelector(property ? `meta[property="${name}"]` : `meta[name="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          if (property) el.setAttribute('property', name);
          else el.setAttribute('name', name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      const metaDesc = selectedProduct
        ? ln(selectedProduct, 'description')
        : (store.description_ru && language === 'ru' ? store.description_ru : store.description_uz && language === 'uz' ? store.description_uz : store.description);
      const metaTitle = selectedProduct
        ? ln(selectedProduct, 'name')
        : store.name;
      const metaImage = getMediaUrl(selectedProduct ? selectedProduct.images?.[0]?.image : store.logo);

      updateMeta('description', metaDesc || '');
      updateMeta('og:title', `${metaTitle} | ${store.name}`, true);
      updateMeta('og:description', metaDesc || '', true);
      updateMeta('og:image', metaImage || '', true);
      updateMeta('og:url', window.location.href, true);
      updateMeta('twitter:card', 'summary_large_image');
    }
  }, [store, selectedProduct, language]);

  const toggleWishlist = async (productId: number) => {
    try {
      await supabaseApi.wishlist.toggle(productId);
      loadWishlist();
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const loadReviews = async (productId: number) => {
    setReviewsLoading(true);
    try {
      const response = await supabaseApi.reviews.list({ product: productId });
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async (productId: number) => {
    if (!storeId) return;
    setIsSubmittingReview(true);
    try {
      await supabaseApi.reviews.create({
        product: productId,
        store: storeId,
        rating: newReview.rating,
        comment: newReview.comment
      });
      setNewReview({ rating: 5, comment: '' });
      loadReviews(productId);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode || !storeId) return;
    setPromoError('');
    try {
      const response = await supabaseApi.promoCodes.apply({
        code: promoCode,
        store_id: storeId,
        order_total: cartTotal
      });
      setAppliedPromo(response.data.promo);
      setPromoCode('');
    } catch (error: any) {
      setPromoError(error.message || 'Invalid promo code');
    }
  };

  const handleSearch = async () => {
    if (!storeId) return;
    setIsSearching(true);
    try {
      // Supabase-dan filtrlar bilan qidirish
      const response = await supabaseApi.products.list(storeId);
      const data = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      
      let results = [...data];
      
      if (searchQuery) {
        results = results.filter(p => 
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (categoryFilter !== 'all') {
        results = results.filter(p => p.category_id === parseInt(categoryFilter));
      }
      
      setProducts(results);
    } catch (error) {
      console.error('Supabase search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search when filters change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, categoryFilter, priceRange, inStockOnly, sortBy, hasDiscount]);

  const filteredProducts = products; // Using backend results directly

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: any, variant?: any) => {
    setCart(prev => {
      const existing = prev.find(item =>
        variant ? item.variant?.id === variant.id : item.product.id === product.id && !item.variant
      );
      if (existing) {
        return prev.map(item =>
          (variant ? item.variant?.id === variant.id : item.product.id === product.id && !item.variant)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, q: number) => {
    if (q <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: q } : item));
  };

  const handlePlaceOrder = async () => {
    if (!name || !phone || !storeId) return;
    setIsSubmitting(true);
    try {
      const orderData = {
        store_id: storeId,
        customer_name: name,
        customer_phone: phone,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? `${selectedDeliveryOption?.name}: ${address}` : '',
        total: cartTotal + (deliveryType === 'delivery' ? (selectedDeliveryOption?.price || 0) : 0),
        status: 'pending',
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };
      const response = await supabaseApi.orders.create(orderData);
      setLastOrder(response);
      setCart([]);
      setCheckoutOpen(false);
      setOrderComplete(true);
    } catch (error: any) {
      console.error('Failed to place order in Supabase:', error);
      alert('Order failed');
    }
    setIsSubmitting(false);
  };

  const handleVoiceAction = (result: any) => {
    if (!result) return;

    if (result.action === 'search' && result.filters?.q) {
      setSearchQuery(result.filters.q);
      if (result.filters.price_max) {
        setPriceRange(prev => ({ ...prev, max: result.filters.price_max }));
      }
    } else if (result.action === 'add_to_cart') {
      // Find product by name or partially
      const query = result.filters?.q?.toLowerCase() || '';
      const found = products.find(p => ln(p, 'name').toLowerCase().includes(query));
      if (found) {
        addToCart(found);
        alert(result.reply || (language === 'uz' ? "Savatga qo'shildi" : "Added to cart"));
      }
    } else if (result.action === 'go_to_checkout') {
      if (cart.length > 0) {
        setCheckoutOpen(true);
      } else {
        alert(language === 'uz' ? "Savat bo'sh" : "Cart is empty");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 w-full overflow-hidden flex flex-col">
        {/* Navbar Skeleton */}
        <div className="h-20 w-full border-b border-white/10 flex items-center justify-between px-8 bg-white/5">
          <div className="w-32 h-8 bg-white/10 rounded-lg animate-pulse" />
          <div className="hidden md:flex gap-6">
            <div className="w-20 h-4 bg-white/10 rounded-full animate-pulse" />
            <div className="w-20 h-4 bg-white/10 rounded-full animate-pulse" />
            <div className="w-20 h-4 bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Hero Banner Skeleton */}
        <div className="w-full h-[40vh] bg-white/5 animate-pulse flex flex-col justify-center px-8 md:px-20">
          <div className="w-3/4 md:w-1/2 h-12 md:h-16 bg-white/10 rounded-2xl mb-6" />
          <div className="w-1/2 md:w-1/3 h-6 bg-white/10 rounded-full mb-8" />
          <div className="w-40 h-12 bg-white/10 rounded-xl" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-48 h-8 bg-white/10 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="aspect-[4/5] w-full bg-white/5 rounded-[2rem] animate-pulse" />
                <div className="w-3/4 h-5 bg-white/10 rounded-full animate-pulse" />
                <div className="w-1/2 h-6 bg-white/10 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">
          {error || 'Store Not Found'}
        </h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md font-medium">
          {language === 'uz' ? 'Do\'kon ma\'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki do\'kon holatini tekshiring.' :
            language === 'ru' ? 'Ошибка при загрузке данных магазина. Пожалуйста, попробуйте еще раз или проверьте статус магазина.' :
              'Something went wrong while loading the store. Please try again or check the store status.'}
        </p>
        <Button onClick={onBack} variant="outline" className="h-12 px-8 rounded-xl font-bold">
          {t('goBack')}
        </Button>
      </div>
    );
  }

  // Dynamic Theme Base
  const themeStyles = (() => {
    const p = store.primary_color || '#6366F1';
    const s = store.secondary_color || '#8B5CF6';
    const a = store.accent_color || '#F43F5E';

    const adjust = (hex: string, amt: number) => {
      let col = hex.replace(/^#/, '');
      if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];
      let num = parseInt(col, 16);
      let r = (num >> 16) + amt;
      let g = ((num >> 8) & 0x00FF) + amt;
      let b = (num & 0x0000FF) + amt;
      const clamp = (v: number) => Math.min(255, Math.max(0, v));
      return "#" + (0x1000000 + clamp(r) * 0x10000 + clamp(g) * 0x100 + clamp(b)).toString(16).slice(1);
    };

    // Determine if primary is light or dark for foreground text
    const getBrightness = (hex: string) => {
      let col = hex.replace(/^#/, '');
      if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];
      const rgb = parseInt(col, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      return (r * 0.299 + g * 0.587 + b * 0.114);
    };

    const isPrimaryLight = getBrightness(p) > 180;

    const config = store?.theme_config || {};

    return {
      '--primary': config.primary_color || p,
      '--primary-och': adjust(config.primary_color || p, 40),
      '--primary-toq': adjust(config.primary_color || p, -40),
      '--secondary': config.secondary_color || s,
      '--secondary-och': adjust(config.secondary_color || s, 40),
      '--secondary-toq': adjust(config.secondary_color || s, -40),
      '--accent': config.accent_color || a,
      '--accent-toq': adjust(config.accent_color || a, -40),
      '--primary-foreground': isPrimaryLight ? '#0f172a' : '#ffffff',
      '--text-main': 'var(--text-primary)',
      '--text-dim': 'var(--text-secondary)',
      '--border-radius': config.border_radius || '2rem',
      '--font-family': config.font_family || "'Inter', sans-serif",
      '--font-size-base': config.font_size === 'small' ? '13px' : config.font_size === 'large' ? '17px' : config.font_size === 'xlarge' ? '19px' : '15px',
      '--font-size-heading': config.font_size === 'small' ? '1.5rem' : config.font_size === 'large' ? '2.25rem' : config.font_size === 'xlarge' ? '2.75rem' : '1.875rem',
      '--font-size-sm': config.font_size === 'small' ? '11px' : config.font_size === 'large' ? '14px' : config.font_size === 'xlarge' ? '15px' : '12px',
      '--card-shadow': config.card_style === 'elevated' ? '0 20px 40px rgba(0,0,0,0.1)' : 'none',
      '--banner-radius': config.banner_style === 'rounded' ? '3rem' : config.banner_style === 'glass' ? '2rem' : '0',
      fontSize: config.font_size === 'small' ? '13px' : config.font_size === 'large' ? '17px' : config.font_size === 'xlarge' ? '19px' : '15px',
      fontFamily: config.font_family || "'Inter', sans-serif",
    } as React.CSSProperties;
  })();

  // UI Schema Engine
  const defaultSchema = [
    { type: 'Header' },
    { type: 'HeroBanner' },
    { type: 'SearchArea' },
    { type: 'ProductsArea' }
  ];
  const activeSchema = (store?.ui_schema && store.ui_schema.length > 0) ? store.ui_schema : defaultSchema;

  const getStyle = (type: string) => {
    const section = activeSchema.find((b: any) => b.type === type);
    if (!section) return { display: 'none' };
    const index = activeSchema.indexOf(section);
    return { order: index, ...(section.props || {}) };
  };

  const renderProductsGrid = () => (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('searching') || 'Qidirilmoqda...'}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-32 h-32 rounded-[3rem] bg-slate-50 flex items-center justify-center mb-8 shadow-inner">
            <Search className="w-12 h-12 text-slate-300" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">{t('noProductsFound') || 'Mahsulotlar topilmadi'}</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${isPreview ? 'gap-4 px-2' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8'}`}>
          {filteredProducts.map((product, index) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <GlassCard className="overflow-hidden group cursor-pointer h-full flex flex-col border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/5 duration-500">
                <div className="aspect-square relative overflow-hidden bg-white/5 border-b border-[var(--color-border)]" onClick={() => setSelectedProduct(product)}>
                  {product.images?.[0] ? (
                    <img src={getMediaUrl(product.images[0].image) || undefined} alt={ln(product, 'name')} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]"><Package className="w-16 h-16 opacity-10" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--text-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest mb-2">{ln(product.category_obj || { name: product.category_name }, 'name')}</p>
                  <h4 className="font-black text-[var(--text-primary)] text-lg mb-4 truncate uppercase tracking-tight">
                    {ln(product, 'name')}
                  </h4>
                  <div className="flex items-center justify-between mt-auto gap-4">
                    <span className="text-xl font-black text-[var(--text-primary)] tabular-nums">{product.price.toLocaleString()} <span className="text-xs text-[var(--text-muted)]">{currency}</span></span>
                    {!store.catalog_mode ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        disabled={product.stock === 0}
                        className="p-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-toq)] text-[var(--primary-foreground)] transition-all shadow-lg shadow-[var(--primary-glow)] disabled:opacity-50 active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="px-4 py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--color-border)] transition-all"
                      >
                        {t('viewDetails')}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                    className="absolute top-4 left-4 p-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-bright)] opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent)] hover:text-white shadow-xl z-10"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-current text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                  </button>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                    <ShareButton url={`${window.location.origin}/store/${store?.slug}/product/${product.id}`} title={product.name} language={language} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );

  // Global Action Interceptor for Custom HTML
  useEffect(() => {
    const container = storefrontRef.current;
    if (!container || !store?.store_files) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const actionBtn = target.closest('[data-action]');
      if (!actionBtn) return;

      const action = actionBtn.getAttribute('data-action');
      const productId = actionBtn.getAttribute('data-product-id');

      if (action === 'add-to-cart' && productId) {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
          addToCart(product);
          toast.success(t('addedToCart') || 'Savatga qo\'shildi');
        }
      } else if (action === 'view-product' && productId) {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) setSelectedProduct(product);
      } else if (action === 'open-cart') {
        setCartOpen(true);
      }
    };

    container.addEventListener('click', handleGlobalClick);
    return () => container.removeEventListener('click', handleGlobalClick);
  }, [store, products]);

  const renderCustomStorefront = () => {
    if (!store?.store_files && !store?.store_html) return null;

    let processedHtml = "";
    if (store?.store_files && Object.keys(store.store_files).length > 0) {
      processedHtml = store.store_files['index.html'] || store.store_files['main.html'] || '';
      Object.keys(store.store_files).forEach(path => {
        const content = store.store_files[path];
        if (path.endsWith('.css')) {
          const styleTag = `<style data-path="${path}">${content}</style>`;
          processedHtml = processedHtml.replace(new RegExp(`<link[^>]+href=["']\\.?/?${path}["'][^>]*>`, 'g'), styleTag);
        }
      });
    } else {
      processedHtml = store.store_html || "";
    }

    // Placeholders
    processedHtml = processedHtml
      .replace(/\{{1,2}STORE_NAME\}{1,2}/g, store.name || '')
      .replace(/\{{1,2}BUSINESS_TYPE\}{1,2}/g, store.business_type_display || '')
      .replace(/\{{1,2}DESCRIPTION\}{1,2}/g, store.description || '')
      .replace(/\{{1,2}PRIMARY_COLOR\}{1,2}/g, store.primary_color || '#6366F1')
      .replace(/\{{1,2}SECONDARY_COLOR\}{1,2}/g, store.secondary_color || '#8B5CF6')
      .replace(/\{{1,2}ACCENT_COLOR\}{1,2}/g, store.accent_color || '#F43F5E');

    const parts = processedHtml.split(/\{{1,2}PRODUCTS_GRID\}{1,2}/);

    return (
      <ShadowRoot>
        <div 
          ref={storefrontRef} 
          className="min-h-screen font-sans relative" 
          style={{ 
            ...themeStyles, 
            backgroundColor: 'var(--bg-main, #050505)', 
            color: 'var(--text-primary, #ffffff)' 
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
          {parts.length > 1 && (
            <>
              {renderProductsGrid()}
              <div dangerouslySetInnerHTML={{ __html: parts[1] }} />
            </>
          )}
        </div>
      </ShadowRoot>
    );
  };

  const mainContent = (store?.store_files || store?.store_html) 
    ? renderCustomStorefront() 
    : (
    <div className={`min-h-screen ${isPreview ? 'bg-transparent' : 'bg-[var(--bg-main)]'} text-[var(--text-primary)] font-sans selection:bg-[var(--primary)]/30 flex flex-col`} style={themeStyles}>
      {isPreview && onBackToAdmin && (
        <button
          onClick={onBackToAdmin}
          className="fixed top-24 left-6 z-[100] p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all flex items-center gap-3 shadow-2xl group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <ArrowRight className="w-5 h-5 -rotate-180" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashbordga qaytish</span>
        </button>
      )}
      {/* Dynamic Background Gradient - Full Page Mesh */}
      <div className={`${isPreview ? 'absolute' : 'fixed'} inset-0 overflow-hidden pointer-events-none z-0`} style={{ order: -1 }}>
        <div
          className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] blur-[120px] rounded-full opacity-30 animate-pulse-slow"
          style={{ background: `radial-gradient(circle, var(--primary-toq) 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] blur-[120px] rounded-full opacity-20 animate-pulse-slow"
          style={{ background: `radial-gradient(circle, var(--secondary-toq) 0%, transparent 70%)` }}
        />
        <div className="absolute inset-0 bg-[var(--bg-main)]/40" />
      </div >

      {/* Header */}
      <header className={`sticky top-0 z-[100] transition-all duration-500 bg-white/90 backdrop-blur-xl border-b border-slate-100 ${store.theme_config?.header_layout === 'centered' ? 'h-auto py-4' : 'h-24'}`}>
        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className={`flex items-center h-full gap-8 ${store.theme_config?.header_layout === 'centered' ? 'flex-col justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-6">
              <div
                className={`flex items-center gap-2 sm:gap-3 cursor-pointer group ${store.theme_config?.header_layout === 'centered' ? 'mx-auto' : ''}`}
                onClick={() => isPreview ? null : onBack()}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform relative overflow-hidden shrink-0">
                  {store.logo ? (
                    <img
                      src={getMediaUrl(store.logo) || undefined}
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm sm:text-lg md:text-xl font-black text-slate-950 uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">{store.name}</span>
                  <span className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest truncate">{store.business_type}</span>
                </div>
              </div>

              {/* Address Selector */}
              <button
                onClick={() => setShowAddressModal(true)}
                className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                  <MapPin size={16} />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Yetkazish manzili</span>
                  <span className="text-[11px] font-bold text-slate-900 max-w-[150px] truncate">{deliveryAddress}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex-1 max-w-md hidden lg:block" ref={searchRef}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  type="text"
                  placeholder="Mahsulotlarni qidirish..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[var(--primary)]/30 focus:ring-4 focus:ring-[var(--primary)]/5 transition-all"
                />

                {/* Search Dropdown */}
                <SearchDropdown
                  show={showSearchDropdown}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  recentSearches={recentSearches}
                  setRecentSearches={setRecentSearches}
                  products={products}
                  setSelectedProduct={setSelectedProduct}
                  setShowSearchDropdown={setShowSearchDropdown}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 p-1 rounded-2xl">
                <button onClick={() => setShowCategoryModal(true)} className="p-2.5 text-slate-900 hover:bg-white rounded-xl transition-all"><Menu size={20} /></button>
                <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                {!isPreview && <LanguageSwitcher />}
              </div>

              {!store.catalog_mode && (
                <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-2xl bg-white border border-slate-100 text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Profile Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-all overflow-hidden"
                >
                  {user?.avatar ? (
                    <img src={getMediaUrl(user.avatar)} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden py-4 z-50"
                    >
                      <div className="px-6 py-4 border-b border-slate-50 mb-2">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Xush kelibsiz</p>
                        <p className="text-sm font-black text-slate-950">{user?.first_name || 'Mehmon'} {user?.last_name || ''}</p>
                      </div>
                      <div className="px-2 space-y-1">
                        {[
                          { id: 'info', icon: User, label: 'Shaxsiy ma\'lumotlarim' },
                          { id: 'orders', icon: Package, label: 'Buyurtmalarim' },
                          { id: 'addresses', icon: MapPin, label: 'Manzillarim' },
                          { id: 'notifications', icon: Bell, label: 'Bildirishnomalar' }
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setProfileTab(item.id as any);
                              setShowProfileModal(true);
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-4 px-4 py-3 text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-2xl transition-all group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                              <item.icon size={20} />
                            </div>
                            <span className="text-sm font-bold">{item.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="px-6 py-4 border-t border-slate-50 mt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yaratuvchi <span className="text-indigo-500">Savdogar.uz</span></p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Header: Categories Bar */}
      <div className="bg-white/50 backdrop-blur-md border-b border-slate-50 sticky top-24 z-[90]">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 py-3">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex-shrink-0 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${categoryFilter === 'all' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              Barchasi
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id.toString())}
                className={`flex-shrink-0 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${categoryFilter === cat.id.toString() ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
              >
                {ln(cat, 'name')}
              </button>
            ))}
          </div>
        </div>
      </div>


      <section className="relative overflow-hidden pt-12 pb-16 lg:py-24 text-center">
        {/* Banner Swiper */}
        {store.banners && store.banners.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 mb-16 overflow-hidden" style={{ borderRadius: 'var(--banner-radius)' }}>
            <Swiper
              modules={[Autoplay, Pagination, EffectFade, Navigation]}
              effect="fade"
              autoplay={{ delay: store.theme_config?.banner_speed || 5000 }}
              loop={store.theme_config?.infinite_scroll !== false}
              pagination={{ clickable: true }}
              navigation={!isPreview}
              className={`mySwiper ${isPreview ? 'h-[250px]' : 'h-[300px] md:h-[500px]'}`}
            >
              {store.banners.map((banner: any) => (
                <SwiperSlide key={banner.id}>
                  <div className="w-full h-full relative group">
                    <img
                      src={getMediaUrl(isPreview ? banner.mobile_image : (banner.desktop_image || banner.mobile_image || undefined))}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 md:p-16 text-left">
                      <motion.h3
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className={`font-black text-white uppercase tracking-tighter mb-4 ${isPreview ? 'text-2xl' : 'text-2xl md:text-5xl'}`}
                      >
                        {banner.title}
                      </motion.h3>
                      {banner.link_type !== 'none' && (
                        <button className="w-max px-6 py-3 bg-[var(--primary)] text-white text-xs font-black uppercase tracking-widest rounded-xl">
                          {t('shopNow') || 'View More'}
                        </button>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>

      {/* Search & Intro Area */}
      <section className="relative w-full z-10 pt-4 pb-12" style={getStyle('SearchArea')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {(!store.banners || store.banners.length === 0) && (
              <div className="mb-8 md:mb-12">
                <h2 className="text-4xl md:text-5xl lg:text-8xl font-black text-[var(--text-primary)] mb-4 md:mb-6 uppercase tracking-tighter leading-tight md:leading-none">
                  {store.name}
                </h2>
                <div className="h-1.5 md:h-2 w-16 md:w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mx-auto rounded-full mb-6 md:mb-8" />
              </div>
            )}
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed mb-10 px-4">
              {store.description || (language === 'uz' ? "Sifatli mahsulotlar va a'lo xizmat ko'rsatish bizning ustuvor vazifamizdir." : "Quality products and excellent service are our priority.")}
            </p>

            <div className="flex flex-col gap-4 p-2 md:p-3 rounded-[var(--border-radius)] bg-[var(--color-surface)] border border-[var(--color-border)] backdrop-blur-xl shadow-2xl">
              <div className="relative group flex-1">
                <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors z-10" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder') || 'Qidirish...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full !pl-12 sm:!pl-16 pr-4 sm:pr-6 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all font-medium text-base sm:text-lg shadow-inner"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <VoiceSearch
                  onResult={(text) => setSearchQuery(text)}
                  onAction={handleVoiceAction}
                  language={language}
                />
                {!isPreview && (
                  <VisualSearch
                    storeSlug={store?.slug}
                    onResultClick={(id) => {
                      const p = products.find((p: any) => p.id === id);
                      if (p) setSelectedProduct(p);
                    }}
                    language={language}
                  />
                )}
                <button
                  onClick={() => setReelsOpen(true)}
                  className="p-2.5 rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/30 transition-all"
                  title="Reels"
                >
                  <Play className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowFilters(true)}
                  className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary-och)] shadow-lg shadow-[var(--primary-glow)]' : 'bg-[var(--color-surface-raised)] text-[var(--text-muted)] border-[var(--color-border)] hover:bg-[var(--color-border)]'}`}
                  title="Advanced Filters"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowNearby(!showNearby)}
                  className={`p-3 rounded-xl border transition-all ${showNearby ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20' : 'bg-[var(--color-surface-raised)] text-[var(--text-muted)] border-[var(--color-border)] hover:bg-[var(--color-border)]'}`}
                  title="Nearby Stores"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Products Area */}
      <section className="relative w-full z-10 flex-1" style={getStyle('ProductsArea')}>
        {showNearby && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <NearbyStores onStoreClick={(id: number) => {
              // If we had a way to navigate to another store, we'd use it here.
              // For now, it just shows which store was clicked.
              console.log("Store clicked:", id);
            }} />
          </motion.div>
        )}

        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] overflow-hidden">
          <button
            onClick={() => {
              setCategoryFilter('all');
              setSelectedProduct(null);
              setShowNearby(false);
              setSearchQuery('');
            }}
            className="hover:text-[var(--primary)] transition-colors whitespace-nowrap"
          >
            {t('breadcrumbHome')}
          </button>

          {(categoryFilter !== 'all' || selectedProduct || searchQuery || showNearby) && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setSelectedProduct(null);
                  setShowNearby(false);
                  setSearchQuery('');
                }}
                className="hover:text-[var(--primary)] transition-colors whitespace-nowrap"
              >
                {t('breadcrumbAllCategories')}
              </button>
            </>
          )}

          {categoryFilter !== 'all' && !selectedProduct && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-[var(--text-primary)] whitespace-nowrap">
                {ln(categories.find(c => c.id.toString() === categoryFilter), 'name') || categories.find(c => c.id.toString() === categoryFilter)?.name}
              </span>
            </>
          )}

          {selectedProduct && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <button
                onClick={() => {
                  setCategoryFilter(selectedProduct.category?.toString() || 'all');
                  setSelectedProduct(null);
                }}
                className="hover:text-[var(--primary)] transition-colors whitespace-nowrap"
              >
                {selectedProduct.category_name}
              </button>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-[var(--text-primary)] truncate max-w-[150px] sm:max-w-[300px]">
                {ln(selectedProduct, 'name')}
              </span>
            </>
          )}

          {searchQuery && !selectedProduct && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-[var(--text-primary)] truncate">
                "{searchQuery}"
              </span>
            </>
          )}

          {showNearby && !selectedProduct && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-[var(--text-primary)]">
                {t('nearbyStores')}
              </span>
            </>
          )}
        </div>

        {/* Products Grid */}
        {renderProductsGrid()}
      </section>

      {/* Footer (Image 5) */}
      <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-100 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-xl">S</div>
                <span className="text-xl font-black text-slate-950 uppercase tracking-tighter">{store.name}</span>
              </div>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                {store.description || "Sifatli mahsulotlar va a'lo xizmat ko'rsatish bizning ustuvor vazifamizdir."}
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Ma'lumotlar</h4>
              <ul className="space-y-4">
                {['Biz haqimizda', 'Shaxsiy ma\'lumotlarim', 'Manzillarim', 'Bildirishnomalar'].map(item => (
                  <li key={item} className="text-sm font-bold text-slate-600 hover:text-indigo-500 cursor-pointer transition-all">{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Kategoriyalar</h4>
              <ul className="space-y-4">
                {categories.slice(0, 5).map(cat => (
                  <li key={cat.id} onClick={() => setCategoryFilter(cat.id.toString())} className="text-sm font-bold text-slate-600 hover:text-indigo-500 cursor-pointer transition-all">{ln(cat, 'name')}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Biz bilan bog'laning</h4>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <p className="text-sm font-bold text-slate-600 leading-tight">Uzbekistan, Tashkent Region, Chirchik, Bahor mahalla fuqarolar yig'ini</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2024 {store.name}. Barcha huquqlar himoyalangan.</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platforma:</span>
              <a href="https://savdogar.uz" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Savdogar.uz</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col">
      {mainContent}
      
      {/* Overlays and Modals - ALWAYS RENDERED */}
      <div className="z-[1000] relative">
        <CartModal
          show={cartOpen}
          setShow={setCartOpen}
          cart={cart}
          updateQuantity={updateQuantity}
          cartTotal={cartTotal}
          currency={currency}
          language={language}
          t={t}
          setCheckoutOpen={setCheckoutOpen}
        />

        <CheckoutModal
          show={checkoutOpen}
          setShow={setCheckoutOpen}
          isSubmitting={isSubmitting}
          t={t}
          language={language}
          deliveryType={deliveryType}
          setDeliveryType={setDeliveryType}
          storeId={storeId!}
          setSelectedDeliveryOption={setSelectedDeliveryOption}
          selectedDeliveryOption={selectedDeliveryOption}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          applyPromoCode={applyPromoCode}
          promoError={promoError}
          appliedPromo={appliedPromo}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          address={address}
          setAddress={setAddress}
          notes={notes}
          setNotes={setNotes}
          user={user}
          loyaltyPoints={loyaltyPoints}
          usePoints={usePoints}
          setUsePoints={setUsePoints}
          pointsRedeemed={pointsRedeemed}
          setPointsRedeemed={setPointsRedeemed}
          cart={cart}
          cartTotal={cartTotal}
          currency={currency}
          handlePlaceOrder={handlePlaceOrder}
        />

        <ProfileModal
          show={showProfileModal}
          setShow={setShowProfileModal}
          user={user}
          tab={profileTab}
          setTab={setProfileTab}
          orderFilter={orderFilter}
          setOrderFilter={setOrderFilter}
          orders={userOrders}
          addresses={userAddresses}
          addAddress={addAddress}
          deleteAddress={deleteAddress}
          setDefaultAddress={setDefaultAddress}
        />

        {/* Category Modal (Image 3) */}
        <AnimatePresence>
          {showCategoryModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110]" onClick={() => setShowCategoryModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[40px] shadow-2xl z-[120] overflow-hidden p-10"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Kategoriyalar</h2>
                  <button onClick={() => setShowCategoryModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-950"><X size={24} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setCategoryFilter(cat.id.toString()); setShowCategoryModal(false); }}
                      className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-slate-50 hover:bg-indigo-50 border border-slate-50 hover:border-indigo-100 transition-all group"
                    >
                      <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                        {cat.image ? (
                          <img src={getMediaUrl(cat.image)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{ln(cat, 'name')}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Address Modal (Image 1/2) */}
        <AnimatePresence>
          {showAddressModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110]" onClick={() => setShowAddressModal(false)} />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[40px] shadow-2xl z-[120] overflow-hidden"
              >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Yetkazish manzili</h2>
                  <button onClick={() => setShowAddressModal(false)} className="p-2 text-slate-400 hover:text-slate-950 transition-all"><X size={20} /></button>
                </div>
                <div className="p-10 space-y-8">
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500" />
                    <input
                      type="text"
                      placeholder="Manzilni kiriting..."
                      className="w-full h-16 bg-slate-50 border border-slate-50 rounded-2xl pl-16 pr-6 text-sm font-bold text-slate-950 outline-none focus:bg-white focus:border-indigo-100"
                    />
                  </div>
                  <div className="aspect-video w-full rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-slate-300" />
                    </div>
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all"><Plus size={20} /></button>
                      <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all"><Minus size={20} /></button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="w-full py-5 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    Davom etish
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>



        {/* Success Modal */}
        {
          orderComplete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
              <GlassCard className="max-w-md w-full p-10 text-center space-y-8 bg-[var(--color-surface-raised)] border-[var(--color-border)] shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                  <Check className="w-12 h-12 text-emerald-500 stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">{t('orderConfirmation')}</h2>
                  <p className="text-[var(--text-muted)] font-medium">
                    {language === 'uz' ? `Buyurtmangiz qabul qilindi: #${lastOrder?.order_number}` : `Ваш заказ принят: #${lastOrder?.order_number}`}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs mt-2 font-medium">{language === 'uz' ? "Siz bilan tez orada bog'lanamiz." : "Мы свяжемся с вами в ближайшее время."}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setOrderComplete(false); setTrackingOpen(true); }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Package className="w-5 h-5" />
                    {language === 'uz' ? 'Buyurtmani kuzatish' : 'Отследить заказ'}
                  </button>
                  <button
                    onClick={() => setOrderComplete(false)}
                    className="w-full py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--text-primary)] font-black uppercase tracking-widest hover:bg-[var(--color-surface-raised)] transition-all active:scale-95"
                  >
                    {language === 'uz' ? 'Tushunarli' : 'Понятно'}
                  </button>
                </div>
              </GlassCard>
            </div>
          )
        }

        {/* Real-time Order Tracking Modal */}
        <AnimatePresence>
          {trackingOpen && lastOrder && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]" onClick={() => setTrackingOpen(false)} />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[80] w-full max-w-2xl overflow-hidden pointer-events-none"
              >
                <div className="pointer-events-auto">
                  <div className="relative">
                    <button
                      onClick={() => setTrackingOpen(false)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white z-50 hover:bg-white/20 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <OrderTracking
                      orderId={lastOrder.id}
                      currentStatus={lastOrder.status}
                      orderNumber={lastOrder.order_number}
                      totalAmount={lastOrder.total}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Filter Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowFilters(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-sm bg-[var(--color-surface-raised)] border-l border-[var(--color-border)] shadow-2xl z-50 flex flex-col">
                <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
                  <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('filters')}</h2>
                  <button onClick={() => setShowFilters(false)} className="p-2.5 hover:bg-[var(--color-surface-raised)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                  {/* Sort By */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('sortBy')}</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'newest', label: t('newest') },
                        { id: 'price_low', label: t('priceLowHigh') },
                        { id: 'price_high', label: t('priceHighLow') },
                        { id: 'name_az', label: t('nameAZ') }
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={`px-4 py-3 rounded-xl text-xs font-bold text-left transition-all border ${sortBy === option.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary-och)] shadow-md' : 'bg-[var(--color-surface)] text-[var(--text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('priceRange')}</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{t('minPrice')}</span>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--text-primary)] font-bold text-sm focus:border-[var(--primary)] outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{t('maxPrice')}</span>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--text-primary)] font-bold text-sm focus:border-[var(--primary)] outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4">
                    <button
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-all font-bold text-sm text-[var(--text-primary)] shadow-sm"
                    >
                      <span>{t('inStockOnly')}</span>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${inStockOnly ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${inStockOnly ? 'translate-x-4' : ''}`} />
                      </div>
                    </button>

                    <button
                      onClick={() => setHasDiscount(!hasDiscount)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] transition-all font-bold text-sm text-[var(--text-primary)] shadow-sm"
                    >
                      <span>{t('hasDiscount')}</span>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${hasDiscount ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${hasDiscount ? 'translate-x-4' : ''}`} />
                      </div>
                    </button>
                  </div>

                </div>

                <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                  <button
                    onClick={() => {
                      setPriceRange({ min: 0, max: 50000000 });
                      setInStockOnly(false);
                      setSortBy('newest');
                      setHasDiscount(false);
                      setCategoryFilter('all');
                    }}
                    className="w-full py-4 rounded-2xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] border border-[var(--color-border)] transition-all shadow-sm"
                  >
                    {t('clearFilters')}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Product Detail Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
                onClick={() => setSelectedProduct(null)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-5xl bg-[var(--color-surface-raised)] rounded-3xl border border-[var(--color-border)] shadow-2xl z-50 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Product Image */}
                <div className="md:w-1/2 bg-[var(--color-surface)] relative flex items-center justify-center p-8">
                  {selectedProduct.images?.[0] ? (
                    <img src={getMediaUrl(selectedProduct.images[0].image) || undefined} alt={ln(selectedProduct, 'name')} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-800"><Package className="w-32 h-32 opacity-10" /></div>
                  )}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/60 rounded-xl text-white backdrop-blur-md transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Product Content & Reviews */}
                <div className="md:w-1/2 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="mb-6">
                    <p className="text-xs text-[var(--primary)] font-black uppercase tracking-widest mb-2">{selectedProduct.category_name}</p>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-4">
                      {ln(selectedProduct, 'name')}
                    </h2>
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
                        {(currentVariant?.price || selectedProduct.price).toLocaleString()} <span className="text-sm text-[var(--text-muted)]">UZS</span>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + window.location.pathname + '?product=' + selectedProduct.slug)}&text=${encodeURIComponent(selectedProduct.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/10 hover:bg-[#229ED9] hover:text-white transition-all shadow-sm"
                          title={t('shareTelegram')}
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.41-3.63 4.02-1.71 4.86-2.01 5.4-2.02.12 0 .39.03.56.17.14.11.18.26.19.38.01.07.01.23 0 .28z" /></svg>
                        </a>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(selectedProduct.name + ' - ' + window.location.origin + window.location.pathname + '?product=' + selectedProduct.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/10 hover:bg-[#25D366] hover:text-white transition-all shadow-sm"
                          title={t('shareWhatsApp')}
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 2c-5.518 0-9.989 4.443-9.989 9.92 0 1.748.452 3.447 1.306 4.938L2 22l5.315-1.385c1.451.785 3.085 1.199 4.751 1.2.001 0 .002 0 .003 0 5.518 0 9.99-4.443 9.99-9.92 0-2.651-1.042-5.148-2.936-7.025C17.227 3.003 14.717 2 12.031 2zm0 1.838c2.19 0 4.249.844 5.798 2.378 1.549 1.536 2.403 3.58 2.403 5.704 0 4.457-3.655 8.083-8.15 8.083-1.457.001-2.88-.382-4.116-1.107l-.296-.174-3.061.797.818-2.957-.192-.303c-.795-1.258-1.214-2.716-1.214-4.218.001-4.458 3.656-8.083 8.15-8.083zm-1.896 2.396c-.477.012-.863.264-.99.585-.12.304-.37.989-.136 1.838.234.85 1.517 2.059 1.802 2.321.284.262 2.128 1.956 3.9 3.03.626.381 1.055.516 1.411.52.373-.004.819-.24 1.1-.555.282-.315.422-.612.457-.866.035-.254.025-.478-.025-.562-.05-.084-.183-.133-.383-.234-.2-.1-.83-.41-1-.448-.17-.038-.3-.057-.425.132-.125.19-.481.605-.59.729-.109.124-.219.139-.419.039-.2-.099-.844-.312-1.608-.988-.595-.526-1.01-1.173-1.127-1.371-.117-.198-.013-.306.087-.405.09-.089.198-.233.297-.349.1-.117.133-.198.2-.33.066-.131.033-.247-.017-.348-.05-.1-.418-.946-.575-1.312-.119-.278-.239-.344-.475-.357-.133-.007-.27-.01-.41-.01z" /></svg>
                        </a>
                      </div>
                    </div>
                    <div className="prose prose-slate mb-8">
                      <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
                        {ln(selectedProduct, 'description') || t('noDescription')}
                      </p>
                    </div>

                    {/* Variant Selection */}
                    {(selectedProduct.variants?.length || 0) > 0 && (
                      <div className="space-y-6 mb-8 py-6 border-y border-[var(--color-border)]">
                        {/* Extract unique attributes from variants */}
                        {Array.from(new Set(selectedProduct.variants.flatMap((v: any) => Object.keys(v.attributes)))).map((attrName: any) => {
                          const values = Array.from(new Set(selectedProduct.variants
                            .filter((v: any) => v.active)
                            .map((v: any) => v.attributes[attrName])));

                          return (
                            <div key={attrName} className="space-y-3">
                              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{attrName}</label>
                              <div className="flex flex-wrap gap-2">
                                {values.map((val: any) => (
                                  <button
                                    key={val}
                                    onClick={() => setSelectedAttributes(prev => ({ ...prev, [attrName]: val }))}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedAttributes[attrName] === val
                                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-md'
                                      : 'bg-[var(--color-surface)] text-[var(--text-primary)] border-[var(--color-border)] hover:border-[var(--primary)]'
                                      }`}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {selectedProduct.variants.length > 0 && !currentVariant && (
                          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest animate-pulse">Variantni tanlang</p>
                        )}
                      </div>
                    )}

                    {/* Flash Sale Promo */}
                    <FlashSaleTimer productId={selectedProduct.id} />

                    {/* Group Buying Promo */}
                    <GroupBuyCard productId={selectedProduct.id} />
                  </div>

                  <div className="mt-auto space-y-4 mb-12">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                      <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]">{t('stock')}</span>
                      <span className={`font-black uppercase tracking-tight ${(currentVariant ? currentVariant.stock : selectedProduct.stock) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {(currentVariant ? currentVariant.stock : selectedProduct.stock) > 0 ? `${(currentVariant ? currentVariant.stock : selectedProduct.stock)} ${t('units') || 'units'}` : t('outOfStock')}
                      </span>
                    </div>

                    {!store.catalog_mode && (
                      <div className="space-y-3">
                        <button
                          onClick={() => { addToCart(selectedProduct, currentVariant); setSelectedProduct(null); }}
                          disabled={(currentVariant ? currentVariant.stock === 0 : selectedProduct.stock === 0) || ((selectedProduct.variants?.length || 0) > 0 && !currentVariant)}
                          className="w-full py-4 rounded-2xl bg-[var(--primary)] hover:brightness-110 text-[var(--primary-foreground)] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                          {(selectedProduct.variants?.length || 0) > 0 && !currentVariant ? 'Variantni tanlang' : t('addToCart')} <Plus className="w-5 h-5" />
                        </button>

                        {/* Social Ordering (Direct Messaging) */}
                        <div className="grid grid-cols-2 gap-3">
                          {store?.telegram_username && (
                            <a
                              href={`https://t.me/${store.telegram_username.replace('@', '')}?text=${encodeURIComponent(`Assalomu alaykum! Men ushbu mahsulotni buyurtma qilmoqchiman:

*${selectedProduct.name}${currentVariant ? ` (${Object.values(currentVariant.attributes).join(', ')})` : ''}*
Narxi: ${formatPrice(currentVariant?.price || selectedProduct.price)}

Havola: ${window.location.origin}${window.location.pathname}?product=${selectedProduct.slug}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/20 hover:bg-[#229ED9] hover:text-white transition-all font-medium text-xs text-center"
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.37-.48 1.02-.73 4-1.74 6.67-2.88 8.01-3.41 3.81-1.52 4.6-1.79 5.12-1.8.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.22z" />
                              </svg>
                              {t('buyTelegram')}
                            </a>
                          )}
                          {store?.phone && (
                            <a
                              href={`https://wa.me/${store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Assalomu alaykum! Men ushbu mahsulotni buyurtma qilmoqchiman:

*${selectedProduct.name}*
Narxi: ${formatPrice(selectedProduct.price)}

Havola: ${window.location.origin}${window.location.pathname}?product=${selectedProduct.slug}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white transition-all font-medium text-xs text-center"
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.446 4.432-9.877 9.881-9.877 2.639 0 5.119 1.026 6.985 2.894 1.866 1.868 2.891 4.348 2.891 6.988 0 5.448-4.434 9.88-9.884 9.88m8.411-18.292A11.05 11.05 0 0012.051 0C5.412 0 .004 5.408.004 12.049a11.03 11.03 0 001.694 5.918L0 24l6.135-1.61a11.02 11.02 0 005.91 1.692h.005c6.64 0 12.05-5.41 12.05-12.05a11.04 11.04 0 00-3.235-8.361" />
                              </svg>
                              {t('buyWhatsApp')}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendations Section */}
                  <RecommendationSection
                    type="similar"
                    productId={selectedProduct.id}
                    storeId={storeId}
                    title={t('similarProducts')}
                    onProductClick={(p) => setSelectedProduct(p)}
                  />

                  {/* Reviews Section */}
                  <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-6">{t('reviews')}</h3>

                    {/* AI Review Summary */}
                    <div className="mb-8">
                      <AIReviewSummary productId={selectedProduct.id} language={language} />
                    </div>

                    {/* Write Review Form */}
                    <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-8 shadow-sm">
                      <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">{t('writeReview')}</label>
                      <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className={`p-1 transition-all ${star <= newReview.rating ? 'text-amber-400' : 'text-slate-600'}`}
                          >
                            <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                      <TextArea
                        value={newReview.comment}
                        onChange={(val: string) => setNewReview({ ...newReview, comment: val })}
                        placeholder={t('yourReview')}
                        rows={3}
                        className="bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--text-primary)] mb-4"
                      />
                      <Button
                        onClick={() => submitReview(selectedProduct.id)}
                        disabled={isSubmittingReview || !newReview.comment}
                        className="w-full rounded-xl"
                      >
                        {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : t('submitReview')}
                      </Button>
                    </div>

                    {/* Reviews List */}
                    {reviewsLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>
                    ) : reviews.length === 0 ? (
                      <p className="text-center py-8 text-slate-500 font-medium uppercase tracking-widest text-xs">{t('noReviews')}</p>
                    ) : (
                      <div className="space-y-6 pb-8">
                        {reviews.map((review) => (
                          <div key={review.id} className="space-y-2 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-primary)] font-black text-sm">{review.user_name || t('customer')}</span>
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{review.comment}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* AI Assistant */}
        <AIAssistant />

        {/* Chat Support */}
        {storeId && <ChatSupport storeId={storeId} storeName={store.name} />}

        {/* AI Shopping Concierge */}
        {
          storeId && store && (
            <AiConcierge
              storeId={storeId}
              storeName={store.name}
              language={language}
              onAddToCart={(product) => addToCart(product)}
            />
          )
        }
        <AnimatePresence>
          {reelsOpen && (
            <ReelsFeed
              storeId={storeId}
              onClose={() => setReelsOpen(false)}
              onProductClick={(product) => {
                setSelectedProduct(product);
                setReelsOpen(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
