import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@/styles/App.css';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const successMessage = (location.state as { message?: string })?.message;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 백엔드 준비되면 수정
        console.log('Login attempt:', formData.email);
        setError('로그인할 마음의 준비가 안됨');
    };

    return (
        <div className="container">
            <header className="app-header">
                <div className="logo" onClick={() => navigate('/')}>자산관리</div>
                <div className="auth-buttons">
                    <button className="text-btn" onClick={() => navigate('/signup')}>회원가입</button>
                    <button className="text-btn active">로그인</button>
                </div>
            </header>

            <main className="auth-container">
                <h2>로그인</h2>
                {successMessage && <p className="success-message">{successMessage}</p>}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
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
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="submit-btn">로그인</button>
                </form>
            </main>
        </div>
    );
}
