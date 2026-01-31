import { useState, useEffect, useCallback } from 'react';
import { setToastListener, type ToastMessage } from '@/utils/toast';
import '@/styles/App.css';

let toastId = 0;
const MAX_TOAST_ID = 1000000;

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error') => {
        toastId = (toastId + 1) % MAX_TOAST_ID;
        const id = toastId;
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
