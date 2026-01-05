import { useState } from 'react';
import { checkBackendStatus } from '@/api/client';
import '@/styles/App.css';

export function TestPage() {
    const [status, setStatus] = useState<string>('');

    const handleCheck = async () => {
        const result = await checkBackendStatus();
        setStatus(result.status);
    };

    return (
        <div className="container">
            <h1>Backend Connection Test</h1>
            <div className="card">
                <button onClick={handleCheck}>
                    Check Backend Status
                </button>
                {status && (
                    <p className={`status ${status === 'Success' ? 'success' : 'error'}`}>
                        {status}
                    </p>
                )}
            </div>
        </div>
    );
}
