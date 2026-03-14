import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: 'superadmin' | 'store_admin' | 'customer' | 'courier';
    phone?: string;
    avatar?: string;
    face_id_registered: boolean;
    two_factor_enabled: boolean;
    store_status: 'pending' | 'approved' | 'rejected' | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
    login: (email: string, password: string) => Promise<any>;
    loginAsSuperAdmin: (username: string, password: string) => Promise<any>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    registerFaceId: () => Promise<void>;
    loginWithFaceId: () => Promise<void>;
    refreshUser: () => Promise<void>;
    verify2FA: (email: string, code: string, useBackupCode?: boolean) => Promise<void>;
    setup2FA: () => Promise<any>;
    enable2FA: (code: string) => Promise<any>;
    disable2FA: () => Promise<void>;
    listSessions: () => Promise<any[]>;
    endSession: (id: number) => Promise<void>;
    endAllSessions: () => Promise<void>;
    acknowledgeRejection: () => Promise<void>;
}

interface RegisterData {
    email: string;
    username: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: 'store_admin' | 'customer' | 'courier';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthContext.tsx

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const response = await authApi.me();
                setUser(response.data);
            } catch (error: any) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                }
            }
        }
        setIsLoading(false);
    };

    const login = async (email: string, password: string) => {
        const response = await authApi.login(email, password);

        if (response.data.two_factor_required) {
            return response.data;
        }

        const { user: userData, tokens } = response.data;
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        setUser(userData);
        return response.data;
    };

    const loginAsSuperAdmin = async (username: string, password: string) => {
        const response = await authApi.superAdminLogin(username, password);
        const { user: userData, tokens } = response.data;

        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        setUser(userData);
        return response.data;
    };

    const register = async (data: RegisterData) => {
        const response = await authApi.register(data);
        const { user: userData, tokens } = response.data;

        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const registerFaceId = async () => {
        if (!navigator.credentials) {
            throw new Error('WebAuthn not supported');
        }

        // Get registration options from server
        const optionsResponse = await authApi.getFaceIdRegisterOptions();
        const options = optionsResponse.data;

        // Convert challenge to ArrayBuffer
        const challenge = Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), (c: string) => c.charCodeAt(0));
        const userId = Uint8Array.from(options.user.id, (c: string) => c.charCodeAt(0));

        // Create credentials
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: options.rp,
                user: {
                    id: userId,
                    name: options.user.name,
                    displayName: options.user.displayName,
                },
                pubKeyCredParams: options.pubKeyCredParams,
                timeout: options.timeout,
                attestation: options.attestation,
                authenticatorSelection: options.authenticatorSelection,
            },
        }) as PublicKeyCredential;

        if (!credential) {
            throw new Error('Failed to create credential');
        }

        const response = credential.response as AuthenticatorAttestationResponse;

        // Convert to base64
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        const publicKey = btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey() || new ArrayBuffer(0))));

        // Register with server
        await authApi.registerFaceId(credentialId, publicKey);
        await refreshUser();
    };

    const loginWithFaceId = async () => {
        if (!navigator.credentials) {
            throw new Error('WebAuthn not supported');
        }

        // Get login options from server
        const optionsResponse = await authApi.getFaceIdLoginOptions();
        const options = optionsResponse.data;

        // Convert challenge to ArrayBuffer
        const challenge = Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

        // Convert allowed credentials
        const allowCredentials = options.allowCredentials.map((cred: { id: string; type: string }) => ({
            type: cred.type,
            id: Uint8Array.from(atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')), (c: string) => c.charCodeAt(0)),
        }));

        // Get credentials
        const credential = await navigator.credentials.get({
            publicKey: {
                challenge,
                rpId: options.rpId,
                timeout: options.timeout,
                userVerification: options.userVerification,
                allowCredentials,
            },
        }) as PublicKeyCredential;

        if (!credential) {
            throw new Error('Failed to get credential');
        }

        const response = credential.response as AuthenticatorAssertionResponse;

        // Convert to base64
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        const authenticatorData = btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData)));
        const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON)));
        const signature = btoa(String.fromCharCode(...new Uint8Array(response.signature)));

        // Login with server
        try {
            const loginResponse = await authApi.loginWithFaceId({
                credential_id: credentialId,
                authenticator_data: authenticatorData,
                client_data_json: clientDataJSON,
                signature,
            });

            if (!loginResponse.data || !loginResponse.data.tokens) {
                console.error('Login response missing tokens:', loginResponse.data);
                throw new Error('Invalid login response from server');
            }

            const { user: userData, tokens } = loginResponse.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            setUser(userData);
        } catch (error: any) {
            if (error.response) {
                console.error('Face ID Login Server Error:', error.response.data);
            }
            throw error;
        }
    };

    const verify2FA = async (email: string, code: string, useBackupCode: boolean = false) => {
        const response = await authApi.verify2FA(email, code, useBackupCode);
        const { user: userData, tokens } = response.data;

        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        setUser(userData);
    };

    const setup2FA = async () => {
        const response = await authApi.setup2FA();
        return response.data;
    };

    const enable2FA = async (code: string) => {
        const response = await authApi.enable2FA(code);
        await refreshUser();
        return response.data;
    };

    const disable2FA = async () => {
        await authApi.disable2FA();
        await refreshUser();
    };

    const listSessions = async () => {
        const response = await authApi.listSessions();
        return response.data;
    };

    const endSession = async (id: number) => {
        await authApi.endSession(id);
    };

    const endAllSessions = async () => {
        await authApi.endAllSessions();
    };

    const acknowledgeRejection = async () => {
        const { storeApi } = await import('../services/api');
        await storeApi.acknowledgeRejection();
        await refreshUser();
    };

    const refreshUser = async () => {
        try {
            const response = await authApi.me();
            setUser(response.data);
        } catch (error) {
            // Ignore errors
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            isSuperAdmin: user?.role === 'superadmin',
            login,
            loginAsSuperAdmin,
            register,
            logout,
            registerFaceId,
            loginWithFaceId,
            refreshUser,
            verify2FA,
            setup2FA,
            enable2FA,
            disable2FA,
            listSessions,
            endSession,
            endAllSessions,
            acknowledgeRejection,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
