import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { bufferToBase64URL, base64URLToBuffer } from '../utils/webauthn';

interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: 'superadmin' | 'store_admin' | 'customer' | 'courier';
    is_superuser: boolean;
    is_staff: boolean;
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
    loginWithFaceId: (email?: string) => Promise<void>;
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
        if (!navigator.credentials?.create) {
            throw new Error('WebAuthn not supported');
        }

        const optionsResponse = await authApi.getFaceIdRegisterOptions();
        const options = optionsResponse.data;

        const challenge = base64URLToBuffer(options.challenge);
        const userId = base64URLToBuffer(options.user.id);

        const credential = (await navigator.credentials.create({
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
        })) as PublicKeyCredential | null;

        if (!credential) {
            throw new Error('Failed to create credential');
        }

        const attestation = credential.response as AuthenticatorAttestationResponse;
        const registration_response = {
            id: bufferToBase64URL(credential.rawId),
            rawId: bufferToBase64URL(credential.rawId),
            type: 'public-key',
            response: {
                clientDataJSON: bufferToBase64URL(attestation.clientDataJSON),
                attestationObject: bufferToBase64URL(attestation.attestationObject),
                transports: attestation.getTransports?.() ?? undefined,
            },
        };

        await authApi.registerFaceId(registration_response);
        await refreshUser();
    };

    const loginWithFaceId = async (email?: string) => {
        if (!navigator.credentials?.get) {
            throw new Error('WebAuthn not supported');
        }

        const optionsResponse = await authApi.getFaceIdLoginOptions(email);
        const options = optionsResponse.data;

        const challenge = base64URLToBuffer(options.challenge);
        const allowCredentials = (options.allowCredentials || []).map((cred: { id: string; type: string }) => ({
            type: cred.type,
            id: base64URLToBuffer(cred.id),
        }));

        const credential = (await navigator.credentials.get({
            publicKey: {
                challenge,
                rpId: options.rpId,
                timeout: options.timeout,
                userVerification: options.userVerification,
                allowCredentials: allowCredentials.length ? allowCredentials : undefined,
            },
        })) as PublicKeyCredential | null;

        if (!credential) {
            throw new Error('Failed to get credential');
        }

        const assertion = credential.response as AuthenticatorAssertionResponse;
        const authentication_response = {
            id: bufferToBase64URL(credential.rawId),
            rawId: bufferToBase64URL(credential.rawId),
            type: 'public-key',
            response: {
                authenticatorData: bufferToBase64URL(assertion.authenticatorData),
                clientDataJSON: bufferToBase64URL(assertion.clientDataJSON),
                signature: bufferToBase64URL(assertion.signature),
            },
        };

        try {
            const loginResponse = await authApi.loginWithFaceId(authentication_response);

            if (!loginResponse.data?.tokens) {
                throw new Error('Invalid login response from server');
            }

            const { user: userData, tokens } = loginResponse.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            setUser(userData);
        } catch (error: unknown) {
            const err = error as { response?: { data?: unknown } };
            // Graceful error handling - Face ID is optional
            if (err.response) {
                console.warn('Face ID Login not available:', err.response.data);
                throw new Error('Face ID is not registered or not available. Please use email/password login.');
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
