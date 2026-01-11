import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '@/api/client';
import { Header } from '@/components/Header';
import '@/styles/App.css';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const successMessage = (location.state as { message?: string })?.message;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login({
            email: formData.email,
            password: formData.password,
        });

        setIsLoading(false);

        if (result.success) {
            // 로그인 성공 시 메인 페이지로 이동
            navigate('/', { state: { message: '로그인 성공!' } });
        } else {
            setError(result.error || '로그인에 실패했습니다.');
        }
    };

    return (
        <div className="container">
            <Header />

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

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
            </main>
        </div>
    );
}
