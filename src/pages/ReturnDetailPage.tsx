import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { returnItem } from '@/api/client';
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
    const { itemId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;
    const item = locationState?.item;

    // 사진 업로드를 위한 상태 및 Ref
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 사진 업로드 클릭 핸들러
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // 파일 선택 시 미리보기 생성
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        // 1. 사진 업로드 여부 체크
        if (!imagePreview) {
            alert('반납 확인을 위해 물품 사진을 업로드해주세요.');
            return;
        }

        if (!itemId) {
            alert('물품 정보를 불러올 수 없습니다.');
            return;
        }

        // 2. 여기에 실제 API 호출 로직이 들어갑니다.
       const result = await returnItem(itemId, selectedFile!);

        // 3. 결과에 따른 알림 처리
        // state를 통해 'borrowed' 탭을 활성화하도록 전달합니다.
        if (result.success){
            alert('반납 신청이 완료되었습니다.');
            navigate('/user/dashboard', { state: { tab: 'borrowed' }, replace: true });
        } else {
        alert('반납 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
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
                {/* 1. 상단 물품 정보 카드 (image_121969.png 레이아웃) */}
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

                {/* 2. 사진 업로드 영역 (image_121969.png의 회색 박스) */}
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
                        cursor: 'pointer',
                        overflow: 'hidden',
                        border: imagePreview ? '2px solid #5979BA' : 'none'
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

                {/* 숨겨진 파일 Input */}
                <input 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                />

                {/* 3. 하단 반납하기 버튼 */}
                <button 
                    className="submit-btn" 
                    onClick={handleReturnSubmit}
                    style={{ 
                        marginTop: '60px', 
                        backgroundColor: '#373F47', /* 사진 속 어두운 회색 버튼색 */
                        width: '100%',
                        padding: '18px',
                        borderRadius: '12px',
                        fontSize: '1.1rem'
                    }}
                >
                    반납하기
                </button>
            </main>
        </div>
    );
}