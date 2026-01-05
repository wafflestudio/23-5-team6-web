const BASE_URL = import.meta.env.PROD ? 'http://3.34.178.145:8000' : '/api';

export const checkBackendStatus = async (): Promise<{ status: string; ok: boolean }> => {
    try {
        const response = await fetch(`${BASE_URL}/test`);
        if (response.status === 200) {
            return { status: 'Success', ok: true };
        } else {
            return { status: `Error: ${response.status}`, ok: false };
        }
    } catch (error) {
        console.error('Connection failed:', error);
        return { status: 'Connection Failed', ok: false };
    }
};
