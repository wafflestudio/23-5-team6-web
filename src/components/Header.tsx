import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.svg';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, userName, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="app-header">
            <div className="logo-icon" onClick={() => navigate('/')}>
                <img src={logo} alt="로고" style={{ height: '80px', display: 'block' }} />
            </div>
            <div className="auth-buttons">
                {isLoggedIn ? (
                    <>
                        <button
                            className={`text-btn user-name-btn ${isActive('/mypage') ? 'active' : ''}`}
                            onClick={() => navigate('/mypage')}
                        >
                            {userName ? `${userName}님` : '마이페이지'}
                        </button>
                        <button className="text-btn" onClick={handleLogout}>
                            로그아웃
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className={`text-btn ${isActive('/signup') ? 'active' : ''}`}
                            onClick={() => navigate('/signup')}
                        >
                            회원가입
                        </button>
                        <button
                            className={`text-btn ${isActive('/login') ? 'active' : ''}`}
                            onClick={() => navigate('/login')}
                        >
                            로그인
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
