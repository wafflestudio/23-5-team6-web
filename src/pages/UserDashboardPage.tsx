import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { applyToClub, getClubMembers, getClub, getSchedules, deleteClubMember, type ClubMember, type Schedule } from '@/api/client';
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

    // 대여 항목 상태
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'in_use' | 'returned' | ''>('');

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

            // 모든 동아리 순회하며 스케줄(대여이력) 조회 (개별 실패 시에도 나머지 결과 사용)
            const scheduleResults = await Promise.allSettled(
                myClubs.map(async (club) => {
                    const result = await getSchedules(club.club_id, { status: statusFilter || undefined });
                    return result;
                })
            );
            scheduleResults.forEach((settledResult) => {
                if (settledResult.status === 'fulfilled') {
                    const result = settledResult.value;
                    if (result.success && result.data) {
                        allSchedules.push(...result.data.schedules);
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

    // 반납 핸들러 - ReturnDetailPage로 이동 (사진 업로드 필수)
    const handleReturnItem = async (schedule: Schedule) => {
        // 동아리 위치 정보 가져오기
        const clubResult = await getClub(schedule.club_id);
        if (!clubResult.success || !clubResult.data) {
            alert('동아리 정보를 불러올 수 없습니다.');
            return;
        }

        const clubData = clubResult.data;

        // 동아리 위치가 설정되어 있는 경우 GPS 검사
        if (clubData.location_lat && clubData.location_lng) {
            // GPS 지원 확인
            if (!navigator.geolocation) {
                alert('이 브라우저에서는 GPS를 지원하지 않습니다.');
                return;
            }

            // 동아리 위치 (API는 degrees * 1,000,000 형식)
            const clubLat = clubData.location_lat / 1000000;
            const clubLng = clubData.location_lng / 1000000;

            // 현재 GPS 위치 가져오기
            return new Promise<void>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;

                        // 거리 계산
                        const distance = calculateDistance(userLat, userLng, clubLat, clubLng);

                        if (distance > 15) {
                            alert(`⚠️ 동아리 위치에서 너무 멀리 있습니다.\n\n현재 거리: ${distance.toFixed(1)}m\n허용 거리: 15m 이내\n\n동아리 위치 근처에서 반납해주세요.`);
                            resolve();
                            return;
                        }

                        // 15m 이내: ReturnDetailPage로 이동
                        navigate(`/return/${schedule.id}`, {
                            state: {
                                item: {
                                    id: schedule.id,
                                    name: `물품 ID: ${schedule.asset_id}`,
                                    clubName: clubNames[schedule.club_id] || '알 수 없음',
                                    borrowedAt: formatDate(schedule.start_date),
                                    expectedReturn: schedule.end_date ? formatDate(schedule.end_date) : '미정',
                                },
                                location: { lat: userLat, lng: userLng }
                            }
                        });
                        resolve();
                    },
                    (error: GeolocationPositionError) => {
                        console.error('GPS error:', error);
                        let errorMessage = '위치를 가져올 수 없습니다.';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = '위치 정보를 사용할 수 없습니다. GPS 신호를 확인해주세요.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = '위치 요청 시간이 초과되었습니다. 다시 시도해주세요.';
                                break;
                        }
                        alert(errorMessage);
                        resolve();
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            });
        } else {
            // 동아리 위치가 설정되지 않은 경우: GPS 검사 없이 바로 이동
            navigate(`/return/${schedule.id}`, {
                state: {
                    item: {
                        id: schedule.id,
                        name: `물품 ID: ${schedule.asset_id}`,
                        clubName: clubNames[schedule.club_id] || '알 수 없음',
                        borrowedAt: formatDate(schedule.start_date),
                        expectedReturn: schedule.end_date ? formatDate(schedule.end_date) : '미정',
                    }
                }
            });
        }
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
                                onChange={(e) => setStatusFilter(e.target.value as '' | 'in_use' | 'returned')}
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
                                <option value="in_use">사용중</option>
                                <option value="returned">사용가능</option>
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
                                {schedules.map((schedule) => (
                                    <div key={schedule.id} className="asset-card">
                                        <div className="asset-image">
                                            <div className="asset-image-placeholder">
                                                {schedule.status === 'in_use' ? '📱' : '✅'}
                                            </div>
                                        </div>
                                        <div className="asset-info">
                                            <h3 className="asset-name">물품 ID: {schedule.asset_id}</h3>
                                            <p className="asset-detail">
                                                동아리: {clubNames[schedule.club_id] || '로딩중...'}
                                            </p>
                                            <p className="asset-detail">
                                                대여일: {formatDate(schedule.start_date)}
                                            </p>
                                            <p className="asset-detail">
                                                상태: {schedule.status === 'in_use' ? '사용중' : '사용가능'}
                                            </p>
                                            {schedule.end_date && (
                                                <p className="asset-detail">
                                                    반납일: {formatDate(schedule.end_date)}
                                                </p>
                                            )}
                                        </div>
                                        {schedule.status === 'in_use' && (
                                            <button
                                                className="primary-btn"
                                                onClick={() => handleReturnItem(schedule)}
                                            >
                                                반납하기
                                            </button>
                                        )}
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