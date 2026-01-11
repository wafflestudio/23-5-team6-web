import { useState, useEffect, useCallback } from 'react';
import '@/styles/App.css';

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

// 글로벌 토스트 이벤트
type ToastListener = (message: string, type: 'success' | 'error') => void;
let toastListener: ToastListener | null = null;

export function setToastListener(listener: ToastListener | null) {
    toastListener = listener;
}

// client.ts 등에서 호출할 함수
export function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastListener) {
        toastListener(message, type);
    } else {
        // Fallback: 리스너가 없으면 콘솔에만 출력
        console.log(`[Toast ${type}]: ${message}`);
    }
}

let toastId = 0;

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);

        // 3초 후 제거
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    useEffect(() => {
        setToastListener(addToast);
        return () => setToastListener(null);
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
