import { useNavigate, Link } from 'react-router-dom';
import { adminSignup } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/hooks/useForm';
import '@/styles/App.css';

interface AdminSignupFormValues {
    name: string;
    email: string;
    password: string;
    clubName: string;
    clubDescription: string;
}

const initialValues: AdminSignupFormValues = {
    name: '',
    email: '',
    password: '',
    clubName: '',
    clubDescription: '',
};

const validateAdminSignup = (values: AdminSignupFormValues): string | null => {
    if (!values.name.trim()) {
        return '이름을 입력해주세요.';
    }
    if (!values.email.trim()) {
        return '이메일을 입력해주세요.';
    }
    // 간단한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
        return '올바른 이메일 형식을 입력해주세요.';
    }
    if (values.password.length < 8) {
        return '비밀번호는 8자 이상이어야 합니다.';
    }
    if (!values.clubName.trim()) {
        return '동아리 이름을 입력해주세요.';
    }
    if (!values.clubDescription.trim()) {
        return '동아리 설명을 입력해주세요.';
    }
    return null;
};

export function AdminSignupPage() {
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();
    const { values, error, handleChange, handleSubmit, setError } = useForm({
        initialValues,
        validate: validateAdminSignup,
    });

    const onSubmit = async () => {
        const result = await adminSignup({
            name: values.name,
            email: values.email,
            password: values.password,
            club_name: values.clubName,
            club_description: values.clubDescription
        });

        if (result.success) {
            refreshAuth();
            navigate('/login', { state: { message: '운영자 회원가입이 완료되었습니다. 로그인해주세요.' } });
        } else {
            setError(result.error || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="container">

            <main className="auth-container">
                <h2>운영자 회원가입</h2>
                <p className="admin-signup-subtitle">동아리 운영자로 가입하시면 동아리를 관리할 수 있습니다.</p>
                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">이름</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            required
                            maxLength={50}
                            placeholder="이름을 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                            required
                            placeholder="이메일을 입력하세요"
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
                            minLength={8}
                            placeholder="8자 이상 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="clubName">동아리 이름</label>
                        <input
                            type="text"
                            id="clubName"
                            name="clubName"
                            value={values.clubName}
                            onChange={handleChange}
                            required
                            placeholder="동아리 이름을 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="clubDescription">동아리 설명</label>
                        <textarea
                            id="clubDescription"
                            name="clubDescription"
                            value={values.clubDescription}
                            onChange={handleChange}
                            required
                            placeholder="동아리에 대한 간단한 설명을 입력하세요"
                            rows={3}
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="submit-btn">운영자로 가입하기</button>
                </form>

                <p className="auth-switch">
                    일반 회원이신가요? <Link to="/signup">일반 회원가입</Link>
                </p>
            </main>
        </div>
    );
}
