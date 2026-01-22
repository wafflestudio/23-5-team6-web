import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateClubCode, getMyAdminClub } from '@/api/client';
import '@/styles/App.css';

export function MyPage() {
    const { userName, isAdmin } = useAuth();

    // 클럽 정보 상태
    const [clubId, setClubId] = useState<number | null>(null);
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
