import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '@/api/client';
import '@/styles/App.css';

export function SignupPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (formData.password.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        const result = await signup({
            name: formData.name,
            email: formData.email,
            password: formData.password
        });

        if (result.success) {
            alert('회원가입 성공!');
            navigate('/login');
        } else {
            setError(result.error || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="container">
            <header className="app-header">
                <div className="logo" onClick={() => navigate('/')}>자산관리</div>
                <div className="auth-buttons">
                    <button className="text-btn active">회원가입</button>
                    <button className="text-btn" onClick={() => navigate('/login')}>로그인</button>
                </div>
            </header>

            <main className="auth-container">
                <h2>회원가입</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">이름</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            maxLength={30}
                            placeholder="이름을 입력하세요"
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
                            minLength={8}
                            placeholder="8자 이상 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">비밀번호 확인</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="다시 한번 입력하세요"
                        />
                    </div>

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

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="submit-btn">회원가입</button>
                </form>
            </main>
        </div>
    );
}
