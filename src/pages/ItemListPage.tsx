import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClubItems, borrowItem } from '@/api/client'; // borrowItem 함수가 api/client에 있어야 함
import { clubNames } from '@/mocks/data';
import type { ClubItem } from '@/api/client';
import '@/styles/App.css';

const ITEMS_PER_PAGE = 10;

export function ItemListPage() {
    const { clubId } = useParams<{ clubId: string }>();
    const navigate = useNavigate();

    // 상태 관리
    const [items, setItems] = useState<ClubItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<ClubItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [returnDate, setReturnDate] = useState('');

    const clubIdNum = parseInt(clubId || '0', 10);
    const clubName = clubNames[clubIdNum] || `동아리 ${clubId}`;

    // 데이터 패칭 함수
    const fetchItems = useCallback(async () => {
        setLoading(true);
        const result = await getClubItems(clubIdNum);
        if (result.success && result.data) {
            setItems(result.data.items);
        } else {
            setError(result.error || '물품을 불러오는데 실패했습니다.');
        }
        setLoading(false);
    }, [clubIdNum]);

    useEffect(() => {
        if (clubIdNum) {
            fetchItems();
        }
    }, [fetchItems, clubIdNum]);

    // 대여 버튼 클릭 핸들러
    const handleRentClick = (item: ClubItem) => {
        setSelectedItem(item);
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setReturnDate(defaultDate.toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    // 대여 확정 핸들러
    const handleConfirmBorrow = async () => {
        if (!selectedItem) return;
        const result = await borrowItem(selectedItem.item_id, returnDate);
        if (result.success) {
            setIsModalOpen(false);
            fetchItems(); // 목록 새로고침
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            // 'available' 상태 처리 임의 추가, 벡엔드와 논의 필요 // 
            case 'available': return <span className="status-badge available">대여 가능</span>;
            case 'returned': return <span className="status-badge returned">대여 가능</span>;
            case 'borrowed': return <span className="status-badge borrowed">대여 중</span>;
            case 'overdue': return <span className="status-badge overdue">연체됨</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ko-KR');
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 페이지네이션 계산
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="container">
            <main className="main-content">
                <button className="back-btn" onClick={() => navigate('/clubs')}>
                    ← 동아리 목록
                </button>
                <h2>{clubName}</h2>
                <p className="page-subtitle">물품 목록 ({items.length}개)</p>

                {loading ? (
                    <div className="loading">불러오는 중...</div>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : items.length === 0 ? (
                    <p className="empty-message">등록된 물품이 없습니다.</p>
                ) : (
                    <>
                        <div className="item-grid">
                            {currentItems.map(item => (
                                <div key={item.item_id} className="item-card">
                                    <div className="item-header">
                                        <h3 className="item-name">{item.name}</h3>
                                        {getStatusBadge(item.status)}
                                    </div>
                                    {item.status === 'returned' || item.status === 'available' ? (
                                        <button className="rent-btn" onClick={() => handleRentClick(item)}>
                                            대여하기
                                        </button>
                                    ) : (
                                        <div className="item-details">
                                            {item.current_holder && (
                                                <p className="item-holder">대여자: {item.current_holder}</p>
                                            )}
                                            <p className="item-return-date">
                                                반납 예정일: {formatDate(item.expected_return_date)}
                                            </p>
                                        </div>
                                    )}
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

            {isModalOpen && selectedItem && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>대여 신청: {selectedItem.name}</h3>
                        <div className="form-group" style={{ margin: '20px 0' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>반납 예정일</label>
                            <input 
                                type="date" 
                                value={returnDate} 
                                onChange={(e) => setReturnDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
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