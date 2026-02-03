import { useState, useCallback, useRef, useEffect } from 'react';

interface UseFormOptions<T extends object> {
    initialValues: T;
    validate?: (values: T) => string | null;
}

interface UseFormReturn<T> {
    values: T;
    error: string;
    isLoading: boolean;
    setError: (error: string) => void;
    setLoading: (loading: boolean) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: (onSubmit: () => Promise<void>) => (e: React.FormEvent) => Promise<void>;
    resetForm: () => void;
    setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
}

export function useForm<T extends object>({
    initialValues,
    validate,
}: UseFormOptions<T>): UseFormReturn<T> {
    const [values, setValues] = useState<T>(initialValues);
    const [error, setError] = useState('');
    const [isLoading, setLoading] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(
        (onSubmit: () => Promise<void>) => async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');

            if (validate) {
                const validationError = validate(values);
                if (validationError) {
                    setError(validationError);
                    return;
                }
            }

            setLoading(true);
            try {
                await onSubmit();
            } catch (err) {
                if (isMounted.current) {
                    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
                    setError(message);
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        },
        [values, validate]
    );

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setError('');
        setLoading(false);
    }, [initialValues]);

    const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setValues(prev => ({ ...prev, [field]: value }));
    }, []);

    return {
        values,
        error,
        isLoading,
        setError,
        setLoading,
        handleChange,
        handleSubmit,
        resetForm,
        setFieldValue,
    };
}
