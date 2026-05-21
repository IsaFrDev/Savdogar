import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'superadmin' | 'store_admin';
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const response = await authApi.me();
        setUser(response.data);
      }
    } catch (error: any) {
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      }
      console.error('Check user failed', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    const response = await authApi.login(email, pass);
    const data = response.data;

    // Handle 2FA required
    if (data.two_factor_required) {
      return data;
    }

    // Backend returns { user, tokens: { access, refresh } }
    const { user: userData, tokens } = data;
    await AsyncStorage.setItem('access_token', tokens.access);
    await AsyncStorage.setItem('refresh_token', tokens.refresh);
    setUser(userData);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      setUser(response.data);
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
