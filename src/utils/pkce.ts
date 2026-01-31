function generateRandomString(length: number = 64): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues)
        .map((v) => charset[v % charset.length])
        .join('');
}

export function generateCodeVerifier(): string {
    return generateRandomString(64);
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateState(): string {
    return generateRandomString(32);
}

const PKCE_STORAGE_KEY = 'google_oauth_pkce';

interface PKCEData {
    codeVerifier: string;
    state: string;
    mode: 'link' | 'login';
    timestamp: number;
}

export function savePKCEData(data: Omit<PKCEData, 'timestamp'>): void {
    const storageData: PKCEData = {
        ...data,
        timestamp: Date.now(),
    };
    sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(storageData));
}

export function getPKCEData(): PKCEData | null {
    const stored = sessionStorage.getItem(PKCE_STORAGE_KEY);
    if (!stored) return null;

    try {
        const data: PKCEData = JSON.parse(stored);
        if (Date.now() - data.timestamp > 5 * 60 * 1000) {
            sessionStorage.removeItem(PKCE_STORAGE_KEY);
            return null;
        }
        return data;
    } catch {
        sessionStorage.removeItem(PKCE_STORAGE_KEY);
        return null;
    }
}

export function clearPKCEData(): void {
    sessionStorage.removeItem(PKCE_STORAGE_KEY);
}

export async function buildGoogleOAuthURL(mode: 'link' | 'login'): Promise<string> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
        throw new Error('VITE_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.');
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    savePKCEData({ codeVerifier, state, mode });

    const redirectUri = `${window.location.origin}/auth/google/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state,
        access_type: 'offline',
        prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
