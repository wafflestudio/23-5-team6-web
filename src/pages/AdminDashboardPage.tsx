import { useState, useEffect } from 'react';
import { getClubMembers, deleteClubMember, addAsset, getAssets, updateAsset, deleteAsset, getMyClubs, uploadExcelAssets, getAssetStatistics, type ClubMember, type Asset, type AssetStatistics } from '@/api/client';
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
    const [showAddAssetModal, setShowAddAssetModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 물품 추가 폼 상태
    const [newAssetName, setNewAssetName] = useState('');
    const [newAssetDescription, setNewAssetDescription] = useState('');
    const [newAssetQuantity, setNewAssetQuantity] = useState(1);
    const [newAssetLocation, setNewAssetLocation] = useState('');

    const [isAddingAsset, setIsAddingAsset] = useState(false);
    const [addAssetError, setAddAssetError] = useState<string | null>(null);

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
    const [showEditModal, setShowEditModal] = useState(false);

    // 자산 통계 상태
    const [assetStats, setAssetStats] = useState<AssetStatistics | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    // 동아리 멤버 상태
    const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [myClubId, setMyClubId] = useState<number | null>(null);
    const [myClubName, setMyClubName] = useState<string>('');
    const [myClubCode, setMyClubCode] = useState<string>('');

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

    // 엑셀 업로드 상태
    const [showExcelModal, setShowExcelModal] = useState(false); // 엑셀 모달 표시 여부
    const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null); // 선택된 파일 저장
    const [isUploading, setIsUploading] = useState(false);

    // 관리자 동아리 정보 및 멤버 목록 가져오기
    useEffect(() => {
        const fetchClubData = async () => {
            setMembersLoading(true);
            setMembersError(null);

            // 1. GET /api/clubs로 관리자의 동아리 목록을 가져옴
            const clubsResult = await getMyClubs();
            console.log('getMyClubs result:', clubsResult);

            if (!clubsResult.success || !clubsResult.data || clubsResult.data.length === 0) {
                setMembersError(`동아리 정보를 불러올 수 없습니다. (${clubsResult.error || '데이터 없음'})`);
                setMembersLoading(false);
                setAssetsLoading(false);
                return;
            }

            // 첫 번째 동아리를 사용 (관리자는 보통 하나의 동아리만 관리)
            const myClub = clubsResult.data[0];
            console.log('My club:', myClub);

            setMyClubId(myClub.id);
            setMyClubName(myClub.name);
            setMyClubCode(myClub.club_code);

            // 2. 해당 동아리의 모든 멤버 조회
            const membersResult = await getClubMembers({ club_id: myClub.id });
            if (membersResult.success && membersResult.data) {
                setClubMembers(membersResult.data.items);
            } else {
                setMembersError(membersResult.error || '멤버 목록을 불러오는데 실패했습니다.');
            }
            setMembersLoading(false);

            // 3. 자산 목록 조회
            fetchAssets(myClub.id);
        };



        fetchClubData();
    }, []);



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
        setNewAssetLocation('');

        setAddAssetError(null);
        setShowAddAssetModal(true);
    };

    const handleAddAsset = async () => {
        if (!newAssetName.trim()) {
            setAddAssetError('물품 이름을 입력해주세요.');
            return;
        }

        const qty = Number(newAssetQuantity);
        if (!qty || qty < 1) {
            setAddAssetError('수량은 1개 이상이어야 합니다.');
            return;
        }

        if (!myClubId) {
            setAddAssetError('동아리 정보가 없습니다.');
            return;
        }

        setIsAddingAsset(true);
        setAddAssetError(null);

        const result = await addAsset({
            name: newAssetName.trim(),
            description: newAssetDescription.trim(),
            club_id: myClubId,
            quantity: qty,
            location: newAssetLocation.trim(),
        });

        setIsAddingAsset(false);

        if (result.success) {
            setShowAddAssetModal(false);
            // 물품 목록 새로고침
            fetchAssets(myClubId);
        } else {
            setAddAssetError(result.error || '물품 추가에 실패했습니다.');
        }
    };

    // 1. 모달 열기 핸들러
    const handleOpenExcelModal = () => {
        setSelectedExcelFile(null); // 이전 선택 초기화
        setShowExcelModal(true);
    };

    // 2. 파일 선택 시 유효성 검사 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.match(/\.(xlsx|xls)$/)) {
                alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
                e.target.value = '';
                return;
            }
            setSelectedExcelFile(file);
        }
    };

    // 3. 실제 업로드 실행 핸들러 (모달 내 '업로드' 버튼 클릭 시)
    const handleExcelUploadSubmit = async () => {
        if (!selectedExcelFile || myClubId === null) {
            alert('파일을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        // client.ts에 구현된 uploadExcelAssets 호출
        const result = await uploadExcelAssets(myClubId, selectedExcelFile);
        setIsUploading(false);

        if (result.success) {
            setShowExcelModal(false);
            fetchAssets(myClubId); // 목록 새로고침
        } else {
            alert(result.error || '업로드 중 오류가 발생했습니다.');
        }
    };

    // 자산 카드 클릭 핸들러
    const handleAssetClick = async (asset: Asset) => {
        if (expandedAssetId === asset.id) {
            // 이미 확장된 카드 클릭 시 닫기
            setExpandedAssetId(null);
            setEditingAsset(null);
            setAssetStats(null);
            setStatsError(null);
        } else {
            // 새 카드 확장
            setExpandedAssetId(asset.id);
            setEditingAsset({
                name: asset.name,
                description: asset.description,
                quantity: asset.total_quantity,
                location: asset.location,
            });

            // 통계 불러오기
            setStatsLoading(true);
            setStatsError(null);
            setAssetStats(null);
            const statsResult = await getAssetStatistics(asset.id);
            setStatsLoading(false);
            if (statsResult.success && statsResult.data) {
                setAssetStats(statsResult.data);
            } else {
                setStatsError(statsResult.error || '통계를 불러올 수 없습니다.');
            }
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
                {/* 동아리 정보 */}
                {myClubName && (
                    <div className="club-info-banner">
                        <div className="club-info-content">
                            <h2 className="club-name">{myClubName}</h2>
                            <div className="club-code-container">
                                <span className="club-code-label">동아리 코드:</span>
                                <span className="club-code-value">{myClubCode}</span>
                            </div>
                        </div>
                    </div>
                )}

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
                    {activeTab === 'assets' && (
                        <div className="asset-tab-buttons">
                            <button
                                className="member-approve-btn"
                                onClick={handleOpenExcelModal}
                            >
                                엑셀 업로드
                            </button>

                            <button
                                className="member-approve-btn"
                                onClick={handleOpenAddAssetModal}
                            >
                                물품 추가
                            </button>
                        </div>
                    )}
                    {error && <p className="error-message">{error}</p>}
                </div>

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
                                        <label htmlFor="asset-quantity">수량 *</label>
                                        <input
                                            id="asset-quantity"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={newAssetQuantity}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setNewAssetQuantity(val === '' ? 0 : parseInt(val));
                                            }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="asset-location">위치 *</label>
                                        <input
                                            id="asset-location"
                                            type="text"
                                            value={newAssetLocation}
                                            onChange={(e) => setNewAssetLocation(e.target.value)}
                                            placeholder="예: 동아리방 선반"
                                        />
                                    </div>
                                    {addAssetError && <p className="error-message">{addAssetError}</p>}
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
                )
                }
                {/* 엑셀 업로드 모달 */}
                {
                    showExcelModal && (
                        <div className="approval-modal-overlay" onClick={() => !isUploading && setShowExcelModal(false)}>
                            <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="approval-modal-header">
                                    <h3>엑셀로 물품 일괄 추가</h3>
                                    <button
                                        className="close-btn"
                                        onClick={() => setShowExcelModal(false)}
                                        disabled={isUploading}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="approval-modal-content">
                                    <div className="add-asset-form">
                                        <div className="form-group">
                                            <label>엑셀 파일 선택 (.xlsx, .xls)</label>
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls"
                                                onChange={handleFileChange}
                                                disabled={isUploading}
                                                style={{ padding: '10px 0' }}
                                            />
                                        </div>

                                        {selectedExcelFile && (
                                            <div style={{ marginBottom: '15px', fontSize: '14px', color: '#555' }}>
                                                <strong>선택됨:</strong> {selectedExcelFile.name}
                                            </div>
                                        )}

                                        <div className="form-actions">
                                            <button
                                                className="cancel-btn"
                                                onClick={() => setShowExcelModal(false)}
                                                disabled={isUploading}
                                            >
                                                취소
                                            </button>
                                            <button
                                                className="upload-btn"
                                                onClick={handleExcelUploadSubmit}
                                                disabled={isUploading || !selectedExcelFile}
                                            >
                                                {isUploading ? '업로드 중...' : '업로드 시작'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* 자산관리 탭 */}
                {
                    activeTab === 'assets' && (
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

                                            {/* 개별 물품 확장된 세부사항 */}
                                            {expandedAssetId === asset.id && editingAsset && (
                                                <div className="asset-detail-form" onClick={(e) => e.stopPropagation()}>
                                                    {/* 통계 섹션 */}
                                                    <div className="asset-stats-section">
                                                        <h4 className="stats-title">📊 대여 통계</h4>
                                                        {statsLoading ? (
                                                            <div className="stats-loading">통계 불러오는 중...</div>
                                                        ) : statsError ? (
                                                            <div className="stats-error">{statsError}</div>
                                                        ) : assetStats ? (
                                                            <div className="stats-grid">
                                                                <div className="stat-card">
                                                                    <span className="stat-value">{assetStats.total_rental_count}</span>
                                                                    <span className="stat-label">총 대여 횟수</span>
                                                                </div>
                                                                <div className="stat-card">
                                                                    <span className="stat-value">{assetStats.unique_borrower_count}</span>
                                                                    <span className="stat-label">이용자 수</span>
                                                                </div>
                                                                <div className="stat-card">
                                                                    <span className="stat-value">
                                                                        {assetStats.average_rental_duration > 0
                                                                            ? `${Math.round(assetStats.average_rental_duration)}일`
                                                                            : '-'}
                                                                    </span>
                                                                    <span className="stat-label">평균 대여 기간</span>
                                                                </div>
                                                                <div className="stat-card">
                                                                    <span className="stat-value">{assetStats.recent_rental_count}</span>
                                                                    <span className="stat-label">최근 대여</span>
                                                                </div>
                                                                {assetStats.last_borrowed_at && (
                                                                    <div className="stat-card full-width">
                                                                        <span className="stat-value">
                                                                            {new Date(assetStats.last_borrowed_at).toLocaleDateString('ko-KR')}
                                                                        </span>
                                                                        <span className="stat-label">마지막 대여일</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    {/* 수정 버튼 */}
                                                    <button
                                                        className="edit-asset-btn"
                                                        onClick={() => {
                                                            setEditingAsset({
                                                                name: asset.name,
                                                                description: asset.description,
                                                                quantity: asset.total_quantity,
                                                                location: asset.location,
                                                            });
                                                            setShowEditModal(true);
                                                        }}
                                                    >
                                                        ✏️ 물품 수정하기
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }

                {/* 물품 수정 모달 */}
                {showEditModal && editingAsset && (
                    <div className="approval-modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="approval-modal-header">
                                <h3>물품 수정</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="approval-modal-content">
                                <div className="add-asset-form">
                                    <div className="form-group">
                                        <label htmlFor="edit-name">물품 이름 *</label>
                                        <input
                                            id="edit-name"
                                            type="text"
                                            value={editingAsset.name}
                                            onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-description">설명</label>
                                        <textarea
                                            id="edit-description"
                                            value={editingAsset.description}
                                            onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-quantity">수량 *</label>
                                        <input
                                            id="edit-quantity"
                                            type="number"
                                            min={1}
                                            value={editingAsset.quantity}
                                            onChange={(e) => setEditingAsset({ ...editingAsset, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-location">위치</label>
                                        <input
                                            id="edit-location"
                                            type="text"
                                            value={editingAsset.location}
                                            onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })}
                                            placeholder="예: 동아리방 선반"
                                        />
                                    </div>
                                    {error && <p className="error-message">{error}</p>}
                                    <div className="form-actions">
                                        <button
                                            className="delete-asset-btn"
                                            onClick={() => expandedAssetId && handleDeleteAsset(expandedAssetId)}
                                            disabled={isUpdatingAsset}
                                        >
                                            삭제
                                        </button>
                                        <button
                                            className="approve-btn"
                                            onClick={async () => {
                                                await handleUpdateAsset();
                                                setShowEditModal(false);
                                            }}
                                            disabled={isUpdatingAsset}
                                        >
                                            {isUpdatingAsset ? '저장 중...' : '저장'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 멤버관리 탭 */}
                {
                    activeTab === 'members' && (
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
                                                <h3 className="member-name">사용자 {member.name}</h3>
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
                    )
                }
            </main >

        </div >
    );
}

