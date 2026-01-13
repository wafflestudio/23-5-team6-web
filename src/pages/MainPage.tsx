import { useNavigate } from 'react-router-dom';
import { checkBackendStatus } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import '@/styles/App.css';
import { useState } from 'react';

export function MainPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isAdmin } = useAuth();
    const [status, setStatus] = useState<string>('');

    const handleCheck = async () => {
        const result = await checkBackendStatus();
        setStatus(result.status);
    };

    // 관리자로 로그인한 경우 대시보드 표시
    if (isLoggedIn && isAdmin) {
        return <AdminDashboardPage />;
    }

    return (
        <div className="container">

            <main className="main-content">
                <h1>Club Asset Management</h1>

                {isLoggedIn ? (
                    <div className="card">
                        <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--gray-500)' }}>
                            로그인되었습니다. 내 동아리에서 물품을 확인하세요.
                        </p>
                        <button onClick={() => navigate('/clubs')} className="primary-btn">
                            내 동아리 보기
                        </button>
                    </div>
                ) : (
                    <div className="card">
                        <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--gray-500)' }}>
                            로그인하면 동아리 물품을 관리할 수 있습니다.
                        </p>
                        <button onClick={() => navigate('/login')} className="primary-btn">
                            로그인하기
                        </button>
                    </div>
                )}

                <div className="card">
                    <button onClick={handleCheck} className="primary-btn">
                        Check Backend Status
                    </button>
                    {status && (
                        <p className={`status ${status === 'Success' ? 'success' : 'error'}`}>
                            {status}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}

