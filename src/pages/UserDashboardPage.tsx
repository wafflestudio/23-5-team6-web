import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { applyToClub, getClubMembers, type ClubMember } from '@/api/client';
import '@/styles/App.css';
import '@/styles/AdminDashboard.css';

// 더미 데이터 (API 연결 전 fallback용)
const dummyBorrowedItems = [
    { id: 1, name: '맥북 프로 14', clubName: '컴퓨터 동아리', borrowedAt: '2024-01-10', expectedReturn: '2024-01-20' },
    { id: 2, name: '아이패드 프로', clubName: '디자인 동아리', borrowedAt: '2024-01-05', expectedReturn: '2024-01-15' },
];

// 더미 동아리 데이터 (API 연결 전 fallback용)
const dummyClubs: ClubMember[] = [
    { id: 1, user_id: 'user1', club_id: 1, permission: 0 },
    { id: 2, user_id: 'user1', club_id: 2, permission: 0 },
    { id: 3, user_id: 'user1', club_id: 3, permission: 1 },
];

// club_id에 따른 동아리 이름 (임시)
const clubNameMap: { [key: number]: string } = {
    1: '컴퓨터 동아리',
    2: '디자인 동아리',
    3: '음악 동아리',
};

type TabType = 'borrowed' | 'clubs';

const TAB_STORAGE_KEY = 'user_dashboard_tab';

interface LocationState {
    tab?: TabType;
}

// 초기 탭 결정 함수
const getInitialTab = (locationState: LocationState | null): TabType => {
    if (locationState?.tab) {
        return locationState.tab;
    }
    const savedTab = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (savedTab === 'borrowed' || savedTab === 'clubs') {
        return savedTab;
    }
    return 'borrowed';
};

// permission 값에 따른 상태 태그
const getPermissionTag = (permission: number) => {
    switch (permission) {
        case 0:
            return <span className="status-tag approved">일반 회원</span>;
        case 1:
            return <span className="status-tag approved" style={{ background: 'rgba(89, 121, 186, 0.15)', color: '#5979BA', borderColor: 'rgba(89, 121, 186, 0.3)' }}>관리자</span>;
        case 2:
            return <span className="status-tag pending">가입 대기</span>;
        default:
            return <span className="status-tag">알 수 없음</span>;
    }
};

// 동아리 이름 가져오기
const getClubName = (clubId: number): string => {
    return clubNameMap[clubId] || `동아리 #${clubId}`;
};

export function UserDashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;

    const [activeTab, setActiveTab] = useState<TabType>(() => getInitialTab(locationState));
    const [showAddClubModal, setShowAddClubModal] = useState(false);
    const [clubCode, setClubCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 동아리 목록 상태 - 더미 데이터로 초기화
    const [myClubs, setMyClubs] = useState<ClubMember[]>(dummyClubs);
    const [clubsLoading, setClubsLoading] = useState(true);

    // 탭 변경 시 sessionStorage에 저장
    useEffect(() => {
        sessionStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    // 동아리 목록 가져오기
    useEffect(() => {
        const fetchMyClubs = async () => {
            setClubsLoading(true);
            const result = await getClubMembers();
            if (result.success && result.data && result.data.items.length > 0) {
                // API 성공 시 실제 데이터 사용
                setMyClubs(result.data.items.filter(item => item.permission !== 2));
            }
            // API 실패해도 더미 데이터가 이미 있으므로 그대로 표시
            setClubsLoading(false);
        };

        fetchMyClubs();
    }, []);


    const handleOpenAddClubModal = () => {
        setClubCode('');
        setError(null);
        setShowAddClubModal(true);
    };

    const handleApplyToClub = async () => {
        if (!clubCode.trim()) {
            setError('동아리 코드를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);
        const result = await applyToClub(clubCode.trim());
        setIsLoading(false);

        if (result.success) {
            setShowAddClubModal(false);
            setClubCode('');
            // 동아리 목록 새로고침
            const refreshResult = await getClubMembers();
            if (refreshResult.success && refreshResult.data) {
                setMyClubs(refreshResult.data.items.filter(item => item.permission !== 2));
            }
        } else {
            setError(result.error || '가입 신청에 실패했습니다.');
        }
    };

    return (
        <div className="container">
            <main className="main-content admin-dashboard">
                {/* 탭 네비게이션 */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'borrowed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('borrowed')}
                    >
                        대여항목
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'clubs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('clubs')}
                    >
                        동아리 목록
                    </button>
                    <button
                        className="member-approve-btn"
                        onClick={handleOpenAddClubModal}
                    >
                        동아리 추가
                    </button>
                </div>

                {/* 동아리 추가 모달 */}
                {showAddClubModal && (
                    <div className="approval-modal-overlay" onClick={() => setShowAddClubModal(false)}>
                        <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="approval-modal-header">
                                <h3>바로바로(borrow)</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowAddClubModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="approval-modal-content">
                                <div className="add-club-form">
                                    <div className="form-group">
                                        <label htmlFor="clubCode">동아리 고유 코드</label>
                                        <input
                                            type="text"
                                            id="clubCode"
                                            value={clubCode}
                                            onChange={(e) => setClubCode(e.target.value)}
                                            placeholder="동아리 코드를 입력하세요"
                                        />
                                    </div>

                                    {error && <p className="error-message">{error}</p>}

                                    <button
                                        className="submit-btn add-club-submit"
                                        onClick={handleApplyToClub}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? '신청 중...' : '동아리 가입 신청하기'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 대여항목 탭 */}
                {activeTab === 'borrowed' && (
                    <div className="admin-content">
                        {dummyBorrowedItems.length === 0 ? (
                            <div className="empty-state">
                                <p>현재 대여 중인 물품이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="asset-list">
                                {dummyBorrowedItems.map((item) => (
                                    <div key={item.id} className="asset-card">
                                        <div className="asset-image">
                                            <div className="asset-image-placeholder">📱</div>
                                        </div>
                                        <div className="asset-info">
                                            <h3 className="asset-name">{item.name}</h3>
                                            <p className="asset-detail">
                                                동아리: {item.clubName}
                                            </p>
                                            <p className="asset-detail">
                                                대여일: {item.borrowedAt}
                                            </p>
                                            <p className="asset-detail">
                                                반납예정일: {item.expectedReturn}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 동아리 목록 탭 */}
                {activeTab === 'clubs' && (
                    <div className="admin-content">
                        {clubsLoading ? (
                            <div className="loading">동아리 목록을 불러오는 중...</div>
                        ) : myClubs.length === 0 ? (
                            <div className="empty-state">
                                <p>가입된 동아리가 없습니다.</p>
                                <button
                                    className="primary-btn"
                                    onClick={handleOpenAddClubModal}
                                >
                                    동아리 추가하기
                                </button>
                            </div>
                        ) : (
                            <div className="member-list">
                                {myClubs.map((club) => (
                                    <div
                                        key={club.id}
                                        className="member-card"
                                        onClick={() => navigate(`/clubs/${club.club_id}/items`, { state: { fromTab: activeTab } })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="member-info">
                                            <h3 className="member-name">{getClubName(club.club_id)}</h3>
                                            <p className="member-email">Club ID: {club.club_id}</p>
                                        </div>
                                        <div className="member-status">
                                            {getPermissionTag(club.permission)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

