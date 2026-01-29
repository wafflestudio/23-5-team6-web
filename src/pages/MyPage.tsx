import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateClubCode, getMyAdminClub, getSchedules, getClubMembers, getAssets, type Schedule, type ClubMember, type Asset } from '@/api/client';
import '@/styles/App.css';

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
            };
            fetchClubInfo();
        }
    }, [isAdmin]);

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
                                        // 선택된 연체자들의 이메일 수집 (실제로는 member에 email 필드가 있어야 함)
                                        const selectedSchedules = overdueSchedules.filter(s => selectedOverdue.has(s.id));
                                        const emails = selectedSchedules.map(s => {
                                            const member = overdueMembers.find(m => m.user_id === s.user_id);
                                            return member?.name ? `${member.name}@example.com` : `${s.user_id}@example.com`;
                                        });

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
                    <div className="mypage-content">
                        <p>일반 사용자 마이페이지입니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
