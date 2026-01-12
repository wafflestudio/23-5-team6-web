import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/hooks/useForm';
import '@/styles/App.css';

interface LoginFormValues {
    email: string;
    password: string;
}

const initialValues: LoginFormValues = {
    email: '',
    password: '',
};

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshAuth } = useAuth();
    const { values, error, isLoading, handleChange, handleSubmit, setError } = useForm({
        initialValues,
    });
    const successMessage = (location.state as { message?: string })?.message;

    const onSubmit = async () => {
        const result = await login({
            email: values.email,
            password: values.password,
        });

        if (result.success) {
            refreshAuth();
            navigate('/', { state: { message: '로그인 성공!' } });
        } else {
            setError(result.error || '로그인에 실패했습니다.');
        }
    };

    return (
        <div className="container">

            <main className="auth-container">
                <h2>로그인</h2>
                {successMessage && <p className="success-message">{successMessage}</p>}
                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={values.email}
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
                            value={values.password}
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
