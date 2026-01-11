import { useState } from 'react';
import { checkBackendStatus } from '@/api/client';
import { Header } from '@/components/Header';
import '@/styles/App.css';

export function MainPage() {
    const [status, setStatus] = useState<string>('');
    const [, forceUpdate] = useState({});

    const handleCheck = async () => {
        const result = await checkBackendStatus();
        setStatus(result.status);
    };

    return (
        <div className="container">
            <Header onLogout={() => forceUpdate({})} />

            <main className="main-content">
                <h1>Club Asset Management</h1>
                <div className="card">
                    <button onClick={handleCheck} className="primary-btn">
                        Check Backend Status
                    </button>
                    {status && (
                        <p className={`status ${status === 'Success' ? 'success' : 'error'}`}>
                            {status}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}
