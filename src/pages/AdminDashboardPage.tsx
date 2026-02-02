import { useState, useEffect, useRef } from 'react';
import { getClubMembers, deleteClubMember, addAsset, getAssets, updateAsset, deleteAsset, getMyClubs, uploadExcelAssets, getAssetStatistics, getAssetPictures, addAssetPicture, setMainPicture, deleteAssetPicture, getPictureUrl, getSchedules, type ClubMember, type Asset, type AssetStatistics, type AssetPicture, type Schedule } from '@/api/client';
import '@/styles/App.css';
import '@/styles/AdminDashboard.css';
import * as XLSX from 'xlsx';

type TabType = 'assets' | 'rentals' | 'members';

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

    // 자산 사진 상태
    const [assetPictures, setAssetPictures] = useState<AssetPicture[]>([]);
    const [picturesLoading, setPicturesLoading] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const pictureInputRef = useRef<HTMLInputElement>(null);

    // 각 자산의 대표 사진 ID 저장 (assetId -> pictureId)
    const [assetMainPictures, setAssetMainPictures] = useState<Record<number, number | null>>({});

    // 동아리 멤버 상태
    const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [myClubId, setMyClubId] = useState<number | null>(null);
    const [myClubName, setMyClubName] = useState<string>('');
    const [myClubCode, setMyClubCode] = useState<string>('');

    // 대여 현황 상태
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [schedulesError, setSchedulesError] = useState<string | null>(null);
    const [scheduleFilter, setScheduleFilter] = useState<string>('all');

    // 자산 목록 가져오기 함수
    const fetchAssets = async (clubId: number) => {
        setAssetsLoading(true);
        setAssetsError(null);
        const result = await getAssets(clubId);
        if (result.success && result.data) {
            setAssets(result.data);

            // 각 자산의 대표 사진 조회 (개별 실패 시에도 나머지 결과 사용)
            const mainPictures: Record<number, number | null> = {};
            const pictureResults = await Promise.allSettled(result.data.map(async (asset) => {
                const picturesResult = await getAssetPictures(asset.id);
                return { assetId: asset.id, picturesResult };
            }));
            pictureResults.forEach((settledResult) => {
                if (settledResult.status === 'fulfilled') {
                    const { assetId, picturesResult } = settledResult.value;
                    if (picturesResult.success && picturesResult.data) {
                        const mainPic = picturesResult.data.find(p => p.is_main);
                        mainPictures[assetId] = mainPic ? mainPic.id : null;
                    } else {
                        mainPictures[assetId] = null;
                    }
                }
            });
            setAssetMainPictures(mainPictures);
        } else {
            setAssetsError(result.error || '자산 목록을 불러오는데 실패했습니다.');
        }
        setAssetsLoading(false);
    };

    // 대여 현황 가져오기 함수
    const fetchSchedules = async (clubId: number, status?: string) => {
        setSchedulesLoading(true);
        setSchedulesError(null);
        const params: { status?: string; size?: number } = { size: 100 };
        if (status && status !== 'all') {
            params.status = status;
        }
        const result = await getSchedules(clubId, params);
        if (result.success && result.data) {
            setSchedules(result.data.schedules);
        } else {
            setSchedulesError(result.error || '대여 현황을 불러오는데 실패했습니다.');
        }
        setSchedulesLoading(false);
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

            // 2. 멤버와 자산 목록을 병렬로 조회
            const [membersResult, assetsResult] = await Promise.allSettled([
                getClubMembers({ club_id: myClub.id }),
                getAssets(myClub.id),
            ]);

            // 멤버 결과 처리
            if (membersResult.status === 'fulfilled' && membersResult.value.success && membersResult.value.data) {
                setClubMembers(membersResult.value.data.items);
            } else if (membersResult.status === 'fulfilled') {
                setMembersError(membersResult.value.error || '멤버 목록을 불러오는데 실패했습니다.');
            } else {
                setMembersError('멤버 목록을 불러오는데 실패했습니다.');
            }
            setMembersLoading(false);

            // 자산 결과 처리
            if (assetsResult.status === 'fulfilled' && assetsResult.value.success && assetsResult.value.data) {
                setAssets(assetsResult.value.data);

                // 각 자산의 대표 사진 조회 (개별 실패 시에도 나머지 결과 사용)
                const mainPictures: Record<number, number | null> = {};
                const pictureResults = await Promise.allSettled(assetsResult.value.data.map(async (asset) => {
                    const picturesResult = await getAssetPictures(asset.id);
                    return { assetId: asset.id, picturesResult };
                }));
                pictureResults.forEach((settledResult) => {
                    if (settledResult.status === 'fulfilled') {
                        const { assetId, picturesResult } = settledResult.value;
                        if (picturesResult.success && picturesResult.data) {
                            const mainPic = picturesResult.data.find(p => p.is_main);
                            mainPictures[assetId] = mainPic ? mainPic.id : null;
                        } else {
                            mainPictures[assetId] = null;
                        }
                    }
                });
                setAssetMainPictures(mainPictures);
            } else if (assetsResult.status === 'fulfilled') {
                setAssetsError(assetsResult.value.error || '자산 목록을 불러오는데 실패했습니다.');
            } else {
                setAssetsError('자산 목록을 불러오는데 실패했습니다.');
            }
            setAssetsLoading(false);
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


    // 템플릿 다운로드: 사용자 친화적인 한글 헤더 제공
    const handleDownloadTemplate = () => {
        const headers = ['물품명', '설명', '수량', '위치', '등록일'];
        const exampleData = ['노트북', '맥북 프로 14인치', '3', '동아리방 선반', '2024-01-01'];

        const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        XLSX.writeFile(workbook, '물품_일괄등록_템플릿.xlsx');
    };

    // 1. 모달 열기 핸들러 (이게 없어서 에러가 났던 거예요!)
    const handleOpenExcelModal = () => {
        setSelectedExcelFile(null); // 이전 선택 초기화
        setShowExcelModal(true);
    };

    // 2. 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.match(/\.(xlsx)$/)) {
                alert('엑셀 파일(.xlsx)만 업로드 가능합니다.');
                e.target.value = '';
                return;
            }
            setSelectedExcelFile(file);
        }
    };

    // 엑셀 업로드: 한글 -> 영문 매핑 및 club_id 주입
    const handleExcelUploadSubmit = async () => {
        if (!selectedExcelFile || myClubId === null) {
            alert('파일을 선택하고 동아리 정보가 로딩될 때까지 기다려주세요.');
            return;
        }

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // 1. 엑셀 데이터를 JSON으로 변환
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    alert('파일에 등록할 데이터가 없습니다.');
                    setIsUploading(false);
                    return;
                }

                // 2. 한글 헤더를 백엔드가 기대하는 영문 헤더로 매핑
                const mappedData = jsonData.map((row: any) => {
                    const qty = Number(row['수량'] || row['quantity'] || 0);
                    return {
                        name: String(row['물품명'] || row['name'] || '').trim(),
                        description: String(row['설명'] || row['description'] || '').trim(),
                        quantity: qty,
                        location: String(row['위치'] || row['location'] || '').trim(),
                        total_quantity: qty,
                        available_quantity: qty,
                        club_id: myClubId, // 현재 관리 중인 동아리 ID 주입
                        created_at: row['등록일'] || row['created_at'] || new Date().toISOString()
                    };
                });

                // 3. 가공된 데이터로 서버용 새 엑셀 파일 생성
                const newSheet = XLSX.utils.json_to_sheet(mappedData);
                const newWorkbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Data');
                
                const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
                const processedFile = new File([excelBuffer], 'upload.xlsx', {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                // 4. API 호출 (수정된 uploadExcelAssets 사용)
                const result = await uploadExcelAssets(processedFile);
                
                if (result.success && result.data) {
                    const { imported, failed } = result.data;
                    alert(`${imported}개의 물품이 등록되었습니다.`);
                    if (failed.length > 0) console.error('실패 데이터:', failed);
                    setShowExcelModal(false);
                    fetchAssets(myClubId);
                } else {
                    alert(result.error || '업로드 중 오류가 발생했습니다.');
                }
            } catch (err) {
                console.error('Excel processing error:', err);
                alert('파일 처리 중 오류가 발생했습니다.');
            } finally {
                setIsUploading(false);
            }
        };

        reader.readAsArrayBuffer(selectedExcelFile);
    };

    const handleExportAssets = () => {
    if (assets.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }

        // 1. 데이터 가공: 사용자가 보기 좋은 한글 헤더로 매핑
        // Asset 타입의 필드들을 엑셀 열에 맞게 조정합니다.
        const exportData = assets.map(asset => ({
            '물품명': asset.name,
            '설명': asset.description || '',
            '현재수량': asset.available_quantity,
            '전체수량': asset.total_quantity,
            '위치': asset.location,
            '카테고리': asset.category_name || '미지정',
            '등록일': new Date(asset.created_at).toLocaleDateString('ko-KR')
        }));

        // 2. 워크시트 생성
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // 3. 워크북 생성 및 시트 추가
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '자산목록');

        // 4. 파일 다운로드
        const fileName = `동아리_자산목록_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
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

            // 사진 목록 불러오기
            setPicturesLoading(true);
            setAssetPictures([]);
            const picturesResult = await getAssetPictures(asset.id);
            setPicturesLoading(false);
            if (picturesResult.success && picturesResult.data) {
                setAssetPictures(picturesResult.data);
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

        if (!myClubId) {
            setError('동아리 정보가 없습니다.');
            return;
        }

        const result = await updateAsset(expandedAssetId, {
            club_id: myClubId,
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

    // 이미지 압축 함수 (Canvas API 사용)
    const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 리사이즈 비율 계산
                    let { width, height } = img;
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    // Canvas에 그리기
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    // Blob으로 변환 (JPEG 형식, 지정된 품질)
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Blob conversion failed'));
                                return;
                            }
                            // File 객체로 변환
                            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            console.log(`이미지 압축: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    };

    // 사진 업로드 핸들러
    const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !expandedAssetId) return;

        // 이미지 파일 검증
        if (!file.type.startsWith('image/')) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setUploadingPicture(true);

        try {
            // 이미지 압축 (500KB 이상인 경우에만)
            let uploadFile = file;
            if (file.size > 500 * 1024) {
                uploadFile = await compressImage(file);
            }

            const isMain = assetPictures.length === 0; // 첫 번째 사진은 자동으로 대표 설정
            const result = await addAssetPicture(expandedAssetId, uploadFile, isMain);

            if (result.success) {
                // 사진 목록 새로고침
                const picturesResult = await getAssetPictures(expandedAssetId);
                if (picturesResult.success && picturesResult.data) {
                    setAssetPictures(picturesResult.data);
                }
            } else {
                setError(result.error || '사진 업로드에 실패했습니다.');
            }
        } catch (err) {
            console.error('Image compression error:', err);
            setError('이미지 처리 중 오류가 발생했습니다.');
        }

        setUploadingPicture(false);

        // input 초기화
        if (pictureInputRef.current) {
            pictureInputRef.current.value = '';
        }
    };

    // 대표 사진 설정 핸들러
    const handleSetMainPicture = async (pictureId: number) => {
        if (!expandedAssetId) return;

        const result = await setMainPicture(expandedAssetId, pictureId);
        if (result.success) {
            // 사진 목록 새로고침
            const picturesResult = await getAssetPictures(expandedAssetId);
            if (picturesResult.success && picturesResult.data) {
                setAssetPictures(picturesResult.data);
            }
        } else {
            setError(result.error || '대표 사진 설정에 실패했습니다.');
        }
    };

    // 사진 삭제 핸들러
    const handleDeletePicture = async (pictureId: number) => {
        if (!expandedAssetId) return;
        if (!confirm('이 사진을 삭제하시겠습니까?')) return;

        const result = await deleteAssetPicture(expandedAssetId, pictureId);
        if (result.success) {
            setAssetPictures(prev => prev.filter(p => p.id !== pictureId));
        } else {
            setError(result.error || '사진 삭제에 실패했습니다.');
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
                        className={`admin-tab ${activeTab === 'rentals' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('rentals');
                            if (myClubId) fetchSchedules(myClubId, scheduleFilter);
                        }}
                    >
                        대여현황
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
                                        {/* 템플릿 다운로드 안내 */}
                                        <div style={{
                                            marginBottom: '1rem',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                        }}>
                                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                                                📋 엑셀/CSV 파일 형식: <strong>name, description, quantity, location, total_quantity, available_quantity, created_at</strong>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleDownloadTemplate}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'transparent',
                                                    border: '1px solid var(--primary-color)',
                                                    color: 'var(--primary-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ⬇️ 템플릿 다운로드
                                            </button>
                                        </div>

                                        <div className="form-group">
                                            <label>엑셀 파일 선택 (.xlsx)</label>
                                            <input
                                                type="file"
                                                accept=".xlsx"
                                                onChange={handleFileChange}
                                                disabled={isUploading}
                                                style={{ padding: '10px 0' }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                                        <button 
                                            type="button"
                                            className="member-approve-btn" 
                                            onClick={handleExportAssets}
                                            style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                                        >
                                            📤 현재 자산 목록 내보내기 (.xlsx)
                                        </button>
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
                                                    {assetMainPictures[asset.id] ? (
                                                        <img
                                                            src={getPictureUrl(assetMainPictures[asset.id]!)}
                                                            alt={asset.name}
                                                            className="asset-main-picture"
                                                        />
                                                    ) : (
                                                        <div className="asset-image-placeholder">📦</div>
                                                    )}
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

                                    {/* 사진 관리 섹션 */}
                                    <div className="picture-section">
                                        <h4 className="picture-section-title">📷 사진 관리</h4>

                                        {/* 사진 업로드 */}
                                        <div className="picture-upload-area">
                                            <input
                                                ref={pictureInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePictureUpload}
                                                disabled={uploadingPicture}
                                                style={{ display: 'none' }}
                                                id="picture-upload-input"
                                            />
                                            <button
                                                type="button"
                                                className="upload-picture-btn"
                                                onClick={() => pictureInputRef.current?.click()}
                                                disabled={uploadingPicture}
                                            >
                                                {uploadingPicture ? '업로드 중...' : '+ 사진 추가'}
                                            </button>
                                        </div>

                                        {/* 사진 그리드 */}
                                        {picturesLoading ? (
                                            <div className="pictures-loading">사진 불러오는 중...</div>
                                        ) : assetPictures.length === 0 ? (
                                            <div className="no-pictures">등록된 사진이 없습니다.</div>
                                        ) : (
                                            <div className="picture-grid">
                                                {assetPictures.map((picture) => (
                                                    <div key={picture.id} className={`picture-item ${picture.is_main ? 'is-main' : ''}`}>
                                                        <img
                                                            src={getPictureUrl(picture.id)}
                                                            alt="자산 사진"
                                                            className="picture-preview"
                                                        />
                                                        {picture.is_main && (
                                                            <span className="main-badge">대표</span>
                                                        )}
                                                        <div className="picture-actions">
                                                            {!picture.is_main && (
                                                                <button
                                                                    type="button"
                                                                    className="set-main-btn"
                                                                    onClick={() => handleSetMainPicture(picture.id)}
                                                                >
                                                                    대표로 설정
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="delete-picture-btn"
                                                                onClick={() => handleDeletePicture(picture.id)}
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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

                {/* 대여현황 탭 */}
                {activeTab === 'rentals' && (
                    <div className="admin-content">
                        {/* 상태 필터 */}
                        <div className="schedule-filter">
                            <button
                                className={`filter-btn ${scheduleFilter === 'all' ? 'active' : ''}`}
                                onClick={() => { setScheduleFilter('all'); if (myClubId) fetchSchedules(myClubId, 'all'); }}
                            >
                                전체
                            </button>
                            <button
                                className={`filter-btn ${scheduleFilter === 'inuse' ? 'active' : ''}`}
                                onClick={() => { setScheduleFilter('inuse'); if (myClubId) fetchSchedules(myClubId, 'inuse'); }}
                            >
                                대여중
                            </button>
                            <button
                                className={`filter-btn ${scheduleFilter === 'overdue' ? 'active' : ''}`}
                                onClick={() => { setScheduleFilter('overdue'); if (myClubId) fetchSchedules(myClubId, 'overdue'); }}
                            >
                                연체
                            </button>
                            <button
                                className={`filter-btn ${scheduleFilter === 'returned' ? 'active' : ''}`}
                                onClick={() => { setScheduleFilter('returned'); if (myClubId) fetchSchedules(myClubId, 'returned'); }}
                            >
                                반납완료
                            </button>
                        </div>

                        {schedulesLoading ? (
                            <div className="loading">대여 현황을 불러오는 중...</div>
                        ) : schedulesError ? (
                            <div className="error-message">{schedulesError}</div>
                        ) : schedules.length === 0 ? (
                            <div className="empty-state">
                                <p>대여 기록이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="schedule-list">
                                {schedules.map((schedule) => {
                                    const asset = assets.find(a => a.id === schedule.asset_id);
                                    const member = clubMembers.find(m => m.user_id === schedule.user_id);
                                    return (
                                        <div key={schedule.id} className={`schedule-card ${schedule.status}`}>
                                            <div className="schedule-info">
                                                <h3 className="schedule-asset">
                                                    {asset?.name || `자산 #${schedule.asset_id}`}
                                                </h3>
                                                <p className="schedule-user">
                                                    대여자: {member?.name || schedule.user_id}
                                                </p>
                                                <p className="schedule-date">
                                                    {new Date(schedule.start_date).toLocaleDateString('ko-KR')} ~ {new Date(schedule.end_date).toLocaleDateString('ko-KR')}
                                                </p>
                                            </div>
                                            <div className="schedule-status">
                                                <span className={`status-tag ${schedule.status === 'inuse' ? 'pending' : schedule.status === 'overdue' ? 'overdue' : 'approved'}`}>
                                                    {schedule.status === 'inuse' ? '대여중' : schedule.status === 'overdue' ? '연체' : '반납완료'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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

