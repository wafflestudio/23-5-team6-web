import { useNavigate } from 'react-router-dom';
import { checkBackendStatus } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { UserDashboardPage } from '@/pages/UserDashboardPage';
import { KakaoMapPicker } from '@/components/KakaoMapPicker';
import '@/styles/App.css';
import { useState } from 'react';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
}

export function MainPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isAdmin } = useAuth();
    const [status, setStatus] = useState<string>('');
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        loading: false,
        error: null,
    });

    const handleCheck = async () => {
        const result = await checkBackendStatus();
        setStatus(result.status);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocation(prev => ({
                ...prev,
                error: '이 브라우저에서는 위치 정보를 지원하지 않습니다.',
            }));
            return;
        }

        setLocation(prev => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                let errorMessage = '위치 정보를 가져오는데 실패했습니다.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '위치 정보 접근이 거부되었습니다.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '위치 정보를 사용할 수 없습니다.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
                        break;
                }
                setLocation({
                    latitude: null,
                    longitude: null,
                    loading: false,
                    error: errorMessage,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // 관리자로 로그인한 경우 관리자 대시보드 표시
    if (isLoggedIn && isAdmin) {
        return <AdminDashboardPage />;
    }

    // 일반 사용자로 로그인한 경우 사용자 대시보드 표시
    if (isLoggedIn) {
        return <UserDashboardPage />;
    }

    // 비로그인 상태
    return (
        <div className="container">

            <main className="main-content">
                <h1>Club Asset Management</h1>

                <div className="card">
                    <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--gray-500)' }}>
                        로그인하면 동아리 물품을 관리할 수 있습니다.
                    </p>
                    <button onClick={() => navigate('/login')} className="primary-btn">
                        로그인하기
                    </button>
                </div>

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

                <div className="card">
                    <button
                        onClick={handleGetLocation}
                        className="primary-btn"
                        disabled={location.loading}
                    >
                        {location.loading ? '위치 조회 중...' : '📍 현재 위치 조회'}
                    </button>
                    {location.latitude !== null && location.longitude !== null && (
                        <div className="location-result" style={{ marginTop: '1rem' }}>
                            <p style={{ margin: 0, color: 'var(--gray-700)' }}>
                                <strong>위도:</strong> {location.latitude.toFixed(6)}
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--gray-700)' }}>
                                <strong>경도:</strong> {location.longitude.toFixed(6)}
                            </p>
                        </div>
                    )}
                    {location.error && (
                        <p className="status error" style={{ marginTop: '1rem' }}>
                            {location.error}
                        </p>
                    )}
                </div>

                <div className="card">
                    <KakaoMapPicker />
                </div>
            </main>
        </div>
    );
}


