import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { returnItem } from '@/api/client';
import { getClub } from '@/api/client';
import '@/styles/App.css';


interface ItemInfo {
    id: number;
    clubId: number;
    name: string;
    clubName: string;
    borrowedAt: string;
    expectedReturn: string;
    image?: string;
}

interface LocationState {
    item?: ItemInfo;
}

// 이미지 압축 함수 (Canvas API 사용)
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // 리사이즈 비율 계산
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Canvas에 그리기
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Blob으로 변환 (JPEG 형식, 지정된 품질)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Blob conversion failed'));
                            return;
                        }
                        // File 객체로 변환
                        const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        console.log(`이미지 압축: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
};

export function ReturnDetailPage() {
    const { item_id: rentalId } = useParams<{ item_id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const item = locationState?.item;
    const [isLocating, setIsLocating] = useState(false);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 이미지 파일 검증
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            // 파일 크기 제한 (10MB)
            const MAX_FILE_SIZE = 10 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE) {
                alert('파일 크기가 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.');
                return;
            }

            try {
                setIsCompressing(true);

                // 500KB 이상인 경우 압축
                let uploadFile = file;
                if (file.size > 500 * 1024) {
                    uploadFile = await compressImage(file);
                }

                setSelectedFile(uploadFile);

                // 미리보기 생성
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(uploadFile);
            } catch (err) {
                console.error('Image compression error:', err);
                alert('이미지 처리 중 오류가 발생했습니다.');
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const executeReturnAction = async (file: File, location: { lat: number; lng: number }) => {
        if (!rentalId) return;
        try {
            const result = await returnItem(rentalId, file, location);
            if (result.success) {
                alert('반납이 성공적으로 완료되었습니다!');
                navigate('/user/dashboard', { state: { tab: 'borrowed' }, replace: true });
            }
        } catch (error) {
            console.error('반납 API 오류:', error);
            alert('서버 전송 중 오류가 발생했습니다.');
        }
    };


    const handleReturnSubmit = async () => {
        if (!imagePreview || !selectedFile) {
            alert('반납 확인을 위해 물품 사진을 업로드해주세요.');
            return;
        }

        if (!rentalId || !item) {
            alert('대여 정보를 불러올 수 없습니다.');
            return;
        }

        // GPS 지원 확인
        if (!navigator.geolocation) {
            alert('이 브라우저에서는 GPS를 지원하지 않습니다.');
            return;
        }

        try {
            setIsSubmitting(true);

            // 1. 동아리 정보 조회 (GPS 좌표 확인용)
            const clubResult = await getClub(item.clubId);
            if (!clubResult.success || !clubResult.data) {
                alert('동아리 위치 정보를 확인할 수 없습니다.');
                setIsSubmitting(false);
                return;
            }

            const clubData = clubResult.data;

            // 2. 현재 사용자 위치 조회
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    // 동아리 위치가 설정되어 있는 경우에만 거리 검증
                    if (clubData.location_lat && clubData.location_lng) {
                        const clubLat = clubData.location_lat / 1000000;
                        const clubLng = clubData.location_lng / 1000000;
                        const distance = calculateDistance(userLat, userLng, clubLat, clubLng);

                        // 15m 거리 제한 검증
                        if (distance > 15) {
                            alert(`⚠️ 위치 인증 실패: 동아리방에서 너무 멉니다.\n현재 거리: ${distance.toFixed(1)}m (제한: 15m)`);
                            setIsSubmitting(false);
                            return;
                        }
                    }

                    // 3. 최종 반납 진행 (위치 정보 필수 전달)
                    await executeReturnAction(selectedFile, { lat: userLat, lng: userLng });
                    setIsSubmitting(false);
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

    // Haversine 공식으로 두 GPS 좌표 사이 거리 계산 (미터 단위)
    const calculateDistance = (
        lat1: number, lng1: number,
        lat2: number, lng2: number
    ): number => {
        const R = 6371000; // 지구 반지름 (미터)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // src/pages/ReturnDetailPage.tsx 내부
    const handleReturnItem = async () => {
        if (!rentalId || !item) {
            alert('대여 정보를 확인할 수 없습니다.');
            return;
        }

        try {
            setIsLocating(true); // 로딩 시작

            const clubResult = await getClub(item.clubId);
            if (!clubResult.success || !clubResult.data) {
                alert('동아리 정보를 불러올 수 없습니다.');
                setIsLocating(false);
                return;
            }

            const clubData = clubResult.data;

            if (!clubData.location_lat || !clubData.location_lng) {
                console.log("동아리 위치 정보가 없어 인증을 생략합니다.");
                setIsLocating(false);
                return;
            }

            // 위치 정보가 있는 경우에만 GPS 검사 진행
            if (!navigator.geolocation) {
                alert('GPS를 지원하지 않는 브라우저입니다.');
                setIsLocating(false);
                return;
            }

            const clubLat = clubData.location_lat / 1000000;
            const clubLng = clubData.location_lng / 1000000;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude: userLat, longitude: userLng } = position.coords;
                    const distance = calculateDistance(userLat, userLng, clubLat, clubLng);

                    if (distance > 15) {
                        alert(`⚠️ 거리가 너무 멉니다! (현재 거리: ${distance.toFixed(1)}m)\n15m 이내에서 다시 시도해주세요.`);
                    } else {
                        alert('✅ 위치 인증에 성공했습니다!');
                    }
                    setIsLocating(false);
                },
                (error) => {
                    console.error('GPS 에러:', error);
                    alert('위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.');
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );

        } catch (err) {
            console.error(err);
            setIsLocating(false);
        }
    };


    if (!item) {
        return (
            <div className="container">
                <main className="main-content">
                    <p>물품 정보가 없습니다.</p>
                    <button className="submit-btn" onClick={() => navigate(-1)}>
                        뒤로 가기
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div className="container">
            <main className="main-content">
                <div className="card return-info-card" style={{ border: 'none', background: 'transparent' }}>
                    <div className="asset-info-section" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div className="asset-image-placeholder" style={{ width: '120px', height: '120px', borderRadius: '20px', fontSize: '3rem', background: '#f8f9fa' }}>
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                '📦'
                            )}
                        </div>
                        <div className="asset-info">
                            <h2 className="asset-name" style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{item.name}</h2>
                            <p className="asset-detail">동아리: {item.clubName}</p>
                            <p className="asset-detail">대여일: {item.borrowedAt}</p>
                            <p className="asset-detail">반납예정일: {item.expectedReturn}</p>
                        </div>
                    </div>
                </div>

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
                        cursor: isSubmitting || isCompressing ? 'not-allowed' : 'pointer',
                        overflow: 'hidden',
                        border: imagePreview ? '2px solid #5979BA' : 'none',
                        opacity: isSubmitting || isCompressing ? 0.7 : 1
                    }}
                >
                    {isCompressing ? (
                        <>
                            <span style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</span>
                            <p style={{ color: '#666', fontWeight: '500' }}>이미지 압축 중...</p>
                        </>
                    ) : imagePreview ? (
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
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={isSubmitting || isCompressing}
                />
                <div className="card-actions" style={{ marginTop: '15px' }}>
                    <button
                        // 인자 없이 호출하도록 수정
                        onClick={handleReturnItem}
                        className="primary-btn"
                        // isLocating을 불리언(true/false)으로 관리한다면 아래와 같이 수정
                        disabled={isLocating}
                        style={{
                            width: '100%',
                            // schedule.id 대신 item.id 사용
                            backgroundColor: isLocating ? '#999' : '#373F47',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: isLocating ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {isLocating ? (
                            <>
                                <span className="spinner" />
                                위치 확인 중...
                            </>
                        ) : (
                            '📍 위치 인증하기'
                        )}
                    </button>
                </div>
                <button
                    className="submit-btn"
                    onClick={handleReturnSubmit}
                    disabled={isSubmitting || isCompressing}
                    style={{
                        marginTop: '60px',
                        backgroundColor: isSubmitting || isCompressing ? '#999' : '#373F47',
                        width: '100%',
                        padding: '18px',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        cursor: isSubmitting || isCompressing ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isCompressing ? '이미지 압축 중...' : isSubmitting ? '반납 처리 중...' : '반납하기'}
                </button>
            </main>
        </div>
    );
}