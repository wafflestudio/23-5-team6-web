// Toast 알림 타입 정의
export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

// 글로벌 토스트 이벤트 리스너 타입
export type ToastListener = (message: string, type: 'success' | 'error') => void;

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
