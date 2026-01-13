import { useNavigate, useLocation } from 'react-router-dom';
import { login, saveTokens, saveUserInfo } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/hooks/useForm';
import { showToast } from '@/utils/toast';
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
        // 더미 관리자 로그인: admin@test.com
        if (values.email === 'admin@test.com') {
            // 가짜 토큰 저장
            saveTokens('dummy_admin_access_token', 'dummy_admin_refresh_token');
            saveUserInfo('관리자', 1); // userType 1 = 관리자
            showToast('관리자 로그인 성공!', 'success');
            refreshAuth();
            navigate('/admin/dashboard');
            return;
        }

        const result = await login({
            email: values.email,
            password: values.password,
        });

        if (result.success) {
            refreshAuth();
            // 관리자면 대시보드로, 일반 유저면 메인으로
            if (result.data?.user_type === 1) {
                navigate('/admin/dashboard');
            } else {
                navigate('/', { state: { message: '로그인 성공!' } });
            }
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
