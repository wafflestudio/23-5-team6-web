import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
    getAccessToken,
    getUserName as getStoredUserName,
    getUserType as getStoredUserType,
    logout as apiLogout,
    syncMemoryToStorage,
} from '@/api/client';

interface AuthState {
    isLoggedIn: boolean;
    userName: string | null;
    userType: number | null;
    isAdmin: boolean;
    permission: number | null;
}

interface AuthContextType extends AuthState {
    refreshAuth: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [authState, setAuthState] = useState<AuthState>(() => {
        const userType = getStoredUserType();
        return {
            isLoggedIn: !!getAccessToken(),
            userName: getStoredUserName(),
            userType: userType,
            permission: userType, // userType 값을 permission으로도 활용
            isAdmin: userType === 1,
        };
    });

    const refreshAuth = useCallback(() => {
        const token = getAccessToken();
        const userName = getStoredUserName();
        const userType = getStoredUserType();
        setAuthState({
            isLoggedIn: !!token,
            userName,
            userType,
            permission: userType,
            isAdmin: userType === 1,
        });
    }, []);

    const logout = useCallback(async () => {
        await apiLogout();
        setAuthState({
            isLoggedIn: false,
            userName: null,
            userType: null,
            permission: null,
            isAdmin: false,
        });
    }, []);

    // 다른 탭에서 로그아웃 시 동기화
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === null) {
                syncMemoryToStorage();
                refreshAuth();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refreshAuth]);

    return (
        <AuthContext.Provider value={{ ...authState, refreshAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
