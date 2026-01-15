import { useState, useEffect } from 'react';
import { getApplyList, approveUser, getClubMembers, deleteClubMember, type ApplyListItem, type ClubMember } from '@/api/client';
import '@/styles/App.css';
import '@/styles/AdminDashboard.css';

// 더미 데이터 (자산은 아직 API가 없으므로 유지)
const dummyItems = [
    { id: 1, name: '맥북 프로 14', status: 'available', borrowedAt: null, expectedReturn: null },
    { id: 2, name: '맥북 프로 14', status: 'borrowed', borrowedAt: '2024-01-10', expectedReturn: '2024-01-20' },
    { id: 3, name: '맥북 프로 14', status: 'available', borrowedAt: null, expectedReturn: null },
    { id: 4, name: '아이패드 프로', status: 'borrowed', borrowedAt: '2024-01-05', expectedReturn: '2024-01-15' },
    { id: 5, name: '애플 펜슬', status: 'available', borrowedAt: null, expectedReturn: null },
];

type TabType = 'assets' | 'members';

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

export function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<TabType>('assets');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [applyList, setApplyList] = useState<ApplyListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 동아리 멤버 상태
    const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [myClubId, setMyClubId] = useState<number | null>(null);

    // 관리자 동아리 멤버 목록 가져오기
    useEffect(() => {
        const fetchClubMembers = async () => {
            setMembersLoading(true);
            setMembersError(null);

            // 1. 먼저 자신의 club_id를 가져옴
            const myClubsResult = await getClubMembers();
            if (!myClubsResult.success || !myClubsResult.data || myClubsResult.data.items.length === 0) {
                setMembersError('동아리 정보를 불러올 수 없습니다.');
                setMembersLoading(false);
                return;
            }

            // 관리자(permission === 1)인 동아리 찾기
            const adminClub = myClubsResult.data.items.find(item => item.permission === 1);
            if (!adminClub) {
                setMembersError('관리자 권한이 있는 동아리가 없습니다.');
                setMembersLoading(false);
                return;
            }

            setMyClubId(adminClub.club_id);

            // 2. 해당 동아리의 모든 멤버 조회
            const membersResult = await getClubMembers({ club_id: adminClub.club_id });
            if (membersResult.success && membersResult.data) {
                setClubMembers(membersResult.data.items);
            } else {
                setMembersError(membersResult.error || '멤버 목록을 불러오는데 실패했습니다.');
            }

            setMembersLoading(false);
        };

        fetchClubMembers();
    }, []);

    const handleOpenApprovalModal = async () => {
        setIsLoading(true);
        setError(null);
        const result = await getApplyList();
        setIsLoading(false);

        if (result.success && result.data) {
            setApplyList(result.data);
            setShowApprovalModal(true);
        } else {
            setError(result.error || '신청 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleApprove = async (userId: string, approved: boolean) => {
        const result = await approveUser(userId, approved);
        if (result.success) {
            // 승인/거절 후 목록에서 제거
            setApplyList(prev => prev.filter(user => user.id !== userId));

            // 멤버 목록 새로고침
            if (myClubId) {
                const membersResult = await getClubMembers({ club_id: myClubId });
                if (membersResult.success && membersResult.data) {
                    setClubMembers(membersResult.data.items);
                }
            }
        }
    };

    const handleDeleteMember = async (memberId: number) => {
        if (!confirm('정말 이 멤버를 삭제하시겠습니까?')) {
            return;
        }

        const result = await deleteClubMember(memberId);
        if (result.success) {
            // 삭제 후 목록에서 제거
            setClubMembers(prev => prev.filter(member => member.id !== memberId));
        } else {
            setError(result.error || '멤버 삭제에 실패했습니다.');
        }
    };

    return (
        <div className="container">
            <main className="main-content admin-dashboard">
                {/* 탭 네비게이션 */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'assets' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assets')}
                    >
                        자산관리
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                    >
                        멤버관리
                    </button>
                    <button
                        className="member-approve-btn"
                        onClick={handleOpenApprovalModal}
                        disabled={isLoading}
                    >
                        {isLoading ? '로딩...' : '멤버 승인'}
                    </button>
                </div>

                {error && <p className="error-message">{error}</p>}

                {/* 멤버 승인 모달 */}
                {showApprovalModal && (
                    <div className="approval-modal-overlay" onClick={() => setShowApprovalModal(false)}>
                        <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="approval-modal-header">
                                <h3>멤버 승인 요청</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowApprovalModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="approval-modal-content">
                                {applyList.length === 0 ? (
                                    <p className="empty-message">승인 대기 중인 멤버가 없습니다.</p>
                                ) : (
                                    <div className="approval-list">
                                        {applyList.map((user) => (
                                            <div key={user.id} className="approval-item">
                                                <div className="approval-user-info">
                                                    <p className="approval-user-name">{user.name}</p>
                                                    <p className="approval-user-email">{user.email}</p>
                                                    <p className="approval-user-student">{user.student_id}</p>
                                                </div>
                                                <div className="approval-actions">
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() => handleApprove(user.id, true)}
                                                    >
                                                        승인
                                                    </button>
                                                    <button
                                                        className="reject-btn"
                                                        onClick={() => handleApprove(user.id, false)}
                                                    >
                                                        거절
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 자산관리 탭 */}
                {activeTab === 'assets' && (
                    <div className="admin-content">
                        <div className="asset-list">
                            {dummyItems.map((item) => (
                                <div key={item.id} className="asset-card">
                                    <div className="asset-image">
                                        <div className="asset-image-placeholder">📱</div>
                                    </div>
                                    <div className="asset-info">
                                        <h3 className="asset-name">{item.name}</h3>
                                        <p className="asset-detail">
                                            대여상태: {item.status === 'available' ? '대여 가능' : '대여 중'}
                                        </p>
                                        <p className="asset-detail">
                                            반납예정일: {item.expectedReturn || '-'}
                                        </p>
                                        <button className="detail-btn">상세페이지</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 멤버관리 탭 */}
                {activeTab === 'members' && (
                    <div className="admin-content">
                        {membersLoading ? (
                            <div className="loading">멤버 목록을 불러오는 중...</div>
                        ) : membersError ? (
                            <div className="error-message">{membersError}</div>
                        ) : clubMembers.length === 0 ? (
                            <div className="empty-state">
                                <p>등록된 멤버가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="member-list">
                                {clubMembers.map((member) => (
                                    <div key={member.id} className="member-card">
                                        <div className="member-info">
                                            <h3 className="member-name">사용자 {member.user_id}</h3>
                                            <p className="member-email">멤버 ID: {member.id}</p>
                                        </div>
                                        <div className="member-actions">
                                            {getPermissionTag(member.permission)}
                                            {member.permission !== 1 && (
                                                <button
                                                    className="delete-member-btn"
                                                    onClick={() => handleDeleteMember(member.id)}
                                                >
                                                    삭제
                                                </button>
                                            )}
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


