import { useState, useEffect } from 'react';
import { getApplyList, approveUser, getClubMembers, deleteClubMember, addAsset, getAssets, updateAsset, deleteAsset, type ApplyListItem, type ClubMember, type Asset } from '@/api/client';
import '@/styles/App.css';
import '@/styles/AdminDashboard.css';

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
    const [showAddAssetModal, setShowAddAssetModal] = useState(false);
    const [applyList, setApplyList] = useState<ApplyListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 물품 추가 폼 상태
    const [newAssetName, setNewAssetName] = useState('');
    const [newAssetDescription, setNewAssetDescription] = useState('');
    const [newAssetQuantity, setNewAssetQuantity] = useState(1);
    const [isAddingAsset, setIsAddingAsset] = useState(false);

    // 자산 목록 상태
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetsLoading, setAssetsLoading] = useState(true);
    const [assetsError, setAssetsError] = useState<string | null>(null);

    // 확장된 자산 카드 및 수정 상태
    const [expandedAssetId, setExpandedAssetId] = useState<number | null>(null);
    const [editingAsset, setEditingAsset] = useState<{
        name: string;
        description: string;
        quantity: number;
        location: string;
    } | null>(null);
    const [isUpdatingAsset, setIsUpdatingAsset] = useState(false);

    // 동아리 멤버 상태
    const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [myClubId, setMyClubId] = useState<number | null>(null);

    // 자산 목록 가져오기 함수
    const fetchAssets = async (clubId: number) => {
        setAssetsLoading(true);
        setAssetsError(null);
        const result = await getAssets(clubId);
        if (result.success && result.data) {
            setAssets(result.data);
        } else {
            setAssetsError(result.error || '자산 목록을 불러오는데 실패했습니다.');
        }
        setAssetsLoading(false);
    };

    // 관리자 동아리 정보 및 멤버 목록 가져오기
    useEffect(() => {
        const fetchClubData = async () => {
            setMembersLoading(true);
            setMembersError(null);

            // 1. 먼저 자신의 club_id를 가져옴
            const myClubsResult = await getClubMembers();
            if (!myClubsResult.success || !myClubsResult.data || myClubsResult.data.items.length === 0) {
                setMembersError('동아리 정보를 불러올 수 없습니다.');
                setMembersLoading(false);
                setAssetsLoading(false);
                return;
            }

            // 관리자(permission === 1)인 동아리 찾기
            const adminClub = myClubsResult.data.items.find(item => item.permission === 1);
            if (!adminClub) {
                setMembersError('관리자 권한이 있는 동아리가 없습니다.');
                setMembersLoading(false);
                setAssetsLoading(false);
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

            // 3. 자산 목록 조회
            fetchAssets(adminClub.club_id);
        };

        fetchClubData();
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

    const handleOpenAddAssetModal = () => {
        setNewAssetName('');
        setNewAssetDescription('');
        setNewAssetQuantity(1);
        setShowAddAssetModal(true);
    };

    const handleAddAsset = async () => {
        if (!newAssetName.trim()) {
            setError('물품 이름을 입력해주세요.');
            return;
        }

        setIsAddingAsset(true);
        setError(null);

        const result = await addAsset({
            name: newAssetName.trim(),
            description: newAssetDescription.trim(),
            category_id: 1,
            quantity: newAssetQuantity,
            location: '',
        });

        setIsAddingAsset(false);

        if (result.success) {
            setShowAddAssetModal(false);
            // 물품 목록 새로고침
            if (myClubId) {
                fetchAssets(myClubId);
            }
        } else {
            setError(result.error || '물품 추가에 실패했습니다.');
        }
    };

    // 자산 카드 클릭 핸들러
    const handleAssetClick = (asset: Asset) => {
        if (expandedAssetId === asset.id) {
            // 이미 확장된 카드 클릭 시 닫기
            setExpandedAssetId(null);
            setEditingAsset(null);
        } else {
            // 새 카드 확장
            setExpandedAssetId(asset.id);
            setEditingAsset({
                name: asset.name,
                description: asset.description,
                quantity: asset.total_quantity,
                location: asset.location,
            });
        }
    };

    // 자산 수정 핸들러
    const handleUpdateAsset = async () => {
        if (!expandedAssetId || !editingAsset) return;

        if (!editingAsset.name.trim()) {
            setError('물품 이름을 입력해주세요.');
            return;
        }

        setIsUpdatingAsset(true);
        setError(null);

        const result = await updateAsset(expandedAssetId, {
            name: editingAsset.name.trim(),
            description: editingAsset.description.trim(),
            quantity: editingAsset.quantity,
            location: editingAsset.location.trim(),
        });

        setIsUpdatingAsset(false);

        if (result.success) {
            setExpandedAssetId(null);
            setEditingAsset(null);
            if (myClubId) {
                fetchAssets(myClubId);
            }
        } else {
            setError(result.error || '물품 수정에 실패했습니다.');
        }
    };

    // 자산 삭제 핸들러
    const handleDeleteAsset = async (assetId: number) => {
        if (!confirm('정말 이 물품을 삭제하시겠습니까?')) {
            return;
        }

        const result = await deleteAsset(assetId);
        if (result.success) {
            setExpandedAssetId(null);
            setEditingAsset(null);
            if (myClubId) {
                fetchAssets(myClubId);
            }
        } else {
            setError(result.error || '물품 삭제에 실패했습니다.');
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
                    {activeTab === 'members' && (
                        <button
                            className="member-approve-btn"
                            onClick={handleOpenApprovalModal}
                            disabled={isLoading}
                        >
                            {isLoading ? '로딩...' : '멤버 승인'}
                        </button>
                    )}
                    {activeTab === 'assets' && (
                        <button
                            className="member-approve-btn"
                            onClick={handleOpenAddAssetModal}
                        >
                            물품 추가
                        </button>
                    )}
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

                {/* 물품 추가 모달 */}
                {showAddAssetModal && (
                    <div className="approval-modal-overlay" onClick={() => setShowAddAssetModal(false)}>
                        <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="approval-modal-header">
                                <h3>물품 추가</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowAddAssetModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="approval-modal-content">
                                <div className="add-asset-form">
                                    <div className="form-group">
                                        <label htmlFor="asset-name">물품 이름 *</label>
                                        <input
                                            id="asset-name"
                                            type="text"
                                            value={newAssetName}
                                            onChange={(e) => setNewAssetName(e.target.value)}
                                            placeholder="물품 이름을 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="asset-description">설명</label>
                                        <textarea
                                            id="asset-description"
                                            value={newAssetDescription}
                                            onChange={(e) => setNewAssetDescription(e.target.value)}
                                            placeholder="물품 설명을 입력하세요"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="asset-quantity">수량</label>
                                        <input
                                            id="asset-quantity"
                                            type="number"
                                            min={1}
                                            value={newAssetQuantity}
                                            onChange={(e) => setNewAssetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={() => setShowAddAssetModal(false)}
                                            disabled={isAddingAsset}
                                        >
                                            취소
                                        </button>
                                        <button
                                            className="approve-btn"
                                            onClick={handleAddAsset}
                                            disabled={isAddingAsset}
                                        >
                                            {isAddingAsset ? '추가 중...' : '추가'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 자산관리 탭 */}
                {activeTab === 'assets' && (
                    <div className="admin-content">
                        {assetsLoading ? (
                            <div className="loading">자산 목록을 불러오는 중...</div>
                        ) : assetsError ? (
                            <div className="error-message">{assetsError}</div>
                        ) : assets.length === 0 ? (
                            <div className="empty-state">
                                <p>등록된 자산이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="asset-list">
                                {assets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className={`asset-card ${expandedAssetId === asset.id ? 'expanded' : ''}`}
                                        onClick={() => handleAssetClick(asset)}
                                    >
                                        <div className="asset-card-header">
                                            <div className="asset-image">
                                                <div className="asset-image-placeholder">📦</div>
                                            </div>
                                            <div className="asset-info">
                                                <h3 className="asset-name">{asset.name}</h3>
                                                <p className="asset-detail">
                                                    수량: {asset.available_quantity}/{asset.total_quantity}
                                                </p>
                                                <p className="asset-detail">
                                                    {asset.description || '설명 없음'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 확장된 세부사항 */}
                                        {expandedAssetId === asset.id && editingAsset && (
                                            <div className="asset-detail-form" onClick={(e) => e.stopPropagation()}>
                                                <div className="form-group">
                                                    <label>물품 이름</label>
                                                    <input
                                                        type="text"
                                                        value={editingAsset.name}
                                                        onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>설명</label>
                                                    <textarea
                                                        value={editingAsset.description}
                                                        onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>수량</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={editingAsset.quantity}
                                                            onChange={(e) => setEditingAsset({ ...editingAsset, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>위치</label>
                                                        <input
                                                            type="text"
                                                            value={editingAsset.location}
                                                            onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })}
                                                            placeholder="예: 동아리방 선반"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="asset-detail-actions">
                                                    <button
                                                        className="delete-asset-btn"
                                                        onClick={() => handleDeleteAsset(asset.id)}
                                                        disabled={isUpdatingAsset}
                                                    >
                                                        삭제
                                                    </button>
                                                    <button
                                                        className="save-asset-btn"
                                                        onClick={handleUpdateAsset}
                                                        disabled={isUpdatingAsset}
                                                    >
                                                        {isUpdatingAsset ? '저장 중...' : '저장'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
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


