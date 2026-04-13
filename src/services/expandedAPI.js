/**
 * Savdoon API Service - Expanded Features
 * Backend'dagi barcha yangi funksiyalar uchun API calls
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== DELIVERY FEATURES ====================

export const deliveryAPI = {
  // Zones
  getZones: (storeId) => api.get(`/delivery/zones/?store=${storeId}`),
  getZone: (id) => api.get(`/delivery/zones/${id}/`),
  createZone: (data) => api.post('/delivery/zones/', data),
  updateZone: (id, data) => api.put(`/delivery/zones/${id}/`, data),
  calculateZonePrice: (id, distance) => 
    api.get(`/delivery/zones/${id}/calculate_price/?distance_km=${distance}`),

  // Providers
  getProviders: (storeId) => api.get(`/delivery/providers/?store=${storeId}`),
  createProvider: (data) => api.post('/delivery/providers/', data),

  // Time Slots
  getTimeSlots: (storeId) => api.get(`/delivery/time-slots/?store=${storeId}`),
  getAvailableSlots: (storeId, day) => 
    api.get(`/delivery/time-slots/available_slots/?store_id=${storeId}&day=${day}`),

  // Pickup Points
  getPickupPoints: (storeId) => api.get(`/delivery/pickup-points/?store=${storeId}`),
  getNearbyPickupPoints: (lat, lng, radius = 10) => 
    api.get(`/delivery/pickup-points/nearby/?latitude=${lat}&longitude=${lng}&radius=${radius}`),

  // Routes (Courier)
  getMyRoutes: () => api.get('/delivery/routes/'),
  startRoute: (id) => api.post(`/delivery/routes/${id}/start_route/`),
  completeDelivery: (id) => api.post(`/delivery/routes/${id}/complete_delivery/`),

  // Pricing
  getPricing: (storeId) => api.get(`/delivery/pricing/?store=${storeId}`),
  calculatePrice: (id, data) => api.post(`/delivery/pricing/${id}/calculate/`, data),
};

// ==================== INVENTORY & WAREHOUSE ====================

export const inventoryAPI = {
  // Warehouses
  getWarehouses: (storeId) => api.get(`/products/warehouses/?store=${storeId}`),
  createWarehouse: (data) => api.post('/products/warehouses/', data),
  updateWarehouse: (id, data) => api.put(`/products/warehouses/${id}/`, data),

  // Warehouse Products
  getWarehouseProducts: (warehouseId) => 
    api.get(`/products/warehouse-products/?warehouse=${warehouseId}`),
  updateStock: (id, data) => api.put(`/products/warehouse-products/${id}/`, data),

  // Stock Movements
  getStockMovements: (productId) => 
    api.get(`/products/stock-movements/?warehouse_product=${productId}`),

  // Transfers
  getTransfers: (storeId) => api.get(`/products/stock-transfers/?store=${storeId}`),
  createTransfer: (data) => api.post('/products/stock-transfers/', data),

  // Alerts
  getAlerts: (warehouseId) => 
    api.get(`/products/stock-alerts/?warehouse=${warehouseId}&is_resolved=false`),
  resolveAlert: (id) => api.put(`/products/stock-alerts/${id}/`, { is_resolved: true }),

  // Batches
  getBatches: (productId) => api.get(`/products/batches/?warehouse_product=${productId}`),
};

// ==================== LOYALTY PROGRAM ====================

export const loyaltyAPI = {
  // Customer Loyalty
  getMyLoyalty: (storeId) => api.get(`/marketing/customer-loyalty/?store=${storeId}`),
  getLoyaltyHistory: (id) => api.get(`/marketing/loyalty-transactions/?customer_loyalty=${id}`),

  // Referral
  getReferralProgram: (storeId) => 
    api.get(`/marketing/referral-programs/?store=${storeId}&is_active=true`),
  createReferral: (data) => api.post('/marketing/referrals/', data),
  getMyReferrals: () => api.get('/marketing/referrals/?referrer=me'),

  // Coupons
  getCoupons: (storeId) => api.get(`/marketing/coupons/?store=${storeId}&is_active=true`),
  getMyCoupons: () => api.get('/marketing/customer-coupons/?is_used=false'),
  applyCoupon: (code) => api.post('/marketing/coupons/validate/', { code }),

  // Tiers
  getTiers: (programId) => api.get(`/marketing/loyalty-tiers/?program=${programId}`),
};

// ==================== PRODUCT ENHANCEMENTS ====================

export const productEnhancementAPI = {
  // Videos
  getProductVideos: (productId) => api.get(`/products/product-videos/?product=${productId}`),
  uploadVideo: (data) => api.post('/products/product-videos/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // 360 Images
  getProduct360Images: (productId) => 
    api.get(`/products/product-images-360/?product=${productId}`),

  // Bundles
  getBundles: (storeId) => api.get(`/products/product-bundles/?store=${storeId}&is_active=true`),
  getBundle: (id) => api.get(`/products/product-bundles/${id}/`),

  // Subscriptions
  getSubscriptions: (storeId) => 
    api.get(`/products/product-subscriptions/?product__store=${storeId}`),
  createSubscription: (data) => api.post('/products/customer-subscriptions/', data),
  getMySubscriptions: () => api.get('/products/customer-subscriptions/?customer=me'),
  pauseSubscription: (id) => api.post(`/products/customer-subscriptions/${id}/pause/`),
  cancelSubscription: (id) => api.post(`/products/customer-subscriptions/${id}/cancel/`),

  // Pre-orders
  getPreOrders: (storeId) => 
    api.get(`/products/product-preorders/?product__store=${storeId}&is_available=true`),
  createPreOrder: (data) => api.post('/products/pre-orders/', data),

  // Back in Stock
  notifyBackInStock: (productId) => 
    api.post('/products/back-in-stock-notifications/', { product: productId }),
};

// ==================== B2B FEATURES ====================

export const b2bAPI = {
  // Corporate Accounts
  getCorporateAccount: () => api.get('/savdoon/corporate-accounts/me/'),
  requestCorporateAccount: (data) => api.post('/savdoon/corporate-accounts/', data),

  // Bulk Orders
  getBulkOrders: () => api.get('/savdoon/bulk-orders/'),
  createBulkOrder: (data) => api.post('/savdoon/bulk-orders/', data),

  // Wholesale Prices
  getWholesalePrices: (productId) => 
    api.get(`/products/wholesale-prices/?product=${productId}`),

  // Suppliers (Admin)
  getSuppliers: (storeId) => api.get(`/savdoon/suppliers/?store=${storeId}`),
  createSupplier: (data) => api.post('/savdoon/suppliers/', data),

  // Purchase Orders (Admin)
  getPurchaseOrders: (storeId) => 
    api.get(`/savdoon/purchase-orders/?store=${storeId}`),
  createPurchaseOrder: (data) => api.post('/savdoon/purchase-orders/', data),
};

// ==================== CUSTOMER SUPPORT ====================

export const supportAPI = {
  // Tickets
  getTickets: () => api.get('/savdoon/support-tickets/'),
  createTicket: (data) => api.post('/savdoon/support-tickets/', data),
  getTicket: (id) => api.get(`/savdoon/support-tickets/${id}/`),
  sendMessage: (ticketId, message) => 
    api.post(`/savdoon/tickets/${ticketId}/messages/`, { message }),

  // FAQ
  getFAQs: (storeId, category) => 
    api.get(`/savdoon/faqs/?store=${storeId}&category=${category || ''}`),
};

// ==================== ANALYTICS ====================

export const analyticsAPI = {
  // Sales
  getSalesReport: (storeId, startDate, endDate) => 
    api.get(`/savdoon/analytics/sales/?store=${storeId}&start=${startDate}&end=${endDate}`),
  getTopProducts: (storeId, limit = 10) => 
    api.get(`/savdoon/analytics/top-products/?store=${storeId}&limit=${limit}`),

  // Customers
  getCustomerLifetimeValue: (storeId) => 
    api.get(`/savdoon/analytics/clv/?store=${storeId}`),

  // Inventory
  getInventoryReport: (warehouseId) => 
    api.get(`/savdoon/analytics/inventory/?warehouse=${warehouseId}`),

  // Export
  exportReport: (type, params) => 
    api.get(`/savdoon/analytics/export/${type}/`, { params, responseType: 'blob' }),
};

// ==================== DEVELOPER TOOLS ====================

export const developerAPI = {
  // API Keys
  getAPIKeys: (storeId) => api.get(`/savdoon/api-keys/?store=${storeId}`),
  createAPIKey: (data) => api.post('/savdoon/api-keys/', data),
  deleteAPIKey: (id) => api.delete(`/savdoon/api-keys/${id}/`),

  // Webhooks
  getWebhooks: (storeId) => api.get(`/savdoon/webhooks/?store=${storeId}`),
  createWebhook: (data) => api.post('/savdoon/webhooks/', data),
  updateWebhook: (id, data) => api.put(`/savdoon/webhooks/${id}/`, data),
};

// ==================== QUICK WINS ====================

export const quickWinsAPI = {
  // Wishlist
  getWishlist: () => api.get('/products/wishlist/'),
  addToWishlist: (productId) => api.post('/products/wishlist/', { product: productId }),
  removeFromWishlist: (id) => api.delete(`/products/wishlist/${id}/`),

  // Recently Viewed
  getRecentlyViewed: () => api.get('/products/recently-viewed/'),
  trackView: (productId) => api.post('/products/recently-viewed/', { product: productId }),

  // Compare
  getCompareList: () => api.get('/products/compare/'),
  addToCompare: (productId) => api.post('/products/compare/', { product: productId }),

  // Reviews with Photos
  uploadReviewPhoto: (reviewId, photo) => {
    const formData = new FormData();
    formData.append('photo', photo);
    return api.post(`/products/reviews/${reviewId}/photos/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Product Badges
  getProductBadges: (storeId) => api.get(`/products/badges/?store=${storeId}`),
};

export default api;
