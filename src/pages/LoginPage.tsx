import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, getAccessToken } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/hooks/useForm';
import { buildGoogleOAuthURL } from '@/utils/pkce';
import '@/styles/App.css';

interface LoginFormValues {
    email: string;
    password: string;
}

const initialValues: LoginFormValues = {
    email: '',
    password: '',
};

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshAuth, isLoggedIn, isAdmin } = useAuth();
    const { values, error, isLoading, handleChange, handleSubmit, setError } = useForm({
        initialValues,
    });
    const successMessage = (location.state as { message?: string })?.message;
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // 이미 로그인된 상태면 리다이렉트 (실제 토큰 존재 여부 확인)
    const hasCheckedAuth = useRef(false);
    useEffect(() => {
        // 컴포넌트 마운트 시 한 번만 체크 (로그아웃 직후 state 타이밍 이슈 방지)
        if (hasCheckedAuth.current) return;
        hasCheckedAuth.current = true;

        // 실제 토큰이 존재하는지 확인
        const token = getAccessToken();
        if (token && isLoggedIn) {
            if (isAdmin) {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [isLoggedIn, isAdmin, navigate]);

    // 브라우저 뒤로가기/앞으로가기 시 로딩 상태 초기화 (bfcache 대응)
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                setIsGoogleLoading(false);
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    const onSubmit = async () => {
        const result = await login({
            email: values.email,
            password: values.password,
        });

        if (result.success) {
            refreshAuth();
            // 관리자면 대시보드로, 일반 유저면 메인으로
            // replace: true로 히스토리에서 로그인 페이지 대체
            if (result.data?.user_type === 1) {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true, state: { message: '로그인 성공!' } });
            }
        } else {
            setError(result.error || '로그인에 실패했습니다.');
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            const url = await buildGoogleOAuthURL('login');
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google 로그인을 시작할 수 없습니다.');
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="container">

            <main className="auth-container">
                <h2>로그인</h2>
                {successMessage && <p className="success-message">{successMessage}</p>}
                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                            required
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '1.5rem 0',
                    gap: '1rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>또는</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                </div>

                <button
                    type="button"
                    className="submit-btn"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #dadce0',
                        color: '#3c4043',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        fontWeight: 500
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {isGoogleLoading ? '처리 중...' : 'Google로 로그인'}
                </button>

                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                    ※ Google 로그인은 마이페이지에서 계정 연동 후 사용 가능합니다.
                </p>
            </main>
        </div>
    );
}

