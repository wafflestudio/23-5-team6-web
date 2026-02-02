import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getClub, returnItem } from '@/api/client'; // API 함수 임포트
import '@/styles/App.css';

interface ItemInfo {
    id: number;
    name: string;
    clubId: number;
    clubName: string;
    borrowedAt: string;
    expectedReturn: string;
    image?: string;
}

interface LocationState {
    item?: ItemInfo;
}

// 거리 계산 함수 (Haversine 공식)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // 지구 반지름 (m)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export function ReturnDetailPage() {
    const { item_id: rentalId } = useParams<{ item_id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const item = locationState?.item;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        if (!isSubmitting) fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 최종 반납 API 실행 로직
    const executeReturnAction = async (file: File) => {
        if (!rentalId) return;
        const result = await returnItem(rentalId, file); //
        if (result.success) {
            console.log('반납 완료:', result.data);
            navigate('/user-dashboard', { state: { tab: 'borrowed' }, replace: true });
        }
        setIsSubmitting(false);
    };

    // 제출 버튼 클릭 핸들러 (GPS 인증 포함)
    const handleReturnSubmit = async () => {
        if (!imagePreview || !selectedFile) {
            alert('반납 확인을 위해 물품 사진을 업로드해주세요.');
            return;
        }

        if (!rentalId || !item) {
            alert('대여 정보를 불러올 수 없습니다.');
            return;
        }

        try {
            setIsSubmitting(true);

            // 1. 동아리 정보 조회 (GPS 좌표 확인용)
            const clubResult = await getClub(item.clubId); //
            if (!clubResult.success || !clubResult.data) {
                alert('동아리 위치 정보를 확인할 수 없습니다.');
                setIsSubmitting(false);
                return;
            }

            const clubData = clubResult.data;

            // 동아리 GPS 정보가 없는 경우 사진만으로 반납 진행
            if (!clubData.location_lat || !clubData.location_lng) {
                await executeReturnAction(selectedFile);
                return;
            }

            const clubLat = clubData.location_lat / 1000000;
            const clubLng = clubData.location_lng / 1000000;

            // 2. 현재 사용자 위치 조회 및 거리 비교
            if (!navigator.geolocation) {
                alert('이 브라우저에서는 GPS를 지원하지 않습니다.');
                setIsSubmitting(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    const distance = calculateDistance(userLat, userLng, clubLat, clubLng);

                    // 15m 거리 제한 검증
                    if (distance > 15) {
                        alert(`⚠️ 위치 인증 실패: 동아리방에서 너무 멉니다.\n현재 거리: ${distance.toFixed(1)}m (제한: 15m)`);
                        setIsSubmitting(false);
                        return;
                    }

                    // 3. 최종 반납 진행
                    await executeReturnAction(selectedFile);
                },
                (error) => {
                    console.error('GPS 에러:', error);
                    alert('위치 정보를 가져올 수 없습니다. GPS 권한을 확인해주세요.');
                    setIsSubmitting(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );

        } catch (error) {
            console.error('제출 중 에러:', error);
            setIsSubmitting(false);
        }
    };

    if (!item) {
        return (
            <div className="container">
                <main className="main-content">
                    <p>물품 정보가 없습니다.</p>
                    <button className="submit-btn" onClick={() => navigate(-1)}>뒤로 가기</button>
                </main>
            </div>
        );
    }

    return (
        <div className="container">
            <main className="main-content">
                {/* 상단 물품 정보 영역 */}
                <div className="card return-info-card" style={{ border: 'none', background: 'transparent' }}>
                    <div className="asset-info-section" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div className="asset-image-placeholder" style={{ width: '120px', height: '120px', borderRadius: '20px', fontSize: '3rem', background: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {item.image || '📦'}
                        </div>
                        <div className="asset-info">
                            <h2 className="asset-name" style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{item.name}</h2>
                            <p className="asset-detail">동아리: {item.clubName}</p>
                            <p className="asset-detail">대여일: {item.borrowedAt}</p>
                            <p className="asset-detail">반납예정일: {item.expectedReturn}</p>
                        </div>
                    </div>
                </div>

                {/* 사진 업로드 영역 */}
                <div 
                    className="upload-zone" 
                    onClick={handleUploadClick}
                    style={{
                        marginTop: '40px',
                        height: '240px',
                        backgroundColor: '#E5E5E5',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        overflow: 'hidden',
                        border: imagePreview ? '2px solid #5979BA' : 'none',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <>
                            <span style={{ fontSize: '2rem', marginBottom: '10px' }}>📤</span>
                            <p style={{ color: '#666', fontWeight: '500' }}>여기에 사진을 업로드해주세요</p>
                        </>
                    )}
                </div>

                <input 
                    type="file" 
                    accept="image/*"
                    capture="environment" // 모바일에서 카메라 우선 실행
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }}
                />

                {/* 제출 버튼 */}
                <button 
                    className="submit-btn" 
                    onClick={handleReturnSubmit}
                    disabled={isSubmitting}
                    style={{ 
                        marginTop: '60px', 
                        backgroundColor: isSubmitting ? '#999' : '#373F47',
                        width: '100%',
                        padding: '18px',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        color: 'white',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isSubmitting ? '인증 및 반납 처리 중...' : '인증 후 반납하기'}
                </button>
            </main>
        </div>
    );
}