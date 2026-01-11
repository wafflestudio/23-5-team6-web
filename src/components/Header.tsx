import { useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, logout } from '@/api/client';

interface HeaderProps {
    onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const loggedIn = isLoggedIn();

    const handleLogout = async () => {
        await logout();
        onLogout?.();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="app-header">
            <div className="logo" onClick={() => navigate('/')}>자산관리</div>
            <div className="auth-buttons">
                {loggedIn ? (
                    <>
                        <button
                            className={`text-btn ${isActive('/mypage') ? 'active' : ''}`}
                            onClick={() => navigate('/mypage')}
                        >
                            마이페이지
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
