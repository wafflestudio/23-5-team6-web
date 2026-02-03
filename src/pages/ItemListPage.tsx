import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssets, borrowItem, type Asset } from '@/api/client';
import '@/styles/App.css';

const ITEMS_PER_PAGE = 10;

export function ItemListPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const { clubId } = useParams<{ clubId: string }>();
    const navigate = useNavigate();

    // 상태 관리
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [returnDate, setReturnDate] = useState('');

    const clubIdNum = parseInt(clubId || '0', 10);
    const isValidClubId = !Number.isNaN(clubIdNum) && clubIdNum > 0;

    useEffect(() => {
        const fetchAssets = async () => {
            if (!isValidClubId) {
                setError('유효하지 않은 동아리입니다.');
                setLoading(false);
                return;
            }
            setLoading(true);
            const result = await getAssets(clubIdNum);
            if (result.success && result.data) {
                setAssets(result.data);
            } else {
                setError(result.error || '물품을 불러오는데 실패했습니다.');
            }
            setLoading(false);
        };

        fetchAssets();
    }, [clubIdNum, isValidClubId, refreshKey]);

    // 대여 버튼 클릭 핸들러
    const handleRentClick = (asset: Asset) => {
        setSelectedAsset(asset);
        const defaultDate = new Date();
        // max_rental_days가 설정되어 있으면 그 값을, 아니면 기본 7일
        const defaultDays = asset.max_rental_days || 7;
        defaultDate.setDate(defaultDate.getDate() + defaultDays);
        setReturnDate(defaultDate.toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    // 대여 확정 핸들러
    const handleConfirmBorrow = async () => {
        if (!selectedAsset) return;

        // max_rental_days 검증
        if (selectedAsset.max_rental_days) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(returnDate);
            const diffDays = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > selectedAsset.max_rental_days) {
                alert(`이 물품의 최대 대여 기간은 ${selectedAsset.max_rental_days}일입니다.\n반납 예정일을 다시 선택해주세요.`);
                return;
            }
        }

        const result = await borrowItem(selectedAsset.id, returnDate);
        if (result.success) {
            setIsModalOpen(false);
            setRefreshKey(prev => prev + 1); // 목록 새로고침
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 페이지네이션 계산
    const totalPages = Math.ceil(assets.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentAssets = assets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="container">
            <main className="main-content">
                <button className="back-btn" onClick={() => navigate('/clubs')}>
                    ← 동아리 목록
                </button>
                <h2>물품 대여</h2>
                <p className="page-subtitle">대여 가능한 물품 ({assets.length}개)</p>

                {loading ? (
                    <div className="loading">불러오는 중...</div>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : assets.length === 0 ? (
                    <p className="empty-message">등록된 물품이 없습니다.</p>
                ) : (
                    <>
                        <div className="item-grid">
                            {currentAssets.map(asset => (
                                <div key={asset.id} className="item-card">
                                    <div className="item-image">
                                        <span style={{ fontSize: '2rem' }}>📦</span>
                                    </div>
                                    <div className="item-content">
                                        <div className="item-header">
                                            <h3 className="item-name">{asset.name}</h3>
                                            <span className={`status-badge ${asset.available_quantity > 0 ? 'available' : 'borrowed'}`}>
                                                {asset.available_quantity > 0 ? '대여 가능' : '대여 불가'}
                                            </span>
                                        </div>
                                        <div className="item-details">
                                            <p className="asset-detail">
                                                수량: {asset.available_quantity}/{asset.total_quantity}
                                            </p>
                                            <p className="asset-detail">
                                                위치: {asset.location || '미지정'}
                                            </p>
                                            <p className="item-description">
                                                {asset.description || '설명이 없습니다.'}
                                            </p>
                                        </div>
                                        {asset.available_quantity > 0 ? (
                                            <button className="rent-btn" onClick={() => handleRentClick(asset)} style={{ width: '100%' }}>
                                                대여하기
                                            </button>
                                        ) : (
                                            <button className="rent-btn disabled" disabled style={{ width: '100%' }}>
                                                품절
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>←</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} className={`pagination-btn ${page === currentPage ? 'active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>
                                ))}
                                <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>→</button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {isModalOpen && selectedAsset && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>대여 신청: {selectedAsset.name}</h3>
                        <div className="form-group" style={{ margin: '20px 0' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>반납 예정일</label>
                            {selectedAsset.max_rental_days && (
                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                                    최대 대여 기간: {selectedAsset.max_rental_days}일
                                </p>
                            )}
                            <input
                                type="date"
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                max={selectedAsset.max_rental_days
                                    ? (() => {
                                        const maxDate = new Date();
                                        maxDate.setDate(maxDate.getDate() + selectedAsset.max_rental_days);
                                        return maxDate.toISOString().split('T')[0];
                                    })()
                                    : undefined}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
                            <button className="confirm-btn" onClick={handleConfirmBorrow}>대여 확정</button>
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}