import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Legacy route - redirect to dashboard
export function ClubListPage() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/', { replace: true });
    }, [navigate]);

    return null;
}

