import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClubItems } from '@/api/client';
import { clubNames } from '@/mocks/data';
import type { ClubItem } from '@/api/client';
import '@/styles/App.css';

const ITEMS_PER_PAGE = 10; // 5x2 grid

export function ItemListPage() {
    const { clubId } = useParams<{ clubId: string }>();
    const navigate = useNavigate();
    const [items, setItems] = useState<ClubItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    const clubIdNum = parseInt(clubId || '0', 10);
    const clubName = clubNames[clubIdNum] || `동아리 ${clubId}`;

    // 페이지네이션 계산
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = items.slice(startIndex, endIndex);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            const result = await getClubItems(clubIdNum);
            if (result.success && result.data) {
                setItems(result.data.items);
            } else {
                setError(result.error || '물품을 불러오는데 실패했습니다.');
            }
            setLoading(false);
        };

        if (clubIdNum) {
            fetchItems();
        }
    }, [clubIdNum]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <span className="status-badge available">대여 가능</span>;
            case 'borrowed':
                return <span className="status-badge borrowed">대여 중</span>;
            default:
                return <span className="status-badge">{status}</span>;
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
                                    {item.status === 'borrowed' && (
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
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ←
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
