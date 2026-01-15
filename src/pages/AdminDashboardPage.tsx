import { useState } from 'react';
import { getApplyList, approveUser, type ApplyListItem } from '@/api/client';
import '@/styles/App.css';
import '@/styles/AdminDashboard.css';

// 더미 데이터
const dummyItems = [
    { id: 1, name: '맥북 프로 14', status: 'available', borrowedAt: null, expectedReturn: null },
    { id: 2, name: '맥북 프로 14', status: 'borrowed', borrowedAt: '2024-01-10', expectedReturn: '2024-01-20' },
    { id: 3, name: '맥북 프로 14', status: 'available', borrowedAt: null, expectedReturn: null },
    { id: 4, name: '아이패드 프로', status: 'borrowed', borrowedAt: '2024-01-05', expectedReturn: '2024-01-15' },
    { id: 5, name: '애플 펜슬', status: 'available', borrowedAt: null, expectedReturn: null },
];

const dummyMembers = [
    { id: 1, name: '김철수', email: 'kim@test.com', status: 'approved', joinedAt: '2024-01-01' },
    { id: 2, name: '이영희', email: 'lee@test.com', status: 'approved', joinedAt: '2024-01-02' },
    { id: 3, name: '박민수', email: 'park@test.com', status: 'pending', joinedAt: '2024-01-10' },
];

type TabType = 'assets' | 'members';

export function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<TabType>('assets');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [applyList, setApplyList] = useState<ApplyListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                        <div className="member-list">
                            {dummyMembers.map((member) => (
                                <div key={member.id} className="member-card">
                                    <div className="member-info">
                                        <h3 className="member-name">{member.name}</h3>
                                        <p className="member-email">{member.email}</p>
                                        <p className="member-joined">가입일: {member.joinedAt}</p>
                                    </div>
                                    <div className="member-status">
                                        <span className={`status-tag ${member.status}`}>
                                            {member.status === 'approved' ? '승인됨' : '대기중'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

