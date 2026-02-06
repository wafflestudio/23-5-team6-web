import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { UserDashboardPage } from '@/pages/UserDashboardPage';
import '@/styles/App.css';

export function MainPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isAdmin } = useAuth();

    if (isLoggedIn && isAdmin) return <AdminDashboardPage />;
    if (isLoggedIn) return <UserDashboardPage />;

    return (
        /* 컨테이너 패딩을 모바일 환경(1rem)과 데스크톱(2rem)에 맞춰 유연하게 조정 */
        <div className="container" style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '1rem', // 모바일 기본 패딩 축소
            boxSizing: 'border-box' 
        }}>
            <main className="main-content">
                {/* Hero Section: 모바일에서 패딩과 폰트 크기 축소 */}
                <section style={{ 
                    textAlign: 'center', 
                    padding: '3rem 1rem', // 패딩 축소
                    background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', 
                    borderRadius: '20px', // 곡률 소폭 조정
                    marginBottom: '2rem' 
                }}>
                    <h1 style={{ 
                        fontSize: 'clamp(2rem, 8vw, 3.5rem)', // 화면 크기에 따라 2rem ~ 3.5rem 사이로 자동 조절
                        fontWeight: '900', 
                        color: '#334E68', 
                        marginBottom: '1rem',
                        lineHeight: '1.2'
                    }}>
                        <span style={{ color: '#5979BA' }}>바로바로(borrow)</span> 
                    </h1>
                    <p style={{ 
                        fontSize: 'clamp(1rem, 4vw, 1.2rem)', // 텍스트 크기 조절
                        color: '#486581', 
                        maxWidth: '600px', 
                        margin: '0 auto 2rem', 
                        lineHeight: '1.5',
                        wordBreak: 'keep-all' // 한글 줄바꿈 최적화
                    }}>
                        기다림 없는 스마트 대여 시스템. <br/>
                        사진 한 장으로 반납하고, 관리 업무를 끝내세요.
                    </p>
                    
                    {/* 버튼 레이아웃: 화면이 좁아지면 자동으로 줄바꿈 */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        justifyContent: 'center',
                        flexWrap: 'wrap' // 버튼이 넘치면 다음 줄로
                    }}>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="primary-btn" 
                            style={{ 
                                padding: '1rem 2rem', 
                                fontSize: '1.1rem', 
                                width: 'min(100%, 250px)', 
                                boxShadow: '0 4px 14px 0 rgba(89, 121, 186, 0.39)' 
                            }}
                        >
                            지금 바로 시작하기
                        </button>
                        <button 
                            onClick={() => navigate('/signup')} 
                            className="primary-btn" 
                            style={{ 
                                padding: '1rem 2rem', 
                                fontSize: '1.1rem', 
                                width: 'min(100%, 250px)',
                                border: '2px solid #5979BA'
                            }}
                        >
                            신규 가입하기
                        </button>
                    </div>
                </section>

                {/* 핵심 기능 Grid: 이미 repeat(auto-fit)이 적용되어 있어 모바일에서 자동으로 1열 배치됨 */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    <div className="card" style={{ padding: '1.5rem', borderTop: '6px solid #5979BA', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                        <h3 style={{ marginBottom: '0.5rem', color: '#102A43' }}>바로 찍고, 반납</h3>
                        <p style={{ color: '#627D98', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            복잡한 절차 없이 <strong>인증 사진</strong>만 찍으세요. 위치 기반 시스템이 반납을 바로 처리합니다.
                        </p>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', borderTop: '6px solid #10b981', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                        <h3 style={{ marginBottom: '0.5rem', color: '#102A43' }}>바로 확인하는 통계</h3>
                        <p style={{ color: '#627D98', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            우리 동아리 인기 비품은? <strong>실시간 데이터</strong>로 대여 현황을 파악하세요.
                        </p>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', borderTop: '6px solid #f59e0b', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                        <h3 style={{ marginBottom: '0.5rem', color: '#102A43' }}>바로 등록하는 데이터</h3>
                        <p style={{ color: '#627D98', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            수많은 자산도 <strong>Excel 업로드</strong>로 한 번에. 관리가 더 이상 고통스럽지 않습니다.
                        </p>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', borderTop: '6px solid #8CCEE3', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                        <h3 style={{ marginBottom: '0.5rem', color: '#102A43' }}>바로 보내는 안내</h3>
                        <p style={{ color: '#627D98', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            연체자에게 일일이 연락하지 마세요. <strong>클릭 한 번으로</strong> 안내 메일을 발송합니다.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}