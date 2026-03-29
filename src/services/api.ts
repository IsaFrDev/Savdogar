import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '0.0.0.0'))
        ? 'http://localhost:8000/api'
        : `${typeof window !== 'undefined' ? window.location.origin : ''}/api`);

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

/** Persist access + rotated refresh (SIMPLE_JWT ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION). */
function applyTokenRefreshPayload(data: { access: string; refresh?: string }) {
    localStorage.setItem('access_token', data.access);
    if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
    }
}

// Add token to requests with proactive refresh
api.interceptors.request.use(async (config) => {
    let token = localStorage.getItem('access_token');

    if (token) {
        // Decode JWT to check expiration
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000;
            const now = Date.now();

            // If token expires in less than 5 minutes, refresh it proactively
            if (expiry - now < 300000 && !config.url?.includes('/auth/token/refresh/')) {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    if (isRefreshing) {
                        token = await new Promise((resolve) => {
                            subscribeTokenRefresh((newToken) => resolve(newToken));
                        });
                    } else {
                        isRefreshing = true;
                        try {
                            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                                refresh: refreshToken,
                            });
                            applyTokenRefreshPayload(response.data);
                            token = response.data.access;
                            isRefreshing = false;
                            onRefreshed(response.data.access);
                        } catch (refreshError: any) {
                            isRefreshing = false;
                            const st = refreshError.response?.status;
                            if (st === 401 || st === 403 || st === 400) {
                                localStorage.removeItem('access_token');
                                localStorage.removeItem('refresh_token');
                                if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                                    window.location.href = '/login';
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Invalid token format
        }

        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token refresh with concurrency queue
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't intercept 401s for login and device verification endpoints
            if (originalRequest.url?.includes('/auth/login/') || originalRequest.url?.includes('/auth/device/verify/')) {
                return Promise.reject(error);
            }

            // If refresh token call itself fails with 401/403, logout
            if (originalRequest.url?.includes('/auth/token/refresh/')) {
                const st = error.response?.status;
                if (st === 401 || st === 403 || st === 400) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    applyTokenRefreshPayload(response.data);
                    const access = response.data.access;
                    isRefreshing = false;
                    onRefreshed(access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                } catch (refreshError: any) {
                    isRefreshing = false;

                    const st = refreshError.response?.status;
                    if (st === 401 || st === 403 || st === 400) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                            window.location.href = '/login';
                        }
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                localStorage.removeItem('access_token');
                if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    register: (data: {
        email: string;
        username: string;
        password: string;
        password2: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        role?: string;
    }) => api.post('/auth/register/', data),

    login: (email: string, password: string) =>
        api.post('/auth/login/', { email, password }),

    superAdminLogin: (username: string, password: string) =>
        api.post('/auth/superadmin/login/', { username, password }),

    me: () => api.get('/auth/me/'),

    refreshToken: (refresh: string) =>
        api.post('/auth/token/refresh/', { refresh }),

    // Face ID / WebAuthn
    getFaceIdRegisterOptions: () => api.get('/auth/face-id/register/'),
    registerFaceId: (registration_response: Record<string, unknown>) =>
        api.post('/auth/face-id/register/', { registration_response }),

    getFaceIdLoginOptions: (email?: string) =>
        api.get('/auth/face-id/login/', { params: email ? { email: email.trim() } : {} }),

    loginWithFaceId: (authentication_response: Record<string, unknown>) =>
        api.post('/auth/face-id/login/', { authentication_response }),

    listUsers: () => api.get('/auth/users/'),
    createUser: (data: any) => api.post('/auth/users/create/', data),
    deleteUser: (id: number) => api.delete(`/auth/users/${id}/delete/`),
    updateUser: (id: number, data: any) => api.patch(`/auth/users/${id}/update/`, data),

    // Profile & Security
    updateProfile: (data: any) => api.patch('/auth/profile/update/', data),
    updatePassword: (data: any) => api.post('/auth/password/change/', data),

    // 2FA
    setup2FA: () => api.post('/auth/2fa/setup/'),
    enable2FA: (code: string) => api.post('/auth/2fa/enable/', { code }),
    verify2FA: (email: string, code: string, useBackupCode: boolean = false) =>
        api.post('/auth/2fa/verify/', { email, code, use_backup_code: useBackupCode }),
    disable2FA: () => api.post('/auth/2fa/disable/'),

    // Sessions
    listSessions: () => api.get('/auth/sessions/'),
    endSession: (id: number) => api.delete(`/auth/sessions/${id}/end/`),
    endAllSessions: () => api.post('/auth/sessions/end-all/'),
    getLoginHistory: (limit: number = 50) => api.get('/auth/login-history/', { params: { limit } }),

    // Device Guard
    verifyDevice: (code: string, tempToken: string, deviceName?: string, remember: boolean = true) =>
        api.post('/auth/device/verify/', {
            code,
            temp_token: tempToken,
            device_name: deviceName,
            remember_device: remember
        }),

    listTrustedDevices: () => api.get('/auth/device/trusted/'),
    deleteTrustedDevice: (id: number) => api.delete(`/auth/device/trusted/${id}/`),
};

// Store API
export const storeApi = {
    list: () => api.get('/stores/'),

    get: (id: number) => api.get(`/stores/${id}/`),

    getBySlug: (slug: string) => api.get('/stores/by_slug/', { params: { slug } }),

    create: (data: any) => {
        if (data instanceof FormData) {
            return api.post('/stores/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.post('/stores/', data);
    },

    update: (id: number, data: any) => {
        if (data instanceof FormData) {
            return api.patch(`/stores/${id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.patch(`/stores/${id}/`, data);
    },

    delete: (id: number) => api.delete(`/stores/${id}/`),

    downloadContract: (id: number) =>
        api.get(`/stores/${id}/download_contract/`, { responseType: 'blob' }),

    getContractTemplate: (lang: string = 'en') =>
        api.get('/stores/contract-template/', { params: { lang } }),

    // Super admin
    getPendingStores: () => api.get('/stores/pending/'),

    approveStore: (id: number) => api.post(`/stores/${id}/approve/`, { action: 'approve' }),
    rejectStore: (id: number, reason?: string) => api.post(`/stores/${id}/approve/`, { action: 'reject', reason }),
    testTelegram: (id: number, data: { bot_token: string; chat_id: string }) => api.post(`/stores/${id}/test_telegram/`, data),
    generateApiKey: (id: number) => api.post(`/stores/${id}/generate-api-key/`),
    sendNewsletter: (id: number, data: { title: string; message: string; title_uz?: string; message_uz?: string; title_ru?: string; message_ru?: string }) =>
        api.post(`/stores/${id}/send_newsletter/`, data),
    getNearby: (lat: number, lng: number, radius: number = 50) =>
        api.get('/stores/nearby/', { params: { lat, lng, radius } }),

    // Marketplace
    getMarketplace: () => api.get('/stores/marketplace/'),

    // Staff Management
    listStaff: (storeId: number) => api.get(`/stores/${storeId}/staff/`),
    addStaff: (storeId: number, data: { email: string; role: string }) => api.post(`/stores/${storeId}/staff/`, data),
    removeStaff: (storeId: number, staffId: number) => api.delete(`/stores/${storeId}/staff/${staffId}/`),
    toggleStaffPermission: (storeId: number, staffId: number, data: { action: string; allowed: boolean }) =>
        api.post(`/stores/${storeId}/staff/${staffId}/toggle_permission/`, data),
    getExchangeRates: () => api.get('/stores/exchange-rates/'),
    acknowledgeRejection: () => api.post('/stores/acknowledge-rejection/'),
};

// Product API
export const productApi = {
    list: (params?: { store?: number; category?: number; search?: string; active?: boolean }) =>
        api.get('/products/', { params }),

    get: (id: number) => api.get(`/products/${id}/`),

    create: (data: any) => {
        if (data instanceof FormData) {
            return api.post('/products/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.post('/products/', data);
    },

    update: (id: number, data: any) => api.patch(`/products/${id}/`, data),

    delete: (id: number) => api.delete(`/products/${id}/`),

    addImage: (id: number, image: File, altText?: string) => {
        const formData = new FormData();
        formData.append('image', image);
        if (altText) formData.append('alt_text', altText);
        return api.post(`/products/${id}/add_image/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    // Public (no auth)
    listPublic: (params?: { store_slug?: string; store?: number }) =>
        api.get('/products/public/', { params }),

    // AI
    generateDescription: (name: string, category?: string, lang: string = 'uz') =>
        api.get('/products/ai-description/', { params: { name, category, lang } }),

    generateMarketingPost: (name: string, description: string, platform: string = 'instagram', lang: string = 'uz') =>
        api.get('/products/ai-marketing/', { params: { name, description, platform, lang } }),

    getPriceRecommendation: (productId: number) =>
        api.get(`/products/${productId}/ai-price/`),

    getRecommendations: (params: { product?: number; store?: number; type?: 'similar' | 'popular' | 'new' }) =>
        api.get('/products/recommendations/', { params }),
    getAiAnalytics: (storeId: string) => api.get(`/products/ai/analytics/?store=${storeId}`),
    getAiDynamicPricing: (storeId: string) => api.get(`/products/ai/dynamic-pricing/?store=${storeId}`),
    getAiCustomerInsights: (storeId: string) => api.get(`/products/ai/customer-insights/?store=${storeId}`),
    // POS
    posSale: (data: { store_id: number; items: { product_id: number; quantity: number }[]; payment_method: string }) =>
        api.post('/products/pos/sale/', data),
    posBarcodeSearch: (barcode: string, storeId: number) =>
        api.get('/products/pos/barcode/', { params: { barcode, store: storeId } }),
    // AI Concierge
    aiConcierge: (data: { store_id: number; message: string; store_name?: string; language?: string }) =>
        api.post('/products/ai/concierge/', data),

    importExcel: (file: File, storeId?: number) => {
        const formData = new FormData();
        formData.append('file', file);
        if (storeId) formData.append('store', storeId.toString());
        return api.post('/products/import_excel/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    exportExcel: () => api.get('/products/export_excel/', { responseType: 'blob' }),
};

// Category API
export const categoryApi = {
    list: (storeId?: number) =>
        api.get('/products/categories/', { params: { store: storeId } }),

    listPublic: (storeId: number) =>
        api.get('/products/public-categories/', { params: { store: storeId } }),

    create: (data: any) => {
        if (data instanceof FormData) {
            return api.post('/products/categories/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.post('/products/categories/', data);
    },

    update: (id: number, data: any) => {
        if (data instanceof FormData) {
            return api.patch(`/products/categories/${id}/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.patch(`/products/categories/${id}/`, data);
    },

    delete: (id: number) => api.delete(`/products/categories/${id}/`),
};

// Attribute API
export const attributeApi = {
    list: (storeId?: number) => api.get('/products/attributes/', { params: { store: storeId } }),
    create: (data: any) => api.post('/products/attributes/', data),
    update: (id: number, data: any) => api.patch(`/products/attributes/${id}/`, data),
    delete: (id: number) => api.delete(`/products/attributes/${id}/`),
};

// Variant API
export const variantApi = {
    list: (productId?: number) => api.get('/products/variants/', { params: { product: productId } }),
    create: (data: any) => api.post('/products/variants/', data),
    update: (id: number, data: any) => api.patch(`/products/variants/${id}/`, data),
    delete: (id: number) => api.delete(`/products/variants/${id}/`),
};

// Order API
export const orderApi = {
    list: (params?: { store?: number; status?: string }) =>
        api.get('/orders/', { params }),

    get: (id: number) => api.get(`/orders/${id}/`),

    create: (data: {
        store_id: number;
        customer_name: string;
        customer_email?: string;
        customer_phone: string;
        delivery_type: 'pickup' | 'delivery';
        delivery_address?: string;
        payment_method?: 'cash' | 'card';
        notes?: string;
        points_to_redeem?: number;
        items: { product_id: number; quantity: number }[];
    }) => api.post('/orders/create/', data),

    updateStatus: (id: number, status: string) =>
        api.patch(`/orders/${id}/update_status/`, { status }),

    getStats: (storeId?: number, period?: string) =>
        api.get('/orders/stats/', { params: { store: storeId, period } }),

    assignCourier: (orderId: number, data: { courier_id: number; note?: string }) =>
        api.post(`/orders/${orderId}/assign_courier/`, data),
};

// Inventory API
export const inventoryApi = {
    getOverview: (storeId: number) =>
        api.get('/inventory/', { params: { store_id: storeId } }),

    updateStock: (productId: number, quantity: number, type: 'set' | 'add' | 'subtract' = 'set') =>
        api.post('/inventory/update/', { product_id: productId, quantity, type }),

    bulkUpdate: (updates: { product_id: number; quantity: number }[]) =>
        api.post('/inventory/bulk-update/', { updates }),
};

// Delivery API
export const deliveryApi = {
    calculatePrice: (fromLat: number, fromLng: number, toLat: number, toLng: number, weight?: number) =>
        api.get('/delivery/price/', { params: { from_lat: fromLat, from_lng: fromLng, to_lat: toLat, to_lng: toLng, weight } }),

    getOptions: (storeId: number, lat?: number, lng?: number, weight?: number) =>
        api.post('/delivery/options/', { store_id: storeId, lat, lng, weight }),

    getCouriers: (params?: { store?: number }) =>
        api.get('/delivery/management/', { params }),

    addCourier: (data: any) =>
        api.post('/delivery/management/', data),

    // Self endpoints for couriers
    getProfile: () =>
        api.get('/delivery/self/profile/'),

    updateStatus: (status: string) =>
        api.post('/delivery/self/update_status/', { status }),

    updateLocation: (lat: number, lng: number) =>
        api.post('/delivery/self/update_location/', { latitude: lat, longitude: lng }),
};

// Analytics API
export const analyticsApi = {
    getSales: (storeId: number, period: string = 'day', days: number = 30) =>
        api.get('/analytics/sales/', { params: { store_id: storeId, period, days } }),

    getTopProducts: (storeId: number, limit: number = 10) =>
        api.get('/analytics/top-products/', { params: { store_id: storeId, limit } }),

    getCustomers: (storeId: number) =>
        api.get('/analytics/customers/', { params: { store_id: storeId } }),

    exportData: (storeId: number, type: 'orders' | 'products' | 'customers' = 'orders') =>
        api.get('/analytics/export/', { params: { store_id: storeId, type }, responseType: 'blob' }),
};

export const aiApi = {
    getChatResponse: (data: {
        message: string;
        history?: any[];
        products?: any[];
        store_info?: any;
        language?: string;
    }) => api.post('/ai/chatbot/', data),

    translateProduct: (data: {
        name: string;
        description: string;
        source_lang: string;
    }) => api.post('/ai/translate-product/', data),

    translateText: (data: {
        text: string;
        target_lang: string;
    }) => api.post('/products/ai/translate/', data),

    draftReviewReply: (data: {
        review_text: string;
        rating: number;
        customer_name?: string;
        language?: string;
    }) => api.post('/ai/draft-review-reply/', data),

    generateSeoTags: (data: {
        name: string;
        description: string;
        language?: string;
    }) => api.post('/products/ai-seo/', data),

    enhanceImage: (data: {
        image: string; // base64
        action?: 'polish' | 'remove_bg' | 'both';
    }) => api.post('/ai/enhance-image/', data),

    analyzeTheme: (data: {
        image: string; // base64
        language?: string;
    }) => api.post('/ai/analyze-theme/', data),

    analyzeLogo: (data: {
        image_data: string; // base64
    }) => api.post('/ai/analyze-logo/', data),

    virtualTryOn: (data: {
        person_image: string; // base64
        garment_image: string; // base64
    }) => api.post('/ai/virtual-try-on/', data),

    generateSketch: (data: {
        prompt: string;
        language?: string;
    }) => api.post('/ai/generate-sketch/', data),

    getVoiceCommandResponse: (data: {
        text: string;
        language?: string;
    }) => api.post('/products/ai/voice-command/', data),

    getReviewSummary: (params: {
        product: number;
        language?: string;
    }) => api.get('/products/ai/review-summary/', { params }),

    getAIInventoryInsights: (storeId: number, language: string = 'uz') =>
        api.get('/products/ai/inventory-insights/', { params: { store: storeId, language } }),

    getCompetitorInsights: (params: { product_id: number; competitors?: any[]; language?: string }) =>
        api.post('/products/ai/competitor-monitor/', params),

    globalSearch: (params: { q: string; lang?: string }) =>
        api.get('/products/global-ai-search/', { params }),

    analyzeBusiness: (data: { description: string; business_type: string; language?: string }) =>
        api.post('/ai/analyze-business/', data),
};

// ============= MARKETING APIS =============
export const marketingApi = {
    getReels: (storeId?: number) => api.get('/marketing/reels/', { params: { store: storeId } }),
    createReel: (data: any) => {
        if (data instanceof FormData) {
            return api.post('/marketing/reels/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.post('/marketing/reels/', data);
    },
    deleteReel: (id: number) => api.delete(`/marketing/reels/${id}/`),

    getGroupBuys: () => api.get('/marketing/group-buys/'),
    createGroupBuy: (data: any) => api.post('/marketing/group-buys/', data),
    deleteGroupBuy: (id: number) => api.delete(`/marketing/group-buys/${id}/`),

    getFlashSales: () => api.get('/marketing/flash-sales/'),
    createFlashSale: (data: any) => api.post('/marketing/flash-sales/', data),
    deleteFlashSale: (id: number) => api.delete(`/marketing/flash-sales/${id}/`),

    generateSMMContent: (params: { product_id: number; platform: string; language: string }) =>
        api.post('/marketing/ai/generate-smm/', params),
};

// ============= NEW FEATURE APIS =============

// Discount API
export const discountApi = {
    list: (storeId?: number) =>
        api.get('/products/discounts/', { params: { store: storeId } }),
    get: (id: number) => api.get(`/products/discounts/${id}/`),
    create: (data: any) => api.post('/products/discounts/', data),
    update: (id: number, data: any) => api.patch(`/products/discounts/${id}/`, data),
    delete: (id: number) => api.delete(`/products/discounts/${id}/`),
};

// Promo Code API
export const promoCodeApi = {
    list: (storeId?: number) =>
        api.get('/products/promo-codes/', { params: { store: storeId } }),
    get: (id: number) => api.get(`/products/promo-codes/${id}/`),
    create: (data: any) => api.post('/products/promo-codes/', data),
    update: (id: number, data: any) => api.patch(`/products/promo-codes/${id}/`, data),
    delete: (id: number) => api.delete(`/products/promo-codes/${id}/`),
    apply: (data: { code: string; store_id: number; order_total: number }) =>
        api.post('/products/promo-codes/apply/', data),
};

// Wishlist API
export const wishlistApi = {
    list: () => api.get('/products/wishlist/'),
    toggle: (productId: number) =>
        api.post('/products/wishlist/toggle/', { product_id: productId }),
    remove: (id: number) => api.delete(`/products/wishlist/${id}/`),
};

// Review API
export const reviewApi = {
    list: (params?: { product?: number; store?: number }) =>
        api.get('/products/reviews/', { params }),
    create: (data: { product: number; store: number; rating: number; comment?: string }) =>
        api.post('/products/reviews/', data),
    update: (id: number, data: any) => api.patch(`/products/reviews/${id}/`, data),
    delete: (id: number) => api.delete(`/products/reviews/${id}/`),
    stats: (productId: number) =>
        api.get('/products/reviews/stats/', { params: { product: productId } }),
};

// Notification API
export const notificationApi = {
    list: () => api.get('/notifications/'),
    markRead: (id: number) => api.post(`/notifications/${id}/read/`),
    markAllRead: () => api.post('/notifications/mark-all-read/'),
    unreadCount: () => api.get('/notifications/unread-count/'),
    delete: (id: number) => api.delete(`/notifications/${id}/delete/`),
};

// Search API
export const searchApi = {
    search: (params: {
        q?: string;
        store?: number;
        category?: number;
        price_min?: number;
        price_max?: number;
        in_stock?: boolean;
        has_discount?: boolean;
        sort?: string;
    }) => api.get('/products/search/', { params }),
};

// Recently Viewed API
export const recentlyViewedApi = {
    list: () => api.get('/products/recently-viewed/'),
    track: (productId: number) => api.post('/products/track-view/', { product_id: productId }),
};

// Recommendations API
export const recommendationsApi = {
    getSimilar: (productId: number) =>
        api.get('/products/recommendations/', { params: { product: productId, type: 'similar' } }),
    getPopular: (storeId?: number) =>
        api.get('/products/recommendations/', { params: { store: storeId, type: 'popular' } }),
    getNew: (storeId?: number) =>
        api.get('/products/recommendations/', { params: { store: storeId, type: 'new' } }),
};

// Loyalty API
export const loyaltyApi = {
    getPoints: () => api.get('/auth/loyalty/points/'),
    getTransactions: (storeId?: number) => api.get('/auth/loyalty/transactions/', { params: { store: storeId } }),
};

// ========== NEW FEATURES APIs ==========

// Branches API
export const branchApi = {
    list: (storeId: number) => api.get(`/stores/${storeId}/branches/`),
    create: (storeId: number, data: any) => api.post(`/stores/${storeId}/branches/`, data),
    update: (storeId: number, id: number, data: any) => api.patch(`/stores/${storeId}/branches/${id}/`, data),
    delete: (storeId: number, id: number) => api.delete(`/stores/${storeId}/branches/${id}/`),
};

// Store Banners API
export const bannerApi = {
    list: (storeId: number) => api.get(`/stores/${storeId}/banners/`),
    create: (storeId: number, data: FormData) => api.post(`/stores/${storeId}/banners/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (storeId: number, id: number, data: any) => api.patch(`/stores/${storeId}/banners/${id}/`, data),
    delete: (storeId: number, id: number) => api.delete(`/stores/${storeId}/banners/${id}/`),
};

// Staff Roles API
export const staffRoleApi = {
    list: (storeId: number) => api.get(`/stores/${storeId}/staff-roles/`),
    create: (storeId: number, data: any) => api.post(`/stores/${storeId}/staff-roles/`, data),
    update: (storeId: number, id: number, data: any) => api.patch(`/stores/${storeId}/staff-roles/${id}/`, data),
    delete: (storeId: number, id: number) => api.delete(`/stores/${storeId}/staff-roles/${id}/`),
};

// Staff Members API
export const staffApi = {
    list: (storeId: number, type?: string) => api.get(`/stores/${storeId}/staff/`, { params: type ? { type } : {} }),
    create: (storeId: number, data: any) => api.post(`/stores/${storeId}/staff/`, data),
    update: (storeId: number, id: number, data: any) => api.patch(`/stores/${storeId}/staff/${id}/`, data),
    delete: (storeId: number, id: number) => api.delete(`/stores/${storeId}/staff/${id}/`),
};

// IKPU API
export const ikpuApi = {
    list: (storeId: number) => api.get(`/stores/${storeId}/ikpu/`),
    create: (storeId: number, data: any) => api.post(`/stores/${storeId}/ikpu/`, data),
    update: (storeId: number, id: number, data: any) => api.patch(`/stores/${storeId}/ikpu/${id}/`, data),
    delete: (storeId: number, id: number) => api.delete(`/stores/${storeId}/ikpu/${id}/`),
};

// System & Terminal API
export const systemApi = {
    executeCommand: (command: string) => api.post('/system/terminal/', { command }),
    exportProductsJson: (storeId: number) => 
        api.get(`/products/export_json/`, { params: { store: storeId }, responseType: 'blob' }),
};

export default api;
