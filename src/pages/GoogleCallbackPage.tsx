import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { linkGoogleAccount, googleLogin } from '@/api/client';
import { getPKCEData, clearPKCEData } from '@/utils/pkce';
import '@/styles/App.css';

export function GoogleCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshAuth } = useAuth();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Google 인증 처리 중...');

    const isProcessed = useRef(false);

    useEffect(() => {
        if (isProcessed.current) return;
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage(`Google 인증 실패: ${error}`);
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('인증 코드가 없습니다.');
                return;
            }

            const pkceData = getPKCEData();
            if (!pkceData) {
                setStatus('error');
                setMessage('인증 세션이 만료되었습니다. 다시 시도해주세요.');
                return;
            }

            if (state !== pkceData.state) {
                setStatus('error');
                setMessage('보안 검증에 실패했습니다. 다시 시도해주세요.');
                clearPKCEData();
                return;
            }

            const redirectUri = `${window.location.origin}/auth/google/callback`;

             isProcessed.current = true;
            try {
                if (pkceData.mode === 'link') {
                    const result = await linkGoogleAccount(code, pkceData.codeVerifier, redirectUri);

                    if (result.success) {
                        setStatus('success');
                        setMessage(`Google 계정(${result.data?.google_email})이 연동되었습니다!`);
                        setTimeout(() => navigate('/mypage'), 2000);
                    } else {
                        setStatus('error');
                        setMessage(result.error || 'Google 연동에 실패했습니다.');
                    }
                } else {
                    const result = await googleLogin(code, pkceData.codeVerifier, redirectUri);

                    if (result.success) {
                        setStatus('success');
                        setMessage('로그인 성공! 이동 중...');
                        refreshAuth();
                        setTimeout(() => {
                            if (result.data?.user_type === 1) {
                                navigate('/admin/dashboard');
                            } else {
                                navigate('/');
                            }
                        }, 1000);
                    } else {
                        setStatus('error');
                        setMessage(result.error || 'Google 로그인에 실패했습니다.');
                    }
                }
            } catch (err) {
                console.error('Google callback error:', err);
                setStatus('error');
                setMessage('처리 중 오류가 발생했습니다.');
            } finally {
                clearPKCEData();
            }
        };

        handleCallback();
    }, [searchParams, navigate, refreshAuth]);

    return (
        <div className="container">
            <main className="auth-container" style={{ textAlign: 'center' }}>
                {status === 'processing' && (
                    <>
                        <div className="loading-spinner" style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid var(--glass-border)',
                            borderTop: '4px solid var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1.5rem'
                        }} />
                        <h2>{message}</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ color: 'var(--success, #10b981)' }}>{message}</h2>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                        <h2 style={{ color: 'var(--error, #ef4444)' }}>{message}</h2>
                        <button
                            className="submit-btn"
                            onClick={() => navigate('/login')}
                            style={{ marginTop: '1.5rem' }}
                        >
                            로그인 페이지로 돌아가기
                        </button>
                    </>
                )}
            </main>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
