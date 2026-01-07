import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkBackendStatus } from '@/api/client';
import '@/styles/App.css';

export function MainPage() {
    const [status, setStatus] = useState<string>('');
    const navigate = useNavigate();

    const handleCheck = async () => {
        const result = await checkBackendStatus();
        setStatus(result.status);
    };

    return (
        <div className="container">
            <header className="app-header">
                <div className="logo">자산관리</div>
                <div className="auth-buttons">
                    <button className="text-btn" onClick={() => navigate('/signup')}>회원가입</button>
                    <button className="text-btn" onClick={() => navigate('/login')}>로그인</button>
                </div>
            </header>

            <main className="main-content">
                <h1>Club Asset Management</h1>
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
