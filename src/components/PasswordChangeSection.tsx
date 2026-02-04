import { useState } from 'react';
import { changePassword } from '@/api/client';

export function PasswordChangeSection() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // 비밀번호 일치 여부
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
    const passwordsNotMatch = newPassword && confirmPassword && newPassword !== confirmPassword;

    const handleChangePassword = async () => {
        if (!currentPassword) {
            setResult({ success: false, message: '현재 비밀번호를 입력해주세요.' });
            return;
        }
        if (!newPassword) {
            setResult({ success: false, message: '새 비밀번호를 입력해주세요.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setResult({ success: false, message: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }
        if (newPassword.length < 6) {
            setResult({ success: false, message: '비밀번호는 6자 이상이어야 합니다.' });
            return;
        }

        if (!confirm('비밀번호를 변경하시겠습니까?')) {
            return;
        }

        setIsChanging(true);
        setResult(null);

        try {
            const apiResult = await changePassword(currentPassword, newPassword);
            if (apiResult.success) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setResult({ success: true, message: '비밀번호가 변경되었습니다.' });
            } else {
                setResult({ success: false, message: apiResult.error || '비밀번호 변경에 실패했습니다.' });
            }
        } catch (error) {
            setResult({ success: false, message: '알 수 없는 오류가 발생했습니다.' });
        }

        setIsChanging(false);
    };

    return (
        <div className="email-test-section" style={{ marginBottom: '1.5rem' }}>
            <h2>🔒 비밀번호 변경</h2>
            <p className="section-description">현재 비밀번호와 새 비밀번호를 입력해주세요.</p>

            <div className="email-form">
                <div className="form-group">
                    <label htmlFor="current-password">현재 비밀번호</label>
                    <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="현재 비밀번호"
                        autoComplete="current-password"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="new-password">새 비밀번호</label>
                    <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="새 비밀번호 (6자 이상)"
                        autoComplete="new-password"
                        style={{
                            borderColor: passwordsMatch ? '#10b981' : passwordsNotMatch ? '#ef4444' : undefined,
                            borderWidth: (passwordsMatch || passwordsNotMatch) ? '2px' : undefined
                        }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirm-password">새 비밀번호 확인</label>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="새 비밀번호 확인"
                        autoComplete="new-password"
                        style={{
                            borderColor: passwordsMatch ? '#10b981' : passwordsNotMatch ? '#ef4444' : undefined,
                            borderWidth: (passwordsMatch || passwordsNotMatch) ? '2px' : undefined
                        }}
                    />
                </div>

                {result && (
                    <div className={`send-result ${result.success ? 'success' : 'error'}`}>
                        {result.message}
                    </div>
                )}

                <button
                    className="send-email-btn"
                    onClick={handleChangePassword}
                    disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
                >
                    {isChanging ? '변경 중...' : '비밀번호 변경'}
                </button>
            </div>
        </div>
    );
}
