import { useState, useEffect, useRef } from 'react';
import { getApplyList, approveUser, showNotification } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ApplyListItem } from '@/api/client';
import '@/styles/App.css';

export function AdminFAB() {
    const { isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [applications, setApplications] = useState<ApplyListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [pendingCount, setPendingCount] = useState(0);
    const hasCheckedRef = useRef(false);

    // 관리자 로그인 시 초기 알림 확인
    useEffect(() => {
        if (!isAdmin || hasCheckedRef.current) return;

        const checkPendingApplications = async () => {
            const result = await getApplyList();
            if (result.success && result.data) {
                const count = result.data.length;
                setPendingCount(count);
                if (count > 0) {
                    showNotification(`승인 대기 중인 신청이 ${count}건 있습니다.`);
                }
            }
        };

        hasCheckedRef.current = true;
        checkPendingApplications();
    }, [isAdmin]);

    // 관리자가 아니면 렌더링하지 않음
    if (!isAdmin) {
        return null;
    }

    const fetchApplications = async () => {
        setLoading(true);
        setError('');
        const result = await getApplyList();
        if (result.success && result.data) {
            setApplications(result.data);
            setPendingCount(result.data.length);
        } else {
            setError(result.error || '목록을 불러올 수 없습니다.');
        }
        setLoading(false);
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchApplications();
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleApprove = async (userId: string, approved: boolean) => {
        const result = await approveUser(userId, approved);
        if (result.success) {
            // 목록에서 해당 사용자 제거
            setApplications(prev => {
                const newList = prev.filter(app => app.id !== userId);
                setPendingCount(newList.length);
                return newList;
            });
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button className="admin-fab" onClick={handleOpen} title="가입 신청 관리">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
                {pendingCount > 0 && (
                    <span className="fab-badge">{pendingCount}</span>
                )}
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="modal-overlay" onClick={handleClose}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>가입 신청 목록</h3>
                            <button className="modal-close" onClick={handleClose}>×</button>
                        </div>

                        <div className="modal-body">
                            {loading ? (
                                <div className="loading">불러오는 중...</div>
                            ) : error ? (
                                <p className="error-message">{error}</p>
                            ) : applications.length === 0 ? (
                                <p className="empty-message">대기 중인 신청이 없습니다.</p>
                            ) : (
                                <div className="apply-list">
                                    {applications.map(app => (
                                        <div key={app.id} className="apply-card">
                                            <div className="apply-info">
                                                <div className="apply-name">{app.name}</div>
                                                <div className="apply-details">
                                                    <span>{app.email}</span>
                                                    <span>학번: {app.student_id}</span>
                                                </div>
                                            </div>
                                            <div className="apply-actions">
                                                <button
                                                    className="approve-btn"
                                                    onClick={() => handleApprove(app.id, true)}
                                                >
                                                    승인
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => handleApprove(app.id, false)}
                                                >
                                                    거부
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
        </>
    );
}
