import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { applyToClub, getClubMembers, getClub, getSchedules, deleteClubMember, getAssets, getAssetPictures, getPictureUrl, type ClubMember, type Schedule, type Asset, type AssetPicture } from '@/api/client';
import '@/styles/App.css';
import '@/styles/AdminDashboard.css';

type TabType = 'borrowed' | 'clubs';

interface LocationState {
    tab?: TabType;
}

export function UserDashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;

    // 외부에서 탭 지정이 없으면 항상 첫 번째 탭('borrowed')으로 시작
    const [activeTab, setActiveTab] = useState<TabType>(locationState?.tab || 'borrowed');
    const [showAddClubModal, setShowAddClubModal] = useState(false);
    const [clubCode, setClubCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 동아리 목록 상태
    const [myClubs, setMyClubs] = useState<ClubMember[]>([]);
    const [clubsLoading, setClubsLoading] = useState(true);
    const [clubNames, setClubNames] = useState<Record<number, string>>({});
    const [assetNames, setAssetNames] = useState<Record<number, string>>({});
    const [assetImages, setAssetImages] = useState<Record<number, string>>({});

    // 대여 항목 상태
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'in_use' | 'returned' | 'overdue' | ''>('');

    // 동아리 목록 가져오기
    useEffect(() => {
        const fetchMyClubs = async () => {
            setClubsLoading(true);
            const result = await getClubMembers();
            if (result.success && result.data) {
                const clubs = result.data.items.filter(item => item.permission !== 2);
                setMyClubs(clubs);

                // 각 동아리의 이름 가져오기 (개별 실패 시에도 나머지 결과 사용)
                const names: Record<number, string> = {};
                const clubResults = await Promise.allSettled(
                    clubs.map(async (club) => {
                        const clubResult = await getClub(club.club_id);
                        return { clubId: club.club_id, clubResult };
                    })
                );
                clubResults.forEach((settledResult) => {
                    if (settledResult.status === 'fulfilled') {
                        const { clubId, clubResult } = settledResult.value;
                        if (clubResult.success && clubResult.data) {
                            names[clubId] = clubResult.data.name;
                        }
                    }
                });
                setClubNames(names);
            }
            setClubsLoading(false);
        };

        fetchMyClubs();
    }, []);

    // 대여 이력 가져오기
    useEffect(() => {
        const fetchAllSchedules = async () => {
            if (myClubs.length === 0 || activeTab !== 'borrowed') return;

            setSchedulesLoading(true);
            const allSchedules: Schedule[] = [];
            const newAssetNames: Record<number, string> = { ...assetNames };
            const newAssetImages: Record<number, string> = { ...assetImages };

            // 모든 동아리 순회하며 스케줄(대여이력) 조회 (개별 실패 시에도 나머지 결과 사용)
            const scheduleResults = await Promise.allSettled(
                myClubs.map(async (club) => {
                    const [scheduleResult, assetResult] = await Promise.all([
                        getSchedules(club.club_id, { status: statusFilter || undefined }),
                        getAssets(club.club_id)
                    ]);

                    if (assetResult.success && assetResult.data) {
                    await Promise.all(assetResult.data.map(async (asset: Asset) => {
                        newAssetNames[asset.id] = asset.name;
                        if (newAssetImages[asset.id]) return;
                        const picsResult = await getAssetPictures(asset.id);
                        if (picsResult.success && picsResult.data) {
                            const mainPic = picsResult.data.find((p: AssetPicture) => p.is_main) || picsResult.data[0];
                            if (mainPic && mainPic.id) {
                                newAssetImages[asset.id] = getPictureUrl(mainPic.id);
                                } else {
                                newAssetImages[asset.id] = ''; 
                            }
                        }
                    }));
                }
                    return { scheduleResult, assetResult };
                })
            );
            scheduleResults.forEach((settledResult) => {
                if (settledResult.status === 'fulfilled') {
                    const result = settledResult.value;
                    if (result.scheduleResult.success && result.scheduleResult.data) {
                        allSchedules.push(...result.scheduleResult.data.schedules);
                    }
                    if (result.assetResult.success && result.assetResult.data) {
                        result.assetResult.data.forEach(asset => {
                            newAssetNames[asset.id] = asset.name;
                        });
                        setAssetNames(newAssetNames);
                        setAssetImages(newAssetImages);
                        setSchedules(allSchedules);
                        setSchedulesLoading(false);
                    }
                }
            });

            // 시작일 기준 내림차순 정렬 (최신순)
            allSchedules.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
            setSchedules(allSchedules);
            setSchedulesLoading(false);
        };

        fetchAllSchedules();
    }, [myClubs, statusFilter, activeTab]);


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

                // 새 동아리 이름 가져오기 (개별 실패 시에도 나머지 결과 사용)
                const names: Record<number, string> = { ...clubNames };
                const clubsToFetch = clubs.filter(club => !names[club.club_id]);
                const clubResults = await Promise.allSettled(
                    clubsToFetch.map(async (club) => {
                        const clubResult = await getClub(club.club_id);
                        return { clubId: club.club_id, clubResult };
                    })
                );
                clubResults.forEach((settledResult) => {
                    if (settledResult.status === 'fulfilled') {
                        const { clubId, clubResult } = settledResult.value;
                        if (clubResult.success && clubResult.data) {
                            names[clubId] = clubResult.data.name;
                        }
                    }
                });
                setClubNames(names);
            }
        } else {
            setError(result.error || '가입 신청에 실패했습니다.');
        }
    };

    // 동아리 탈퇴 핸들러
    const handleLeaveClub = async (e: React.MouseEvent, club: ClubMember) => {
        e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

        const clubName = clubNames[club.club_id] || '이 동아리';
        if (!confirm(`'${clubName}'에서 탈퇴하시겠습니까?`)) {
            return;
        }

        const result = await deleteClubMember(club.id);
        if (result.success) {
            // 목록에서 제거
            setMyClubs(prev => prev.filter(c => c.id !== club.id));
        } else {
            alert(result.error || '탈퇴에 실패했습니다.');
        }
    };

    // 반납 핸들러 - ReturnDetailPage로 이동 (사진 업로드 필수)
    const handleReturnItem = (schedule: Schedule) => {
        const targetPath = `/return/detail/${schedule.id}`; 

        const itemInfo = {
            id: schedule.id,
            clubId: schedule.club_id,
            name: assetNames[schedule.asset_id] || `물품 ID: ${schedule.asset_id}`,
            image: assetImages[schedule.asset_id] || '',
            clubName: clubNames[schedule.club_id] || '알 수 없음',
            borrowedAt: formatDate(schedule.start_date),
            expectedReturn: schedule.end_date ? formatDate(schedule.end_date) : '미정',
        };

        navigate(targetPath, { state: { item: itemInfo } });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) {
            return '날짜 정보 없음';
        }
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                        대여이력
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

                {/* 대여이력 탭 */}
                {activeTab === 'borrowed' && (
                    <div className="admin-content">
                        <div className="filter-container" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as '' | 'in_use' | 'overdue' | 'returned')}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0',
                                    border: '1px solid var(--glass-border)',
                                    background: 'white',
                                    color: '#333',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="">전체 내역</option>
                                <option value="in_use">대여중</option>
                                <option value="overdue">연체</option>
                                <option value="returned">반납완료</option>
                            </select>
                        </div>

                        {schedulesLoading ? (
                            <div className="loading">대여 목록을 불러오는 중...</div>
                        ) : schedules.length === 0 ? (
                            <div className="empty-state">
                                <p>대여 이력이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="asset-list">
                                {schedules.map((schedule) => {
                                    // 1. 상태 판별 로직은 map의 실행 블록({}) 내부에서 처리합니다.
                                    const currentStatus = schedule.status.toLowerCase();
                                    const isInUse = currentStatus === 'in_use' || currentStatus === 'overdue';
                                    const isReturned = currentStatus === 'returned';

                                    // 2. 반드시 실제 JSX 요소(div 등)를 return 해야 합니다.
                                    return (
                                        <div key={schedule.id} className="asset-card">
                                            <div className="asset-image">
                                                {assetImages[schedule.asset_id] ? (
                                                    <img 
                                                        src={assetImages[schedule.asset_id]} 
                                                        alt="물품 사진" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                    />
                                                ) : (
                                                    <div className="asset-image-placeholder">
                                                        {isInUse ? '📱' : (isReturned ? '✅' : '📦')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="asset-info">
                                                <h3 className="asset-name">
                                                {assetNames[schedule.asset_id] || `물품 ID: ${schedule.asset_id}`}
                                                </h3>
                                                <p className="asset-detail">
                                                    동아리: {clubNames[schedule.club_id] || '로딩중...'}
                                                </p>
                                                <p className="asset-detail">
                                                    대여일: {new Date(schedule.start_date).toLocaleDateString('ko-KR')}
                                                </p>
                                                <p className="asset-detail">
                                                    상태: {isInUse ? (currentStatus === 'overdue' ? '연체' : '대여중') : (isReturned ? '반납완료' : '알 수 없음')}
                                                </p>
                                            </div>
                                            {isInUse && (
                                                <button
                                                    className="primary-btn"
                                                    onClick={() => handleReturnItem(schedule)}
                                                >
                                                    반납하기
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
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
                                        <div className="member-actions">
                                            <button
                                                className="leave-club-btn"
                                                onClick={(e) => handleLeaveClub(e, club)}
                                            >
                                                탈퇴
                                            </button>
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