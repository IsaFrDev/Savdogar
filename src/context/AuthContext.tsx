import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';

interface User {
    id: string;
    email?: string;
    username: string;
    first_name: string;
    last_name: string;
    role: 'superadmin' | 'store_admin';
    is_superuser: boolean;
    is_staff: boolean;
    phone?: string;
    avatar?: string;
    limit_date?: string;
    store_status: 'pending' | 'approved' | 'rejected' | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
    login: (email: string, password: string) => Promise<any>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    updatePassword: (data: any) => Promise<void>;
    verifyDevice: (code: string, tempToken: string) => Promise<any>;
    verify2FA: (email: string, code: string, useBackupCode?: boolean) => Promise<any>;
    loginWithFaceId: (email?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Check local session (AvtoX style for persistent login)
        const localSession = localStorage.getItem('local_admin_session');
        if (localSession) {
            setUser(JSON.parse(localSession));
            setIsLoading(false);
            // Don't return here, let Supabase also check in background
        }

        // 2. Initial Supabase session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                if (!localSession) setIsLoading(false);
            }
        });

        // 3. Listen for Auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                if (!localStorage.getItem('local_admin_session')) {
                    setUser(null);
                }
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (authUser: any) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const userData: User = {
                    id: data.id,
                    email: authUser.email,
                    username: data.username || authUser.email?.split('@')[0],
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    role: data.role || 'store_admin',
                    is_superuser: data.role === 'superadmin',
                    is_staff: data.is_admin || false,
                    phone: data.phone,
                    avatar: data.avatar,
                    limit_date: data.limit_date,
                    store_status: data.store_status || 'approved'
                };
                setUser(userData);
            } else {
                // Fallback to auth metadata if profile doesn't exist yet
                setUser({
                    id: authUser.id,
                    email: authUser.email,
                    username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
                    first_name: authUser.user_metadata?.first_name || '',
                    last_name: authUser.user_metadata?.last_name || '',
                    role: 'store_admin',
                    is_superuser: false,
                    is_staff: false,
                    store_status: 'pending'
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        // Use Supabase Auth Login (Secure JWT-based authentication)

        // 2. Try Supabase Auth Login
        const authEmail = email.includes('@') ? email : `${email}@bozorchi.local`;
        const { data, error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password,
        });

        if (error) throw error;
        return { success: true, data };
    };

    const register = async (regData: any) => {
        const { data, error } = await supabase.auth.signUp({
            email: regData.email,
            password: regData.password,
            options: {
                data: {
                    username: regData.username,
                    first_name: regData.first_name,
                    last_name: regData.last_name,
                }
            }
        });

        if (error) throw error;
        if (data.user) fetchProfile(data.user);
    };

    const logout = async () => {
        localStorage.removeItem('local_admin_session');
        await supabase.auth.signOut();
        setUser(null);
    };

    const refreshUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) fetchProfile(session.user);
    };

    const updateProfile = async (profileData: any) => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone: profileData.phone,
            })
            .eq('id', authUser.id);

        if (error) throw error;
        await refreshUser();
    };

    const updatePassword = async (data: any) => {
        const { error } = await supabase.auth.updateUser({
            password: data.new_password
        });
        if (error) throw error;
    };

    const verifyDevice = async (code: string, tempToken: string) => {
        // Supabase Otp verification placeholder
        const { data, error } = await supabase.auth.verifyOtp({
            token: code,
            type: 'email',
            email: tempToken // Assuming tempToken holds the email for Supabase flow
        });
        if (error) throw error;
        return data;
    };

    const verify2FA = async (email: string, code: string, useBackupCode: boolean = false) => {
        // Supabase MFA placeholder
        const { data, error } = await supabase.auth.mfa.verify({
            code,
            factorId: 'placeholder-factor-id'
        });
        if (error) throw error;
        return data;
    };

    const loginWithFaceId = async (email?: string) => {
        // WebAuthn placeholder
        console.log('FaceID login requested for:', email);
        throw new Error('FaceID login not yet configured in Supabase. Please use email/password.');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            isSuperAdmin: user?.role === 'superadmin',
            login,
            register,
            logout,
            refreshUser,
            updateProfile,
            updatePassword,
            verifyDevice,
            verify2FA,
            loginWithFaceId,
        }}>
            {children}
        </AuthContext.Provider>
    );

}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default AuthProvider;
