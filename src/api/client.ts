// Types
interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

interface SignupResponse {
    id: string;
    name: string;
    email: string;
}

interface ErrorResponse {
    detail: string;
}

export const checkBackendStatus = async (): Promise<{ status: string; ok: boolean }> => {
    try {
        const response = await fetch('/health');
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

export const signup = async (data: SignupRequest): Promise<{ success: boolean; data?: SignupResponse; error?: string }> => {
    try {
        const response = await fetch('/api/users/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.status === 201) {
            const result = await response.json();
            return { success: true, data: result };
        } else {
            const errorData: ErrorResponse = await response.json();
            return { success: false, error: errorData.detail || 'Signup failed' };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Network error occurred' };
    }
};
