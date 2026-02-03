import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminSignup } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/hooks/useForm';
import '@/styles/App.css';

interface AdminSignupFormValues {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    clubName: string;
    clubDescription: string;
    locationLat: number | null;
    locationLng: number | null;
}

const initialValues: AdminSignupFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    clubName: '',
    clubDescription: '',
    locationLat: null,
    locationLng: null,
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
    if (values.password !== values.confirmPassword) {
        return '비밀번호가 일치하지 않습니다.';
    }
    if (!values.clubName.trim()) {
        return '동아리 이름을 입력해주세요.';
    }
    if (!values.clubDescription.trim()) {
        return '동아리 설명을 입력해주세요.';
    }
    if (values.locationLat === null || values.locationLng === null) {
        return '동아리 위치를 설정해주세요.';
    }
    return null;
};

export function AdminSignupPage() {
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const { values, error, handleChange, handleSubmit, setError, setFieldValue } = useForm({
        initialValues,
        validate: validateAdminSignup,
    });

    // GPS 위치 가져오기
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('이 브라우저에서는 GPS를 지원하지 않습니다.');
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // API는 degrees * 1,000,000 형식 사용
                setFieldValue('locationLat', Math.round(lat * 1000000));
                setFieldValue('locationLng', Math.round(lng * 1000000));
                setIsGettingLocation(false);
            },
            (geoError) => {
                setIsGettingLocation(false);
                let errorMessage = '위치를 가져올 수 없습니다.';
                switch (geoError.code) {
                    case geoError.PERMISSION_DENIED:
                        errorMessage = '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                        break;
                    case geoError.POSITION_UNAVAILABLE:
                        errorMessage = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case geoError.TIMEOUT:
                        errorMessage = '위치 요청 시간이 초과되었습니다.';
                        break;
                }
                setError(errorMessage);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const onSubmit = async () => {
        if (values.locationLat === null || values.locationLng === null) {
            setError('동아리 위치를 설정해주세요.');
            return;
        }

        const result = await adminSignup({
            name: values.name,
            email: values.email,
            password: values.password,
            club_name: values.clubName,
            club_description: values.clubDescription,
            location_lat: values.locationLat,
            location_lng: values.locationLng,
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
                        <label htmlFor="confirmPassword">비밀번호 확인</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 다시 입력하세요"
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

                    <div className="form-group">
                        <label>동아리 위치 (필수)</label>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                            물품 반납 시 위치 확인에 사용됩니다.
                        </p>
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isGettingLocation}
                            style={{
                                padding: '0.9rem 1rem',
                                border: values.locationLat ? '2px solid #5979BA' : '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                background: values.locationLat ? 'rgba(89, 121, 186, 0.1)' : 'white',
                                cursor: isGettingLocation ? 'not-allowed' : 'pointer',
                                width: '100%',
                                fontSize: '1rem',
                                color: values.locationLat ? '#5979BA' : '#666',
                                fontWeight: values.locationLat ? '600' : '400',
                            }}
                        >
                            {isGettingLocation
                                ? '위치 가져오는 중...'
                                : values.locationLat
                                    ? `위치 설정됨 (${(values.locationLat / 1000000).toFixed(6)}, ${(values.locationLng! / 1000000).toFixed(6)})`
                                    : '현재 위치로 설정하기'}
                        </button>
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
