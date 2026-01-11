// Types
interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

interface SignupResponse {
    id: string;
    name: string;
    email: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    access_token: string;
    refresh_token: string;
}

interface ValidationError {
    detail: Array<{
        loc: (string | number)[];
        msg: string;
        type: string;
    }>;
}

interface ErrorResponse {
    detail: string;
}

// Token 관리 - sessionStorage 사용 (탭 종료 시 자동 삭제)
const TOKEN_KEYS = {
    ACCESS: 'access_token',
    REFRESH: 'refresh_token',
};

// 메모리 캐시 (추가 보안 레이어)
let memoryTokenCache: { access: string | null; refresh: string | null } = {
    access: null,
    refresh: null,
};

export const saveTokens = (accessToken: string, refreshToken: string) => {
    memoryTokenCache.access = accessToken;
    memoryTokenCache.refresh = refreshToken;
    sessionStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    sessionStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
};

export const getAccessToken = (): string | null => {
    // 메모리 캐시 우선 확인
    if (memoryTokenCache.access) {
        return memoryTokenCache.access;
    }
    const token = sessionStorage.getItem(TOKEN_KEYS.ACCESS);
    if (token) {
        memoryTokenCache.access = token;
    }
    return token;
};

export const getRefreshToken = (): string | null => {
    if (memoryTokenCache.refresh) {
        return memoryTokenCache.refresh;
    }
    const token = sessionStorage.getItem(TOKEN_KEYS.REFRESH);
    if (token) {
        memoryTokenCache.refresh = token;
    }
    return token;
};

export const clearTokens = () => {
    memoryTokenCache.access = null;
    memoryTokenCache.refresh = null;
    sessionStorage.removeItem(TOKEN_KEYS.ACCESS);
    sessionStorage.removeItem(TOKEN_KEYS.REFRESH);
};

export const isLoggedIn = (): boolean => {
    return !!getAccessToken();
};

// 개발용 알림 함수
export const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // 간단한 토스트 알림 생성
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    // 애니메이션 스타일 추가
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

export const checkBackendStatus = async (): Promise<{ status: string; ok: boolean }> => {
    try {
        const response = await fetch('/health');
        if (response.status === 200) {
            return { status: 'Success', ok: true };
        } else {
            return { status: `Error: ${response.status}`, ok: false };
        }
    } catch (error) {
        console.error('Connection failed:', error);
        return { status: 'Connection Failed', ok: false };
    }
};

export const signup = async (data: SignupRequest): Promise<{ success: boolean; data?: SignupResponse; error?: string }> => {
    try {
        const response = await fetch('/api/users/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.status === 201) {
            const result = await response.json();
            return { success: true, data: result };
        } else {
            const errorData: ErrorResponse = await response.json();
            return { success: false, error: errorData.detail || 'Signup failed' };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 로그인
export const login = async (data: LoginRequest): Promise<{ success: boolean; data?: LoginResponse; error?: string }> => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.status === 200) {
            const result: LoginResponse = await response.json();
            saveTokens(result.access_token, result.refresh_token);
            showNotification('로그인 성공!');
            return { success: true, data: result };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || 'Validation failed' };
        } else {
            const errorData = await response.json();
            return { success: false, error: errorData.detail || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 토큰 갱신
export const refreshToken = async (): Promise<{ success: boolean; newAccessToken?: string; error?: string }> => {
    try {
        const currentRefreshToken = getRefreshToken();
        if (!currentRefreshToken) {
            return { success: false, error: 'No refresh token available' };
        }

        const response = await fetch('/api/auth/refresh', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentRefreshToken}`,
            },
        });

        if (response.status === 200) {
            const newAccessToken = await response.text();
            // access_token만 갱신
            localStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
            return { success: true, newAccessToken };
        } else {
            clearTokens();
            return { success: false, error: 'Token refresh failed' };
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 로그아웃
export const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            clearTokens();
            return { success: true };
        }

        const response = await fetch('/api/auth/logout', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        clearTokens();
        showNotification('로그아웃 성공!');

        if (response.status === 204) {
            return { success: true };
        } else {
            return { success: true }; // 토큰은 이미 삭제했으므로 성공 처리
        }
    } catch (error) {
        console.error('Logout error:', error);
        clearTokens();
        return { success: true }; // 에러가 나도 로컬 토큰은 삭제
    }
};
