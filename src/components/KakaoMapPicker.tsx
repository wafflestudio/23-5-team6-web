import { useEffect, useRef, useState } from 'react';

interface KakaoMapPickerProps {
    onLocationSelect?: (lat: number, lng: number) => void;
}

interface SelectedCoords {
    lat: number;
    lng: number;
    scaledLat: number;
    scaledLng: number;
}

export function KakaoMapPicker({ onLocationSelect }: KakaoMapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
    const markerRef = useRef<kakao.maps.Marker | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<SelectedCoords | null>(null);

    // Load Kakao Maps SDK
    useEffect(() => {
        const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;

        if (!kakaoKey || kakaoKey === 'YOUR_KEY_HERE') {
            console.warn('Kakao Map API key is not configured');
            return;
        }

        // Check if already loaded
        if (window.kakao && window.kakao.maps) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
        script.async = true;
        script.onload = () => {
            window.kakao.maps.load(() => {
                setIsLoaded(true);
            });
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script if needed
        };
    }, []);

    // Initialize map when opened
    useEffect(() => {
        if (!isMapOpen || !isLoaded || !mapRef.current) return;

        // Small delay to ensure container is rendered
        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            // Default center: Seoul National University
            const defaultCenter = new window.kakao.maps.LatLng(37.4598, 126.9526);

            const map = new window.kakao.maps.Map(mapRef.current, {
                center: defaultCenter,
                level: 3,
            });

            mapInstanceRef.current = map;

            // Create marker
            const marker = new window.kakao.maps.Marker({
                position: defaultCenter,
                map: map,
            });
            markerRef.current = marker;

            // Add click event to map
            window.kakao.maps.event.addListener(map, 'click', (mouseEvent: { latLng: kakao.maps.LatLng }) => {
                const latlng = mouseEvent.latLng;
                const lat = latlng.getLat();
                const lng = latlng.getLng();

                // Move marker
                marker.setPosition(latlng);

                // Update coordinates
                setSelectedCoords({
                    lat,
                    lng,
                    scaledLat: Math.round(lat * 1000000),
                    scaledLng: Math.round(lng * 1000000),
                });

                onLocationSelect?.(lat, lng);
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [isMapOpen, isLoaded, onLocationSelect]);

    const handleToggleMap = () => {
        setIsMapOpen(!isMapOpen);
        if (!isMapOpen) {
            setSelectedCoords(null);
        }
    };

    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    const isKeyConfigured = kakaoKey && kakaoKey !== 'YOUR_KEY_HERE';

    return (
        <div className="kakao-map-picker">
            <button
                onClick={handleToggleMap}
                className="primary-btn"
                disabled={!isKeyConfigured}
            >
                {!isKeyConfigured
                    ? '🗺️ API 키 설정 필요'
                    : isMapOpen
                        ? '🗺️ 지도 닫기'
                        : '🗺️ 지도에서 위치 선택'}
            </button>

            {!isKeyConfigured && (
                <p style={{ marginTop: '0.5rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                    .env 파일에 VITE_KAKAO_MAP_KEY를 설정해주세요
                </p>
            )}

            {isMapOpen && isLoaded && (
                <div style={{ marginTop: '1rem' }}>
                    <div
                        ref={mapRef}
                        style={{
                            width: '100%',
                            height: '300px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid var(--gray-200)',
                        }}
                    />
                    <p style={{ marginTop: '0.5rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                        지도를 클릭하여 위치를 선택하세요
                    </p>
                    {selectedCoords && (
                        <button
                            onClick={() => setIsMapOpen(false)}
                            className="primary-btn"
                            style={{ marginTop: '0.75rem', width: '100%' }}
                        >
                            ✓ 확인
                        </button>
                    )}
                </div>
            )}

            {isMapOpen && !isLoaded && (
                <div style={{ marginTop: '1rem', padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                    지도 로딩 중...
                </div>
            )}

            {selectedCoords && (
                <div
                    className="location-result"
                    style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--gray-50)',
                        borderRadius: '8px',
                        border: '1px solid var(--gray-200)',
                    }}
                >
                    <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                        원본 좌표
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--gray-700)' }}>
                        위도: {selectedCoords.lat.toFixed(6)}, 경도: {selectedCoords.lng.toFixed(6)}
                    </p>

                    <p style={{ margin: '1rem 0 0 0', color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                        × 1,000,000 (정수)
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.125rem' }}>
                        위도: {selectedCoords.scaledLat.toLocaleString()}, 경도: {selectedCoords.scaledLng.toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    );
}
