import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Automatically detect the dev machine IP — no ipconfig needed!
function getApiBaseUrl(): string {
  // In production, use your deployed URL
  const PRODUCTION_URL = 'https://your-backend.railway.app/api';
  
  if (__DEV__) {
    // Auto-detect dev machine IP from Expo
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    const ip = debuggerHost?.split(':')[0];
    if (ip) {
      return `http://${ip}:8000/api`;
    }
    // Fallback
    return 'http://localhost:8000/api';
  }
  
  return PRODUCTION_URL;
}

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Token interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = response.data.access;
          await AsyncStorage.setItem('access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  register: (data: any) =>
    api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
};

export const storeApi = {
  list: () => api.get('/stores/'),
  get: (id: number) => api.get(`/stores/${id}/`),
  create: (data: any) => api.post('/stores/', data),
  update: (id: number, data: any) => api.patch(`/stores/${id}/`, data),
};

export const productApi = {
  list: (params?: any) => api.get('/products/', { params }),
  get: (id: number) => api.get(`/products/${id}/`),
  create: (data: any) => api.post('/products/', data),
  update: (id: number, data: any) => api.patch(`/products/${id}/`, data),
  delete: (id: number) => api.delete(`/products/${id}/`),
};

export const orderApi = {
  list: (params?: any) => api.get('/orders/', { params }),
  get: (id: number) => api.get(`/orders/${id}/`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/`, { status }),
};

export const analyticsApi = {
  overview: (storeId: number) => api.get(`/analytics/overview/`, { params: { store: storeId } }),
};

export const categoryApi = {
  list: (params?: any) => api.get('/categories/', { params }),
};

export default api;
