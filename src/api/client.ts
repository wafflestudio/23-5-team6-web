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

// 관리자 가입 신청 관련 타입
export interface ApplyListItem {
    id: string;
    name: string;
    email: string;
    student_id: string;
}

export interface Schedule {
    id: number;
    start_date: string; // ISO string
    end_date: string; // ISO string
    asset_id: number;
    user_id: string;
    club_id: number;
    status: string; // 'inuse' | 'returned' | ...
}

export interface SchedulesResponse {
    schedules: Schedule[];
    total: number;
    page: number;
    size: number;
    pages: number;
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

// Token 및 사용자 정보 관리 - localStorage 사용 (탭 종료 시 자동 삭제)
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
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
};

export const saveUserInfo = (userName: string, userType: number) => {
    memoryTokenCache.userName = userName;
    memoryTokenCache.userType = userType;
    localStorage.setItem(TOKEN_KEYS.USER_NAME, userName);
    localStorage.setItem(TOKEN_KEYS.USER_TYPE, userType.toString());
};

export const getUserName = (): string | null => {
    if (memoryTokenCache.userName) {
        return memoryTokenCache.userName;
    }
    const userName = localStorage.getItem(TOKEN_KEYS.USER_NAME);
    if (userName) {
        memoryTokenCache.userName = userName;
    }
    return userName;
};

export const getUserType = (): number | null => {
    if (memoryTokenCache.userType !== null) {
        return memoryTokenCache.userType;
    }
    const userType = localStorage.getItem(TOKEN_KEYS.USER_TYPE);
    if (userType) {
        const parsed = parseInt(userType, 10);
        if (!Number.isNaN(parsed)) {
            memoryTokenCache.userType = parsed;
            return memoryTokenCache.userType;
        }
    }
    return null;
};

export const getAccessToken = (): string | null => {
    // 메모리 캐시 우선 확인
    if (memoryTokenCache.access) {
        return memoryTokenCache.access;
    }
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
    if (token) {
        memoryTokenCache.access = token;
    }
    return token;
};

export const getRefreshToken = (): string | null => {
    if (memoryTokenCache.refresh) {
        return memoryTokenCache.refresh;
    }
    const token = localStorage.getItem(TOKEN_KEYS.REFRESH);
    if (token) {
        memoryTokenCache.refresh = token;
    }
    return token;
};

// 스토리지 변경 시 메모리 캐시 동기화
export const syncMemoryToStorage = () => {
    memoryTokenCache.access = localStorage.getItem(TOKEN_KEYS.ACCESS);
    memoryTokenCache.refresh = localStorage.getItem(TOKEN_KEYS.REFRESH);
    memoryTokenCache.userName = localStorage.getItem(TOKEN_KEYS.USER_NAME);
    const typeStr = localStorage.getItem(TOKEN_KEYS.USER_TYPE);
    if (typeStr) {
        const parsed = parseInt(typeStr, 10);
        memoryTokenCache.userType = Number.isNaN(parsed) ? null : parsed;
    } else {
        memoryTokenCache.userType = null;
    }
};

export const clearTokens = () => {
    memoryTokenCache.access = null;
    memoryTokenCache.refresh = null;
    memoryTokenCache.userName = null;
    memoryTokenCache.userType = null;
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER_NAME);
    localStorage.removeItem(TOKEN_KEYS.USER_TYPE);
};

export const isLoggedIn = (): boolean => {
    return !!getAccessToken();
};

// 토큰 갱신 중복 방지를 위한 플래그
let isRefreshing = false;
let refreshPromise: Promise<{ success: boolean; newAccessToken?: string }> | null = null;

// 토큰 갱신 (내부용 - 중복 호출 방지)
const doRefreshToken = async (): Promise<{ success: boolean; newAccessToken?: string }> => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
        return { success: false };
    }

    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentRefreshToken}`,
            },
        });

        if (response.status === 200) {
            const newAccessToken = await response.text();
            // 따옴표 제거 (JSON 문자열로 올 경우)
            const cleanToken = newAccessToken.replace(/^"|"$/g, '');
            memoryTokenCache.access = cleanToken;
            localStorage.setItem(TOKEN_KEYS.ACCESS, cleanToken);
            console.log('Token refreshed successfully');
            return { success: true, newAccessToken: cleanToken };
        } else {
            console.error('Token refresh failed:', response.status);
            clearTokens();
            return { success: false };
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        clearTokens();
        return { success: false };
    }
};

// 인증이 필요한 API 요청을 위한 wrapper (401 시 자동 토큰 갱신 및 재시도)
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const accessToken = getAccessToken();

    // 헤더에 Authorization 추가
    const headers = new Headers(options.headers || {});
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(url, { ...options, headers });

    // 401이 아니면 그대로 반환
    if (response.status !== 401) {
        return response;
    }

    // 401인 경우 토큰 갱신 시도
    console.log('Got 401, attempting token refresh...');

    // 이미 갱신 중이면 기다림
    if (isRefreshing && refreshPromise) {
        const result = await refreshPromise;
        if (result.success && result.newAccessToken) {
            headers.set('Authorization', `Bearer ${result.newAccessToken}`);
            return fetch(url, { ...options, headers });
        }
        return response; // 갱신 실패 시 원래 401 응답 반환
    }

    // 토큰 갱신 시작
    isRefreshing = true;
    refreshPromise = doRefreshToken();

    try {
        const result = await refreshPromise;
        if (result.success && result.newAccessToken) {
            // 새 토큰으로 원래 요청 재시도
            headers.set('Authorization', `Bearer ${result.newAccessToken}`);
            return fetch(url, { ...options, headers });
        }
        // 갱신 실패 - 로그인 페이지로 이동
        showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
        window.location.href = '/login';
        return response;
    } finally {
        isRefreshing = false;
        refreshPromise = null;
    }
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
            // 따옴표 제거 (JSON 문자열로 올 경우)
            const cleanToken = newAccessToken.replace(/^"|"$/g, '');
            // access_token만 갱신
            memoryTokenCache.access = cleanToken;
            localStorage.setItem(TOKEN_KEYS.ACCESS, cleanToken);
            return { success: true, newAccessToken: cleanToken };
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

// 동아리 정보 타입
export interface Club {
    id: number;
    name: string;
    description: string;
    club_code: string;
    location_lat?: number;
    location_lng?: number;
}

// 내 동아리 목록 조회 (GET /api/clubs/me)
export const getMyClubs = async (): Promise<{ success: boolean; data?: Club[]; error?: string }> => {
    try {
        const response = await authFetch('/api/clubs/me', {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: Club[] = await response.json();
            return { success: true, data: result };
        } else {
            return { success: false, error: '동아리 목록을 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get my clubs error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 동아리 정보 조회 (GET /api/clubs/{club_id})
export const getClub = async (clubId: number): Promise<{ success: boolean; data?: Club; error?: string }> => {
    try {
        const response = await authFetch(`/api/clubs/${clubId}`, {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: Club = await response.json();
            return { success: true, data: result };
        } else {
            return { success: false, error: '동아리 정보를 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get club error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 동아리 위치 수정 (PUT /api/clubs/{club_id})
export const updateClubLocation = async (
    clubId: number,
    locationLat: number | null,
    locationLng: number | null
): Promise<{ success: boolean; data?: Club; error?: string }> => {
    try {
        const response = await authFetch(`/api/clubs/${clubId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location_lat: locationLat,
                location_lng: locationLng,
            }),
        });

        if (response.status === 200) {
            const result: Club = await response.json();
            showNotification('동아리 위치가 수정되었습니다.');
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '권한이 없습니다.' };
        } else {
            return { success: false, error: '위치 수정에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Update club location error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 대여 이력 조회
export const getSchedules = async (clubId: number, params?: { status?: string; page?: number; size?: number }): Promise<{ success: boolean; data?: SchedulesResponse; error?: string }> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.size) queryParams.append('size', params.size.toString());

        const url = `/api/schedules/${clubId}?${queryParams.toString()}`;

        const response = await authFetch(url, {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: SchedulesResponse = await response.json();
            return { success: true, data: result };
        } else {
            return { success: false, error: '대여 이력을 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get schedules error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 물품 반납 (GPS 좌표 선택적 지원)
export const returnItemSimple = async (
    rentalId: number,
    location?: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string }> => {
    try {
        const body: { location_lat?: number; location_lng?: number } = {};

        if (location) {
            // API는 degrees * 1,000,000 형식 사용
            body.location_lat = Math.round(location.lat * 1000000);
            body.location_lng = Math.round(location.lng * 1000000);
        }

        const response = await authFetch(`/api/rentals/${rentalId}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        });

        if (response.status === 200) {
            showNotification('반납이 완료되었습니다.');
            return { success: true };
        } else {
            const errorData = await response.json();
            return { success: false, error: errorData.detail || '반납에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Return item error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};


// 관리자: 가입 신청 목록 조회
export const getApplyList = async (): Promise<{ success: boolean; data?: ApplyListItem[]; error?: string }> => {
    try {
        const response = await authFetch('/api/admin/applylist', {
            method: 'GET',
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
        const response = await authFetch(`/api/admin/users/${userId}/approve`, {
            method: 'PATCH',
            headers: {
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
        const request: ClubApplyRequest = { club_code: clubCode };

        const response = await authFetch('/api/club/apply', {
            method: 'POST',
            headers: {
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
    name: string;
    email: string;
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

        const response = await authFetch(url, {
            method: 'GET',
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
            // 실제 에러 응답 확인을 위한 로깅
            console.error('getClubMembers failed:', response.status);
            try {
                const errorData = await response.json();
                console.error('Error details:', errorData);
                return { success: false, error: `멤버 목록을 불러올 수 없습니다. (${response.status}: ${errorData.detail || JSON.stringify(errorData)})` };
            } catch {
                return { success: false, error: `멤버 목록을 불러올 수 없습니다. (${response.status})` };
            }
        }
    } catch (error) {
        console.error('Get club members error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 동아리원 삭제
export const deleteClubMember = async (memberId: number): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await authFetch(`/api/club-members/${memberId}`, {
            method: 'DELETE',
        });

        if (response.status === 200 || response.status === 204) {
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
        const response = await authFetch('/api/rentals/borrow', {
            method: 'POST',
            headers: {
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

// 관리자: 물품 추가 타입
interface AddAssetRequest {
    name: string;
    description: string;
    club_id: number;
    category_id?: number;
    quantity: number;
    location: string;
}

// 관리자: 물품 추가
export const addAsset = async (data: AddAssetRequest): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await authFetch('/api/admin/assets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.status === 201) {
            showNotification('물품이 추가되었습니다.');
            return { success: true };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            // 실제 에러 메시지 파싱
            try {
                const errorData = await response.json();
                console.error('Add asset error response:', response.status, errorData);
                return { success: false, error: errorData.detail || `물품 추가에 실패했습니다. (${response.status})` };
            } catch {
                return { success: false, error: `물품 추가에 실패했습니다. (${response.status})` };
            }
        }
    } catch (error) {
        console.error('Add asset error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 자산 타입
export interface Asset {
    id: number;
    name: string;
    status: number;
    description: string;
    category_id: number;
    category_name: string;
    total_quantity: number;
    available_quantity: number;
    location: string;
    created_at: string;
}

// 자산 목록 조회 (GET /api/assets/{club_id}) - 인증 불필요
export const getAssets = async (clubId: number): Promise<{ success: boolean; data?: Asset[]; error?: string }> => {
    try {
        const response = await fetch(`/api/assets/${clubId}`, {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: Asset[] = await response.json();
            return { success: true, data: result };
        } else {
            return { success: false, error: '자산 목록을 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get assets error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 관리자: 자산 수정 타입
interface UpdateAssetRequest {
    club_id: number;
    name?: string;
    description?: string;
    category_id?: number;
    quantity?: number;
    location?: string;
}

// 관리자: 자산 수정 (PATCH /api/admin/assets/{asset_id})
export const updateAsset = async (assetId: number, data: UpdateAssetRequest): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await authFetch(`/api/admin/assets/${assetId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.status === 200) {
            showNotification('물품이 수정되었습니다.');
            return { success: true };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            return { success: false, error: '물품 수정에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Update asset error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 관리자: 자산 삭제 (DELETE /api/admin/assets/{asset_id})
export const deleteAsset = async (assetId: number): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await authFetch(`/api/admin/assets/${assetId}`, {
            method: 'DELETE',
        });

        if (response.status === 204) {
            showNotification('물품이 삭제되었습니다.');
            return { success: true };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else {
            return { success: false, error: '물품 삭제에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Delete asset error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 관리자: 엑셀 업로드 타입
interface ExcelUploadResponse {
    imported: number; // 성공적으로 등록된 개수
    failed: Array<{
        [key: string]: unknown; // 실패한 데이터 정보 (필요 시 더 구체적으로 정의 가능)
    }>;
}

// 관리자: 엑셀 파일을 통한 물품 대량 추가
export const uploadExcelAssets = async (
    excelFile: File
): Promise<{ success: boolean; data?: ExcelUploadResponse; error?: string }> => {
    try {
        const formData = new FormData();
        // 'file'은 서버 API에서 정의한 파라미터 이름입니다.
        formData.append('file', excelFile);

        // authFetch를 사용하여 인증 토큰 자동 포함 및 갱신 처리
        const response = await authFetch(`/api/assets/import`, {
            method: 'POST',
            body: formData,
        });

        if (response.status === 200) {
            const data: ExcelUploadResponse = await response.json();
            return { success: true, data };
        } else {
            const errorData = await response.json().catch(() => ({ detail: '업로드 실패' }));
            return { success: false, error: errorData.detail };
        }
    } catch (error) {
        console.error('Excel upload error:', error);
        return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
};

// 사용자: 반납 관련 타입
interface ReturnResponse {
    id: string;
    item_id: string;
    user_id: string;
    status: string;
    borrowed_at: string;
    expected_return_date?: string;
    returned_at: string;
}

// 사용자: 반납 신청 API 함수
export const returnItem = async (
    rentalId: string,
    imageFile: File,
    location?: { lat: number; lng: number }
): Promise<{ success: boolean; data?: ReturnResponse; error?: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', imageFile); // 서버에서 받을 키 이름 ('file')

        // location이 있으면 추가 (API는 degrees * 1,000,000 형식 사용)
        if (location) {
            formData.append('location_lat', String(Math.round(location.lat * 1000000)));
            formData.append('location_lng', String(Math.round(location.lng * 1000000)));
        }

        // authFetch를 사용해서 자동 토큰 갱신
        const response = await authFetch(`/api/rentals/${rentalId}/return`, {
            method: 'POST',
            body: formData,
        });

        if (response.status === 200) {
            const data: ReturnResponse = await response.json();
            showNotification('반납이 완료되었습니다!', 'success'); // 토스트 알림 통합
            return { success: true, data };
        } else if (response.status === 401) {
            const error = '인증 토큰이 만료되었습니다. 다시 로그인해주세요.';
            showNotification(error, 'error');
            return { success: false, error };
        } else if (response.status === 403) {
            const error = '본인이 대여한 물품만 반납할 수 있습니다.';
            showNotification(error, 'error');
            return { success: false, error };
        } else if (response.status === 404) {
            const error = '존재하지 않는 대여 기록입니다.';
            showNotification(error, 'error');
            return { success: false, error };
        } else {
            const errorData = await response.json().catch(() => ({ detail: '알 수 없는 오류' }));
            const error = errorData.detail || '반납 처리 중 오류가 발생했습니다.';
            showNotification(error, 'error');
            return { success: false, error };
        }
    } catch (err) {
        console.error('Return item error:', err);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
        return { success: false, error: '서버와 통신 중 네트워크 오류가 발생했습니다.' };
    }
};

// 클럽 코드 수정 응답 타입
interface UpdateClubCodeResponse {
    club_id: number;
    club_code: string;
}

// 관리자: 클럽 코드 수정 (빈 문자열 전송 시 무작위 재발급)
export const updateClubCode = async (clubCode: string): Promise<{ success: boolean; data?: UpdateClubCodeResponse; error?: string }> => {
    try {
        const response = await authFetch('/api/admin/club-code', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ club_code: clubCode }),
        });

        if (response.status === 200) {
            const result: UpdateClubCodeResponse = await response.json();
            showNotification(clubCode ? '클럽 코드가 변경되었습니다.' : '클럽 코드가 재발급되었습니다.');
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            try {
                const errorData = await response.json();
                return { success: false, error: errorData.detail || `클럽 코드 수정에 실패했습니다. (${response.status})` };
            } catch {
                return { success: false, error: `클럽 코드 수정에 실패했습니다. (${response.status})` };
            }
        }
    } catch (error) {
        console.error('Update club code error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 관리자 클럽 정보 응답 타입
interface MyAdminClubResponse {
    club_id: number;
    club_name: string;
    club_code: string;
}

// 관리자: 내 클럽 정보 조회
export const getMyAdminClub = async (): Promise<{ success: boolean; data?: MyAdminClubResponse; error?: string }> => {
    try {
        const response = await authFetch('/api/admin/my-club', {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: MyAdminClubResponse = await response.json();
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else {
            return { success: false, error: '클럽 정보를 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get my admin club error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 자산 통계 타입
export interface AssetStatistics {
    total_rental_count: number;
    average_rental_duration: number;
    recent_rental_count: number;
    recent_avg_duration: number;
    unique_borrower_count: number;
    last_borrowed_at: string | null;
    last_updated_at: string | null;
}

// 자산 통계 조회 (GET /api/statistics/{asset_id})
export const getAssetStatistics = async (assetId: number): Promise<{ success: boolean; data?: AssetStatistics; error?: string }> => {
    try {
        const response = await authFetch(`/api/statistics/${assetId}`, {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: AssetStatistics = await response.json();
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            return { success: false, error: '통계를 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get asset statistics error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// ===== 자산 사진 관리 API =====

// 자산 사진 타입
export interface AssetPicture {
    id: number;
    asset_id: number;
    is_main: boolean;
    url?: string;
}

// 사진 URL 생성 (API 경로 반환)
export const getPictureUrl = (pictureId: number): string => {
    return `/api/pictures/${pictureId}`;
};

// 자산 사진 목록 조회 (GET /api/assets/{asset_id}/pictures)
export const getAssetPictures = async (assetId: number): Promise<{ success: boolean; data?: AssetPicture[]; error?: string }> => {
    try {
        const response = await fetch(`/api/assets/${assetId}/pictures`, {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: AssetPicture[] = await response.json();
            return { success: true, data: result };
        } else if (response.status === 404) {
            return { success: true, data: [] }; // 사진이 없는 경우
        } else {
            return { success: false, error: '사진 목록을 불러올 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get asset pictures error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 자산 사진 업로드 (POST /api/admin/assets/{asset_id}/pictures)
export const addAssetPicture = async (
    assetId: number,
    file: File,
    isMain: boolean = false
): Promise<{ success: boolean; data?: AssetPicture; error?: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const url = `/api/admin/assets/${assetId}/pictures?is_main=${isMain}`;

        const response = await authFetch(url, {
            method: 'POST',
            body: formData,
            // Note: Content-Type is automatically set for FormData
        });

        if (response.status === 201) {
            const result = await response.json();
            showNotification('사진이 업로드되었습니다.');
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else if (response.status === 422) {
            const errorData: ValidationError = await response.json();
            const errorMessage = errorData.detail.map(d => d.msg).join(', ');
            return { success: false, error: errorMessage || '유효성 검증 실패' };
        } else {
            try {
                const errorData = await response.json();
                return { success: false, error: errorData.detail || '사진 업로드에 실패했습니다.' };
            } catch {
                return { success: false, error: '사진 업로드에 실패했습니다.' };
            }
        }
    } catch (error) {
        console.error('Add asset picture error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 대표 사진 설정 (PATCH /api/admin/assets/{asset_id}/pictures/{picture_id}/main)
export const setMainPicture = async (
    assetId: number,
    pictureId: number
): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await authFetch(`/api/admin/assets/${assetId}/pictures/${pictureId}/main`, {
            method: 'PATCH',
        });

        if (response.status === 200) {
            showNotification('대표 사진이 설정되었습니다.');
            return { success: true };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else if (response.status === 404) {
            return { success: false, error: '사진을 찾을 수 없습니다.' };
        } else {
            return { success: false, error: '대표 사진 설정에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Set main picture error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// 자산 사진 삭제 (DELETE /api/admin/assets/{asset_id}/pictures/{picture_id})
export const deleteAssetPicture = async (
    assetId: number,
    pictureId: number
): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await authFetch(`/api/admin/assets/${assetId}/pictures/${pictureId}`, {
            method: 'DELETE',
        });

        if (response.status === 204 || response.status === 200) {
            showNotification('사진이 삭제되었습니다.');
            return { success: true };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 403) {
            return { success: false, error: '관리자 권한이 없습니다.' };
        } else if (response.status === 404) {
            return { success: false, error: '사진을 찾을 수 없습니다.' };
        } else {
            return { success: false, error: '사진 삭제에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Delete asset picture error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

// Google OAuth
interface GoogleLinkStatus {
    is_linked: boolean;
    google_email: string | null;
}

interface GoogleLinkResponse {
    google_email: string;
    linked_at: string;
}

export const getGoogleLinkStatus = async (): Promise<{ success: boolean; data?: GoogleLinkStatus; error?: string }> => {
    try {
        const response = await authFetch('/api/auth/google/status', {
            method: 'GET',
        });

        if (response.status === 200) {
            const result: GoogleLinkStatus = await response.json();
            return { success: true, data: result };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else {
            return { success: false, error: '연동 상태를 확인할 수 없습니다.' };
        }
    } catch (error) {
        console.error('Get Google link status error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

export const linkGoogleAccount = async (
    code: string,
    codeVerifier: string,
    redirectUri: string
): Promise<{ success: boolean; data?: GoogleLinkResponse; error?: string }> => {
    try {
        const response = await authFetch('/api/auth/google/link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                code_verifier: codeVerifier,
                redirect_uri: redirectUri,
            }),
        });

        if (response.status === 200) {
            const result: GoogleLinkResponse = await response.json();
            showNotification('Google 계정이 연동되었습니다.');
            return { success: true, data: result };
        } else if (response.status === 400) {
            return { success: false, error: '잘못된 요청입니다.' };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 409) {
            return { success: false, error: '이미 다른 계정에 연동된 Google 계정입니다.' };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.detail || 'Google 연동에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Link Google account error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

export const unlinkGoogleAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await authFetch('/api/auth/google/link', {
            method: 'DELETE',
        });

        if (response.status === 204 || response.status === 200) {
            showNotification('Google 연동이 해제되었습니다.');
            return { success: true };
        } else if (response.status === 401) {
            return { success: false, error: '인증이 만료되었습니다.' };
        } else if (response.status === 404) {
            return { success: false, error: '연동된 Google 계정이 없습니다.' };
        } else {
            return { success: false, error: '연동 해제에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Unlink Google account error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};

export const googleLogin = async (
    code: string,
    codeVerifier: string,
    redirectUri: string
): Promise<{ success: boolean; data?: LoginResponse; error?: string }> => {
    try {
        const response = await fetch('/api/auth/google/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                code_verifier: codeVerifier,
                redirect_uri: redirectUri,
            }),
        });

        if (response.status === 200) {
            const result: LoginResponse = await response.json();
            saveTokens(result.tokens.access_token, result.tokens.refresh_token);
            saveUserInfo(result.user_name, result.user_type);
            showNotification('Google 로그인 성공!');
            return { success: true, data: result };
        } else if (response.status === 404) {
            return { success: false, error: '연동된 계정이 없습니다. 먼저 일반 로그인 후 마이페이지에서 Google 연동을 해주세요.' };
        } else if (response.status === 400) {
            return { success: false, error: '잘못된 요청입니다.' };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.detail || 'Google 로그인에 실패했습니다.' };
        }
    } catch (error) {
        console.error('Google login error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};