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
    user_name: string;
    user_type: number;
    tokens: {
        access_token: string;
        refresh_token: string;
    };
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

// 물품 관련 타입
export interface ClubItem {
    item_id: number;
    name: string;
    status: 'borrowed' | 'returned' | 'overdue' | 'available';
    borrowed_at: string | null;
    expected_return_date: string | null;
    current_holder: string | null;
}

interface ClubItemsResponse {
    total: number;
    items: ClubItem[];
}

// 관리자 가입 신청 관련 타입
export interface ApplyListItem {
    id: string;
    name: string;
    email: string;
    student_id: string;
}

export interface ApplyListResponse {
    users: ApplyListItem[];
}

interface ApproveUserResponse {
    id: string;
    name: string;
    email: string;
    status: string;
}

// Token 및 사용자 정보 관리 - sessionStorage 사용 (탭 종료 시 자동 삭제)
const TOKEN_KEYS = {
    ACCESS: 'access_token',
    REFRESH: 'refresh_token',
    USER_NAME: 'user_name',
    USER_TYPE: 'user_type',
};

// 메모리 캐시 (추가 보안 레이어)
const memoryTokenCache: { access: string | null; refresh: string | null; userName: string | null; userType: number | null } = {
    access: null,
    refresh: null,
    userName: null,
    userType: null,
};

export const saveTokens = (accessToken: string, refreshToken: string) => {
    memoryTokenCache.access = accessToken;
    memoryTokenCache.refresh = refreshToken;
    sessionStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    sessionStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
};

export const saveUserInfo = (userName: string, userType: number) => {
    memoryTokenCache.userName = userName;
    memoryTokenCache.userType = userType;
    sessionStorage.setItem(TOKEN_KEYS.USER_NAME, userName);
    sessionStorage.setItem(TOKEN_KEYS.USER_TYPE, userType.toString());
};

export const getUserName = (): string | null => {
    if (memoryTokenCache.userName) {
        return memoryTokenCache.userName;
    }
    const userName = sessionStorage.getItem(TOKEN_KEYS.USER_NAME);
    if (userName) {
        memoryTokenCache.userName = userName;
    }
    return userName;
};

export const getUserType = (): number | null => {
    if (memoryTokenCache.userType !== null) {
        return memoryTokenCache.userType;
    }
    const userType = sessionStorage.getItem(TOKEN_KEYS.USER_TYPE);
    if (userType) {
        memoryTokenCache.userType = parseInt(userType, 10);
        return memoryTokenCache.userType;
    }
    return null;
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

// 스토리지 변경 시 메모리 캐시 동기화
export const syncMemoryToStorage = () => {
    memoryTokenCache.access = sessionStorage.getItem(TOKEN_KEYS.ACCESS);
    memoryTokenCache.refresh = sessionStorage.getItem(TOKEN_KEYS.REFRESH);
    memoryTokenCache.userName = sessionStorage.getItem(TOKEN_KEYS.USER_NAME);
    const typeStr = sessionStorage.getItem(TOKEN_KEYS.USER_TYPE);
    memoryTokenCache.userType = typeStr ? parseInt(typeStr, 10) : null;
};

export const clearTokens = () => {
    memoryTokenCache.access = null;
    memoryTokenCache.refresh = null;
    memoryTokenCache.userName = null;
    memoryTokenCache.userType = null;
    sessionStorage.removeItem(TOKEN_KEYS.ACCESS);
    sessionStorage.removeItem(TOKEN_KEYS.REFRESH);
    sessionStorage.removeItem(TOKEN_KEYS.USER_NAME);
    sessionStorage.removeItem(TOKEN_KEYS.USER_TYPE);
};

export const isLoggedIn = (): boolean => {
    return !!getAccessToken();
};

// Toast 알림 함수 - Toast 컴포넌트와 연동
import { showToast } from '@/utils/toast';

export const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    showToast(message, type);
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

// 관리자 회원가입 타입
interface AdminSignupRequest {
    name: string;
    email: string;
    password: string;
    club_name: string;
    club_description: string;
}

interface AdminSignupResponse {
    id: string;
    name: string;
    email: string;
    club_id: number;
    club_name: string;
    club_code: string;
}

// 관리자 회원가입
export const adminSignup = async (data: AdminSignupRequest): Promise<{ success: boolean; data?: AdminSignupResponse; error?: string }> => {
    try {
        const response = await fetch('/api/admin/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.status === 201) {
            const result = await response.json();
            return { success: true, data: result };
        } else if (response.status === 409) {
            return { success: false, error: '이미 존재하는 이메일입니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            const errorData: ErrorResponse = await response.json();
            return { success: false, error: errorData.detail || 'Admin signup failed' };
        }
    } catch (error) {
        console.error('Admin signup error:', error);
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
            saveTokens(result.tokens.access_token, result.tokens.refresh_token);
            saveUserInfo(result.user_name, result.user_type);
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
            memoryTokenCache.access = newAccessToken;
            sessionStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
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

// 더미 물품 데이터 (API 연동 전 테스트용) - mocks에서 import
import { dummyItemsData } from '@/mocks/data';

// 동아리 물품 목록 조회
export const getClubItems = async (clubId: number): Promise<{ success: boolean; data?: ClubItemsResponse; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`/api/clubs/${clubId}/items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            const result: ClubItemsResponse = await response.json();
            return { success: true, data: result };
        } else {
            // API 실패 시 더미 데이터 반환 (개발용)
            const dummyData = dummyItemsData[clubId];
            if (dummyData) {
                return { success: true, data: dummyData };
            }
            return { success: false, error: '물품 목록을 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get club items error:', error);
        // 네트워크 에러 시 더미 데이터 반환 (개발용)
        const dummyData = dummyItemsData[clubId];
        if (dummyData) {
            return { success: true, data: dummyData };
        }
        return { success: false, error: 'Network error occurred' };
    }
};

// 관리자: 가입 신청 목록 조회
export const getApplyList = async (): Promise<{ success: boolean; data?: ApplyListItem[]; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch('/api/admin/applylist', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            const result: ApplyListResponse = await response.json();
            return { success: true, data: result.users };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else {
            return { success: false, error: '신청 목록을 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get apply list error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 관리자: 사용자 승인/거부
export const approveUser = async (userId: string, approved: boolean): Promise<{ success: boolean; data?: ApproveUserResponse; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`/api/admin/users/${userId}/approve`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ approved }),
        });

        if (response.status === 200) {
            const result: ApproveUserResponse = await response.json();
            showNotification(approved ? '승인되었습니다.' : '거부되었습니다.');
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else {
            return { success: false, error: '처리에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Approve user error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 관리자 여부 확인
export const isAdmin = (): boolean => {
    return getUserType() === 1;
};

// 동아리 가입 신청 타입
interface ClubApplyRequest {
    club_code: string;
}

interface ClubApplyResponse {
    application_id: number;
    club_name: string;
    status: string;
}

// 동아리 가입 신청
export const applyToClub = async (clubCode: string): Promise<{ success: boolean; data?: ClubApplyResponse; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return { success: false, error: 'Not authenticated' };
        }

        const request: ClubApplyRequest = { club_code: clubCode };

        const response = await fetch('/api/club/apply', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (response.status === 200) {
            const result: ClubApplyResponse = await response.json();
            showNotification(`${result.club_name} 동아리에 가입 신청되었습니다.`);
            return { success: true, data: result };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            const errorData: ErrorResponse = await response.json();
            return { success: false, error: errorData.detail || '가입 신청에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Apply to club error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 동아리 멤버 관련 타입
export interface ClubMember {
    user_id: string;
    club_id: number;
    permission: number; // 0: 일반 회원, 1: 관리자, 2: 가입대기
    id: number;
}

export interface ClubMembersResponse {
    total: number;
    page: number;
    size: number;
    pages: number;
    items: ClubMember[];
}

export interface GetClubMembersParams {
    club_id?: number;
    member_id?: number;
    user_id?: string;
    permission?: number;
    page?: number;
    size?: number;
}

// 동아리 멤버 목록 조회
// - 파라미터 없이 호출: 자신이 가입한 동아리 목록
// - club_id 지정: 해당 동아리의 멤버 목록 (관리자용)
export const getClubMembers = async (params?: GetClubMembersParams): Promise<{ success: boolean; data?: ClubMembersResponse; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return { success: false, error: 'Not authenticated' };
        }

        // 쿼리 파라미터 구성
        const queryParams = new URLSearchParams();
        if (params?.club_id !== undefined) queryParams.append('club_id', params.club_id.toString());
        if (params?.member_id !== undefined) queryParams.append('member_id', params.member_id.toString());
        if (params?.user_id !== undefined) queryParams.append('user_id', params.user_id);
        if (params?.permission !== undefined) queryParams.append('permission', params.permission.toString());
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.size !== undefined) queryParams.append('size', params.size.toString());

        const url = queryParams.toString()
            ? `/api/club-members/?${queryParams.toString()}`
            : '/api/club-members/';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            const result: ClubMembersResponse = await response.json();
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            return { success: false, error: '멤버 목록을 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get club members error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 동아리원 삭제
export const deleteClubMember = async (memberId: number): Promise<{ success: boolean; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`/api/club-members/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            showNotification('멤버가 삭제되었습니다.');
            return { success: true };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            return { success: false, error: '멤버 삭제에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Delete club member error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 사용자: 대여 신청 API 함수
export const borrowItem = async (itemId: number, expectedReturnDate?: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const accessToken = getAccessToken();
        const response = await fetch('/api/rentals/borrow', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_id: itemId,
                expected_return_date: expectedReturnDate
            }),
        });

        if (response.status === 201) {
            showNotification('대여가 완료되었습니다!', 'success');
            return { success: true };
        } else {
            const errorData = await response.json();
            showNotification(errorData.detail || '대여에 실패했습니다.', 'error');
            return { success: false, error: errorData.detail };
        }
    } catch (error) {
        console.error('Borrow error:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
        return { success: false, error: 'Network error' };
    }
};