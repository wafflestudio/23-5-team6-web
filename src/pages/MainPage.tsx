import { useNavigate } from 'react-router-dom';
import { checkBackendStatus } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { UserDashboardPage } from '@/pages/UserDashboardPage';

import '@/styles/App.css';
import { useEffect } from 'react';

export function MainPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isAdmin } = useAuth(); // AuthContext에서 권한 및 로그인 상태 확인

    // 서버 상태 초기 체크
    useEffect(() => {
        handleCheck();
    }, []);

    const handleCheck = async () => {
        try {
            await checkBackendStatus(); // 백엔드 연결 확인
        } catch {
            // Handle error if needed
        }
    };

    // 1. 관리자용 대시보드로 분기
    if (isLoggedIn && isAdmin) {
        return <AdminDashboardPage />;
    }

    // 2. 일반 사용자용 대시보드로 분기
    if (isLoggedIn) {
        return <UserDashboardPage />;
    }

    // 3. 비로그인 상태: 서비스 소개(랜딩) 페이지
    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <main className="main-content">
                {/* Hero Section */}
                <section style={{ textAlign: 'center', padding: '4rem 0', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '20px', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '1.5rem' }}>
                        바로바로(borrow) <span style={{ color: 'var(--primary-600)' }}></span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                        복잡한 동아리 비품 관리, 이제 사진 한 장과 QR로 스마트하게 해결하세요. 실시간 통계부터 자동 연체 알림까지 지원합니다.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => navigate('/login')} className="primary-btn" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                            로그인하여 시작하기
                        </button>
                        <button onClick={() => navigate('/signup')} className="primary-btn" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                            신규 회원가입
                        </button>
                    </div>
                </section>

                {/* 핵심 기능 Grid (기획안 반영) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <div className="card" style={{ padding: '2rem', borderTop: '5px solid #5979BA' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📸</div>
                        <h3 style={{ marginBottom: '0.8rem' }}>셀프 대여/반납</h3>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>
                            사진 인증을 통한 투명한 반납 시스템. 위치 기반 체크인으로 분실 걱정 없는 자산 관리를 경험하세요.
                        </p>
                    </div>
                    <div className="card" style={{ padding: '2rem', borderTop: '5px solid #10b981' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                        <h3 style={{ marginBottom: '0.8rem' }}>인사이트 통계</h3>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>
                            자산별 평균 대여 기간과 이용 빈도를 자동으로 집계합니다. 효율적인 비품 교체 주기를 파악하세요.
                        </p>
                    </div>
                    <div className="card" style={{ padding: '2rem', borderTop: '5px solid #f59e0b' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
                        <h3 style={{ marginBottom: '0.8rem' }}>일괄 데이터 관리</h3>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>
                            Excel/CSV 업로드와 다운로드를 지원하여 대규모 비품도 한 번에 등록하고 관리 대장을 출력할 수 있습니다.
                        </p>
                    </div>
                    <div className="card" style={{ padding: '2rem', borderTop: '5px solid #8CCEE3' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📨</div>
                        <h3 style={{ marginBottom: '0.8rem' }}>연체 메일링 시스템</h3>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>
                            연체 발생 시 시스템 내에서 <strong>클릭 한 번으로 안내 메일을 발송</strong>하여 미반납 자산을 효율적으로 관리할 수 있습니다.
                        </p>
                    </div>
                </div>  
            </main>
        </div>
    );
}