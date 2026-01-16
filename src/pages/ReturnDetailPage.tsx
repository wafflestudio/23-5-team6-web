import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { returnItem } from '@/api/client';
import { dummyItemsData } from '@/mocks/data'; // 모든 아이템 데이터가 들어있는 곳으로 가정
import '@/styles/App.css';


interface ItemInfo {
    id: number;
    name: string;
    clubName: string;
    borrowedAt: string;
    expectedReturn: string;
    image?: string;
}

interface LocationState {
    item?: ItemInfo;
}

export function ReturnDetailPage() {
    // API 명세상 실제로는 rentalId를 사용하므로 이름을 명확히 합니다.
    const { itemId: rentalId } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const item = locationState?.item;

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
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

    const handleReturnSubmit = async () => {
        if (!imagePreview || !selectedFile) {
            alert('반납 확인을 위해 물품 사진을 업로드해주세요.');
            return;
        }

        if (!rentalId) {
            alert('대여 정보를 불러올 수 없습니다.');
            return;
        }

        try {
            setIsSubmitting(true);
            
            // client.ts에 정의된 returnItem 호출
            const result = await returnItem(rentalId, selectedFile);

            if (result.success) {
                // result.data에 API 명세에 적힌 ReturnResponse가 담겨옵니다.
                console.log('반납 완료 데이터:', result.data);
                
                // 성공 시 대여 목록 탭으로 이동
                navigate('/user/dashboard', { 
                    state: { tab: 'borrowed' }, 
                    replace: true 
                });
            }
            // 에러 처리는 client.ts의 showNotification에서 이미 처리됨
        } catch (error) {
            console.error('Return submission error:', error);
        } finally {
            setIsSubmitting(false);
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
                    capture="environment"
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }}
                    disabled={isSubmitting}
                />

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
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isSubmitting ? '반납 처리 중...' : '반납하기'}
                </button>
            </main>
        </div>
    );
}