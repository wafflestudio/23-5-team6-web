import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { UserDashboardPage } from '@/pages/UserDashboardPage';
import '@/styles/App.css';

export function MainPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isAdmin } = useAuth(); //

    if (isLoggedIn && isAdmin) return <AdminDashboardPage />; //
    if (isLoggedIn) return <UserDashboardPage />; //

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <main className="main-content">
                {/* Hero Section: 브랜드 컨셉 강조 */}
                <section style={{ 
                    textAlign: 'center', 
                    padding: '5rem 0', 
                    background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', 
                    borderRadius: '30px', 
                    marginBottom: '4rem' 
                }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#334E68', marginBottom: '1.5rem' }}>
                        동아리 관리를 <span style={{ color: '#5979BA' }}>바로바로</span>, <br/>
                        필요한 물품을 <span style={{ color: '#8CCEE3' }}>borrow</span>!
                    </h1>
                    <p style={{ fontSize: '1.3rem', color: '#486581', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                        기다림 없는 스마트 대여 시스템. <br/>
                        사진 한 장으로 반납하고, 클릭 한 번으로 관리 업무를 끝내세요.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <button onClick={() => navigate('/login')} className="primary-btn" style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', boxShadow: '0 4px 14px 0 rgba(89, 121, 186, 0.39)' }}>
                            지금 바로 시작하기
                        </button>
                        <button onClick={() => navigate('/signup')} className="primary-btn" style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', boxShadow: '0 4px 14px 0 rgba(89, 121, 186, 0.39)' }}>
                            신규 가입하기
                        </button>
                    </div>
                </section>

                {/* 핵심 기능 Grid: '바로' 시리즈 컨셉 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2.5rem', borderTop: '6px solid #5979BA', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📸</div>
                        <h3 style={{ marginBottom: '1rem', color: '#102A43' }}>바로 찍고, 반납</h3>
                        <p style={{ color: '#627D98', fontSize: '1rem', lineHeight: '1.6' }}>
                            복잡한 절차 없이 <strong>인증 사진</strong>만 찍으세요. 위치 기반 시스템이 반납을 바로 처리합니다.
                        </p>
                    </div>

                    <div className="card" style={{ padding: '2.5rem', borderTop: '6px solid #10b981', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                        <h3 style={{ marginBottom: '1rem', color: '#102A43' }}>바로 확인하는 통계</h3>
                        <p style={{ color: '#627D98', fontSize: '1rem', lineHeight: '1.6' }}>
                            우리 동아리에서 가장 인기 있는 비품은? <strong>실시간 데이터</strong>로 대여 현황을 바로 파악하세요.
                        </p>
                    </div>

                    <div className="card" style={{ padding: '2.5rem', borderTop: '6px solid #f59e0b', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📁</div>
                        <h3 style={{ marginBottom: '1rem', color: '#102A43' }}>바로 등록하는 데이터</h3>
                        <p style={{ color: '#627D98', fontSize: '1rem', lineHeight: '1.6' }}>
                            수많은 자산도 <strong>Excel 업로드</strong>로 한 번에. 관리 대장 정리가 더 이상 고통스럽지 않습니다.
                        </p>
                    </div>

                    <div className="card" style={{ padding: '2.5rem', borderTop: '6px solid #8CCEE3', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
                        <h3 style={{ marginBottom: '1rem', color: '#102A43' }}>바로 보내는 안내</h3>
                        <p style={{ color: '#627D98', fontSize: '1rem', lineHeight: '1.6' }}>
                            연체자에게 일일이 연락하지 마세요. 시스템에서 <strong>클릭 한 번으로</strong> 안내 메일을 바로 발송합니다.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}