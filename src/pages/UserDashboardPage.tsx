import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { applyToClub, getClubMembers, getClub, type ClubMember } from '@/api/client';
import '@/styles/App.css';
import '@/styles/AdminDashboard.css';

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

export function UserDashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;

    const [activeTab, setActiveTab] = useState<TabType>(() => getInitialTab(locationState));
    const [showAddClubModal, setShowAddClubModal] = useState(false);
    const [clubCode, setClubCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 동아리 목록 상태
    const [myClubs, setMyClubs] = useState<ClubMember[]>([]);
    const [clubsLoading, setClubsLoading] = useState(true);
    const [clubNames, setClubNames] = useState<Record<number, string>>({});

    // 대여 항목 상태 (TODO: 대여 목록 API 연동 필요)
    const [borrowedItems] = useState<Array<{
        id: number;
        name: string;
        clubName: string;
        borrowedAt: string;
        expectedReturn: string;
    }>>([]);
    const [borrowedLoading] = useState(false);

    // 탭 변경 시 sessionStorage에 저장
    useEffect(() => {
        sessionStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    // 동아리 목록 가져오기
    useEffect(() => {
        const fetchMyClubs = async () => {
            setClubsLoading(true);
            const result = await getClubMembers();
            if (result.success && result.data) {
                const clubs = result.data.items.filter(item => item.permission !== 2);
                setMyClubs(clubs);

                // 각 동아리의 이름 가져오기
                const names: Record<number, string> = {};
                await Promise.all(
                    clubs.map(async (club) => {
                        const clubResult = await getClub(club.club_id);
                        if (clubResult.success && clubResult.data) {
                            names[club.club_id] = clubResult.data.name;
                        }
                    })
                );
                setClubNames(names);
            }
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
                const clubs = refreshResult.data.items.filter(item => item.permission !== 2);
                setMyClubs(clubs);

                // 새 동아리 이름 가져오기
                const names: Record<number, string> = { ...clubNames };
                await Promise.all(
                    clubs.map(async (club) => {
                        if (!names[club.club_id]) {
                            const clubResult = await getClub(club.club_id);
                            if (clubResult.success && clubResult.data) {
                                names[club.club_id] = clubResult.data.name;
                            }
                        }
                    })
                );
                setClubNames(names);
            }
        } else {
            setError(result.error || '가입 신청에 실패했습니다.');
        }
    };

    // 상세페이지로 이동하는 핸들러
    const handleGoToReturnDetail = (itemId: number) => {
    // 아이템 ID를 URL 파라미터로 전달하고, 
    // 필요하다면 현재 상태(tab 등)를 state로 넘길 수 있습니다.
    navigate(`/return/detail/${itemId}`, { 
        state: { from: location.pathname, tab: activeTab } 
    });
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
                        {borrowedLoading ? (
                            <div className="loading">대여 목록을 불러오는 중...</div>
                        ) : borrowedItems.length === 0 ? (
                            <div className="empty-state">
                                <p>현재 대여 중인 물품이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="asset-list">
                                {borrowedItems.map((item) => (
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
                                        <button
                                            className="primary-btn"
                                            onClick={() => handleGoToReturnDetail(item.id)}
                                        >
                                            반납 신청하기
                                        </button>
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
                                            <h3 className="member-name">
                                                동아리 '{clubNames[club.club_id] || '로딩중...'}'
                                            </h3>
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

