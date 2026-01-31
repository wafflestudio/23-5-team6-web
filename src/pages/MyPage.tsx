import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateClubCode, getMyAdminClub, getSchedules, getClubMembers, getAssets, getGoogleLinkStatus, unlinkGoogleAccount, updateClubLocation, getMyClubs, type Schedule, type ClubMember, type Asset } from '@/api/client';
import { buildGoogleOAuthURL } from '@/utils/pkce';
import { KakaoMapPicker } from '@/components/KakaoMapPicker';
import '@/styles/App.css';

// Google 연동 섹션 컴포넌트 (일반 사용자용)
function GoogleLinkSection() {
    const [isLinked, setIsLinked] = useState(false);
    const [googleEmail, setGoogleEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 연동 상태 확인
    useEffect(() => {
        const checkStatus = async () => {
            const result = await getGoogleLinkStatus();
            if (result.success && result.data) {
                setIsLinked(result.data.is_linked);
                setGoogleEmail(result.data.google_email);
            }
            setIsLoading(false);
        };
        checkStatus();
    }, []);

    // Google 연동 시작
    const handleLink = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const url = await buildGoogleOAuthURL('link');
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google 연동을 시작할 수 없습니다.');
            setIsProcessing(false);
        }
    };

    // 연동 해제
    const handleUnlink = async () => {
        if (!confirm('Google 연동을 해제하시겠습니까?\n해제 후에는 Google로 로그인할 수 없습니다.')) {
            return;
        }
        setIsProcessing(true);
        setError(null);
        const result = await unlinkGoogleAccount();
        if (result.success) {
            setIsLinked(false);
            setGoogleEmail(null);
        } else {
            setError(result.error || '연동 해제에 실패했습니다.');
        }
        setIsProcessing(false);
    };

    if (isLoading) {
        return (
            <div className="email-test-section">
                <h2>🔗 Google 계정 연동</h2>
                <p className="section-description">로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="email-test-section">
            <h2>🔗 Google 계정 연동</h2>
            <p className="section-description">
                Google 계정을 연동하면 Google로 빠르게 로그인할 수 있습니다.
            </p>

            <div className="email-form">
                {isLinked ? (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>✅</span>
                            <div>
                                <strong>연동됨</strong>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                    {googleEmail}
                                </div>
                            </div>
                        </div>
                        <button
                            className="send-email-btn"
                            onClick={handleUnlink}
                            disabled={isProcessing}
                            style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                        >
                            {isProcessing ? '처리 중...' : '연동 해제'}
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>🔗</span>
                            <div>
                                <strong>연동되지 않음</strong>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                    Google 계정을 연동하여 간편 로그인을 사용하세요.
                                </div>
                            </div>
                        </div>
                        <button
                            className="send-email-btn"
                            onClick={handleLink}
                            disabled={isProcessing}
                            style={{
                                background: '#ffffff',
                                border: '1px solid #dadce0',
                                color: '#3c4043',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                fontWeight: 500
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {isProcessing ? '처리 중...' : 'Google 계정 연동하기'}
                        </button>
                    </>
                )}

                {error && (
                    <div className="send-result error" style={{ marginTop: '0.75rem' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export function MyPage() {
    const { userName, isAdmin } = useAuth();

    // 클럽 정보 상태
    // const [clubId, setClubId] = useState<number | null>(null);
    const [clubName, setClubName] = useState('');
    const [currentClubCode, setCurrentClubCode] = useState('');
    const [newClubCode, setNewClubCode] = useState('');
    const [isUpdatingCode, setIsUpdatingCode] = useState(false);
    const [codeUpdateResult, setCodeUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

    // 이메일 테스트 폼 상태
    const [recipientEmail, setRecipientEmail] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

    // 연체자 목록 상태
    const [clubId, setClubId] = useState<number | null>(null);
    const [overdueSchedules, setOverdueSchedules] = useState<Schedule[]>([]);
    const [overdueMembers, setOverdueMembers] = useState<ClubMember[]>([]);
    const [overdueAssets, setOverdueAssets] = useState<Asset[]>([]);
    const [selectedOverdue, setSelectedOverdue] = useState<Set<number>>(new Set());
    const [overdueLoading, setOverdueLoading] = useState(false);

    // 동아리 위치 상태
    const [clubLocation, setClubLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
    const [locationUpdateResult, setLocationUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

    // 관리자 클럽 정보 로드
    useEffect(() => {
        if (isAdmin) {
            const fetchClubInfo = async () => {
                const result = await getMyAdminClub();
                if (result.success && result.data) {
                    setClubId(result.data.club_id);
                    setClubName(result.data.club_name);
                    setCurrentClubCode(result.data.club_code);
                }

                // 위치 정보 로드
                const clubsResult = await getMyClubs();
                if (clubsResult.success && clubsResult.data && clubsResult.data.length > 0) {
                    const myClub = clubsResult.data[0];
                    if (myClub.location_lat && myClub.location_lng) {
                        setClubLocation({
                            lat: myClub.location_lat / 1000000,
                            lng: myClub.location_lng / 1000000,
                        });
                    }
                }
            };
            fetchClubInfo();
        }
    }, [isAdmin]);

    // 위치 저장 핸들러
    const handleSaveLocation = async () => {
        if (!clubId || !pendingLocation) return;

        setIsUpdatingLocation(true);
        setLocationUpdateResult(null);

        const scaledLat = Math.round(pendingLocation.lat * 1000000);
        const scaledLng = Math.round(pendingLocation.lng * 1000000);

        const result = await updateClubLocation(clubId, scaledLat, scaledLng);

        if (result.success) {
            setClubLocation(pendingLocation);
            setPendingLocation(null);
            setLocationUpdateResult({ success: true, message: '위치가 저장되었습니다.' });
        } else {
            setLocationUpdateResult({ success: false, message: result.error || '위치 저장에 실패했습니다.' });
        }

        setIsUpdatingLocation(false);
    };

    // 연체자 목록 로드
    useEffect(() => {
        if (isAdmin && clubId) {
            const fetchOverdueData = async () => {
                setOverdueLoading(true);
                // 연체 대여 목록
                const schedResult = await getSchedules(clubId, { status: 'overdue', size: 100 });
                if (schedResult.success && schedResult.data) {
                    setOverdueSchedules(schedResult.data.schedules);
                }
                // 멤버 목록
                const membersResult = await getClubMembers({ club_id: clubId, size: 100 });
                if (membersResult.success && membersResult.data) {
                    setOverdueMembers(membersResult.data.items);
                }
                // 자산 목록
                const assetsResult = await getAssets(clubId);
                if (assetsResult.success && assetsResult.data) {
                    setOverdueAssets(assetsResult.data);
                }
                setOverdueLoading(false);
            };
            fetchOverdueData();
        }
    }, [isAdmin, clubId]);

    // 클럽 코드 수정 핸들러
    const handleUpdateClubCode = async () => {
        setIsUpdatingCode(true);
        setCodeUpdateResult(null);

        const result = await updateClubCode(newClubCode.trim());

        if (result.success && result.data) {
            setCurrentClubCode(result.data.club_code);
            setNewClubCode('');
            setCodeUpdateResult({ success: true, message: `클럽 코드가 "${result.data.club_code}"로 변경되었습니다.` });
        } else {
            setCodeUpdateResult({ success: false, message: result.error || '클럽 코드 수정에 실패했습니다.' });
        }

        setIsUpdatingCode(false);
    };

    // 무작위 재발급 핸들러
    const handleRegenerateCode = async () => {
        setIsUpdatingCode(true);
        setCodeUpdateResult(null);

        const result = await updateClubCode(''); // 빈 문자열 = 무작위 재발급

        if (result.success && result.data) {
            setCurrentClubCode(result.data.club_code);
            setCodeUpdateResult({ success: true, message: `새 클럽 코드가 발급되었습니다: ${result.data.club_code}` });
        } else {
            setCodeUpdateResult({ success: false, message: result.error || '재발급에 실패했습니다.' });
        }

        setIsUpdatingCode(false);
    };

    const handleSendEmail = async () => {
        if (!recipientEmail.trim()) {
            setSendResult({ success: false, message: '받는 사람 이메일을 입력해주세요.' });
            return;
        }
        if (!emailSubject.trim()) {
            setSendResult({ success: false, message: '제목을 입력해주세요.' });
            return;
        }
        if (!emailMessage.trim()) {
            setSendResult({ success: false, message: '내용을 입력해주세요.' });
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
            console.log('[DEBUG] Email API URL:', emailApiUrl);
            console.log('[DEBUG] Request body:', {
                recipients: [recipientEmail.trim()],
                subject: emailSubject.trim(),
                message: emailMessage.trim(),
            });

            const response = await fetch(emailApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipients: [recipientEmail.trim()],
                    subject: emailSubject.trim(),
                    message: emailMessage.trim(),
                }),
            });

            const responseText = await response.text();
            console.log('[DEBUG] Response status:', response.status);
            console.log('[DEBUG] Response body:', responseText);

            let data: { successCount?: number; failedCount?: number; errors?: Array<{ email: string; error: string }>; message?: string } = {};
            try {
                data = JSON.parse(responseText);
            } catch {
                // JSON 파싱 실패 시 빈 객체 유지
            }

            if (response.ok) {
                if (data.successCount && data.successCount > 0) {
                    setSendResult({
                        success: true,
                        message: `✅ 전송 성공! (${data.successCount}건)\n\n[응답]\n${JSON.stringify(data, null, 2)}`
                    });
                    setRecipientEmail('');
                    setEmailSubject('');
                    setEmailMessage('');
                } else if (data.errors && data.errors.length > 0) {
                    const errorDetails = data.errors.map((e) =>
                        `• ${e.email}: ${e.error}`
                    ).join('\n');
                    setSendResult({
                        success: false,
                        message: `❌ 전송 실패\n\n[에러 상세]\n${errorDetails}\n\n[전체 응답]\n${JSON.stringify(data, null, 2)}`
                    });
                } else {
                    setSendResult({
                        success: true,
                        message: `✅ 전송 성공!\n\n[응답]\n${responseText}`
                    });
                    setRecipientEmail('');
                    setEmailSubject('');
                    setEmailMessage('');
                }
            } else {
                setSendResult({
                    success: false,
                    message: `❌ HTTP ${response.status} ${response.statusText}\n\n[응답 본문]\n${responseText}`
                });
            }
        } catch (error) {
            console.error('Email send error:', error);
            const errorMessage = error instanceof Error
                ? `${error.name}: ${error.message}\n\n[Stack]\n${error.stack}`
                : String(error);
            setSendResult({
                success: false,
                message: `❌ 네트워크/런타임 오류\n\n${errorMessage}`
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="container">
            <main className="main-content">
                <div className="mypage-header">
                    <h1>{userName}님의 마이페이지</h1>
                    {isAdmin && clubName && (
                        <p className="section-description">관리 중인 동아리: {clubName}</p>
                    )}
                </div>

                {/* 관리자 전용: 클럽 코드 관리 섹션 */}
                {isAdmin && (
                    <div className="email-test-section" style={{ marginBottom: '1.5rem' }}>
                        <h2>🔑 클럽 코드 관리</h2>
                        <p className="section-description">
                            현재 코드: <strong>{currentClubCode || '로딩 중...'}</strong>
                        </p>

                        <div className="email-form">
                            <div className="form-group">
                                <label htmlFor="new-club-code">새 클럽 코드 (직접 지정)</label>
                                <input
                                    id="new-club-code"
                                    type="text"
                                    value={newClubCode}
                                    onChange={(e) => setNewClubCode(e.target.value)}
                                    placeholder="새 클럽 코드 입력"
                                />
                            </div>

                            {codeUpdateResult && (
                                <div className={`send-result ${codeUpdateResult.success ? 'success' : 'error'}`}>
                                    {codeUpdateResult.message}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="send-email-btn"
                                    onClick={handleUpdateClubCode}
                                    disabled={isUpdatingCode || !newClubCode.trim()}
                                    style={{ flex: 1 }}
                                >
                                    {isUpdatingCode ? '변경 중...' : '코드 변경'}
                                </button>
                                <button
                                    className="send-email-btn"
                                    onClick={handleRegenerateCode}
                                    disabled={isUpdatingCode}
                                    style={{ flex: 1, background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                                >
                                    {isUpdatingCode ? '발급 중...' : '무작위 재발급'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 관리자 전용: 동아리 위치 설정 */}
                {isAdmin && (
                    <div className="email-test-section" style={{ marginBottom: '1.5rem' }}>
                        <h2>
                            <span
                                onClick={() => setLocationUpdateResult({ success: true, message: '알고계신가요? 카카오맵은 하루에 30만번까지 무료랍니다' })}
                                style={{ cursor: 'default' }}
                            >📍</span> 동아리 위치 설정
                        </h2>
                        <p className="section-description">
                            {clubLocation
                                ? `현재 위치: ${clubLocation.lat.toFixed(5)}, ${clubLocation.lng.toFixed(5)}`
                                : '위치가 설정되지 않았습니다. 지도에서 위치를 선택해주세요.'
                            }
                        </p>

                        <div style={{ marginTop: '1rem' }}>
                            <KakaoMapPicker
                                initialLocation={clubLocation}
                                onLocationSelect={(lat, lng) => setPendingLocation({ lat, lng })}
                            />

                            {locationUpdateResult && (
                                <div
                                    className={`send-result ${locationUpdateResult.success ? 'success' : 'error'}`}
                                    style={{ marginTop: '0.75rem' }}
                                >
                                    {locationUpdateResult.message}
                                </div>
                            )}

                            {pendingLocation && (
                                <button
                                    className="send-email-btn"
                                    onClick={handleSaveLocation}
                                    disabled={isUpdatingLocation}
                                    style={{ marginTop: '0.75rem', width: '100%' }}
                                >
                                    {isUpdatingLocation ? '저장 중...' : '위치 저장'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 관리자 전용: 연체자 목록 및 단체 메일 */}
                {isAdmin && (
                    <div className="email-test-section" style={{ marginBottom: '1.5rem' }}>
                        <h2>⚠️ 연체자 관리</h2>
                        <p className="section-description">
                            연체 중인 대여 목록입니다. 선택 후 단체 메일을 발송할 수 있습니다.
                        </p>

                        {overdueLoading ? (
                            <div className="loading">연체 목록 불러오는 중...</div>
                        ) : overdueSchedules.length === 0 ? (
                            <div className="empty-message" style={{ padding: '1rem', color: 'var(--gray-500)' }}>
                                🎉 연체 중인 대여가 없습니다!
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedOverdue.size === overdueSchedules.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedOverdue(new Set(overdueSchedules.map(s => s.id)));
                                                } else {
                                                    setSelectedOverdue(new Set());
                                                }
                                            }}
                                        />
                                        <strong>전체 선택 ({selectedOverdue.size}/{overdueSchedules.length})</strong>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {overdueSchedules.map((schedule) => {
                                        const member = overdueMembers.find(m => m.user_id === schedule.user_id);
                                        const asset = overdueAssets.find(a => a.id === schedule.asset_id);
                                        return (
                                            <label
                                                key={schedule.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    background: selectedOverdue.has(schedule.id) ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass-bg)',
                                                    border: `1px solid ${selectedOverdue.has(schedule.id) ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)'}`,
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOverdue.has(schedule.id)}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedOverdue);
                                                        if (e.target.checked) {
                                                            newSet.add(schedule.id);
                                                        } else {
                                                            newSet.delete(schedule.id);
                                                        }
                                                        setSelectedOverdue(newSet);
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <strong>{asset?.name || `자산 #${schedule.asset_id}`}</strong>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                                        대여자: {member?.name || schedule.user_id}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                                                        반납예정: {new Date(schedule.end_date).toLocaleDateString('ko-KR')}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                <button
                                    className="send-email-btn"
                                    style={{ background: selectedOverdue.size > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined }}
                                    disabled={selectedOverdue.size === 0 || isSending}
                                    onClick={async () => {
                                        // 선택된 연체자들의 이메일 수집
                                        const selectedSchedules = overdueSchedules.filter(s => selectedOverdue.has(s.id));
                                        const emails = selectedSchedules.map(s => {
                                            const member = overdueMembers.find(m => m.user_id === s.user_id);
                                            return member?.email || '';
                                        }).filter(email => email !== '');

                                        if (emails.length === 0) {
                                            setSendResult({ success: false, message: '선택된 연체자가 없습니다.' });
                                            return;
                                        }

                                        setIsSending(true);
                                        setSendResult(null);

                                        try {
                                            const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
                                            const response = await fetch(emailApiUrl, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    recipients: emails,
                                                    subject: `[${clubName}] 물품 반납 요청`,
                                                    message: `안녕하세요,\n\n대여하신 물품의 반납 예정일이 지났습니다.\n빠른 시일 내에 반납해 주시기 바랍니다.\n\n감사합니다.`,
                                                }),
                                            });

                                            if (response.ok) {
                                                setSendResult({ success: true, message: `✅ ${emails.length}명에게 메일을 발송했습니다.` });
                                                setSelectedOverdue(new Set());
                                            } else {
                                                setSendResult({ success: false, message: `❌ 발송 실패: ${response.status}` });
                                            }
                                        } catch {
                                            setSendResult({ success: false, message: '❌ 네트워크 오류' });
                                        } finally {
                                            setIsSending(false);
                                        }
                                    }}
                                >
                                    {isSending ? '발송 중...' : `📧 선택한 ${selectedOverdue.size}명에게 연체 안내 메일 발송`}
                                </button>

                                {sendResult && (
                                    <div className={`send-result ${sendResult.success ? 'success' : 'error'}`} style={{ marginTop: '0.75rem' }}>
                                        {sendResult.message}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* 관리자 전용: 이메일 테스트 섹션 */}
                {isAdmin && (
                    <div className="email-test-section">
                        <h2>📧 이메일 전송 테스트</h2>
                        <p className="section-description">Lambda 이메일 전송 기능을 테스트할 수 있습니다.</p>

                        <div className="email-form">
                            <div className="form-group">
                                <label htmlFor="recipient-email">받는 사람 이메일</label>
                                <input
                                    id="recipient-email"
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="example@email.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email-subject">제목</label>
                                <input
                                    id="email-subject"
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="[OO동아리] 물품 대여 확인 안내"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email-message">내용</label>
                                <textarea
                                    id="email-message"
                                    value={emailMessage}
                                    onChange={(e) => setEmailMessage(e.target.value)}
                                    placeholder="안녕하세요, 신청하신 물품의 대여가 승인되었습니다."
                                    rows={5}
                                />
                            </div>

                            {sendResult && (
                                <div className={`send-result ${sendResult.success ? 'success' : 'error'}`}>
                                    {sendResult.message}
                                </div>
                            )}

                            <button
                                className="send-email-btn"
                                onClick={handleSendEmail}
                                disabled={isSending}
                            >
                                {isSending ? '전송 중...' : '이메일 전송'}
                            </button>
                        </div>
                    </div>
                )}

                {!isAdmin && (
                    <GoogleLinkSection />
                )}
            </main>
        </div>
    );
}
