import { useEffect, useRef, useState } from 'react';

interface KakaoMapPickerProps {
    initialLocation?: { lat: number; lng: number } | null;
    onLocationSelect?: (lat: number, lng: number) => void;
}

export function KakaoMapPicker({ initialLocation, onLocationSelect }: KakaoMapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
    const markerRef = useRef<kakao.maps.Marker | null>(null);
    const [isLoaded, setIsLoaded] = useState(() => {
        return !!(window.kakao && window.kakao.maps);
    });
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
        initialLocation || null
    );

    useEffect(() => {
        if (isLoaded) return;

        const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;

        if (!kakaoKey || kakaoKey === 'YOUR_KEY_HERE') {
            console.warn('Kakao Map API key is not configured');
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
    }, [isLoaded]);

    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;

        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            const center = initialLocation
                ? new window.kakao.maps.LatLng(initialLocation.lat, initialLocation.lng)
                : new window.kakao.maps.LatLng(37.4598, 126.9526);

            const map = new window.kakao.maps.Map(mapRef.current, {
                center: center,
                level: 3,
            });

            mapInstanceRef.current = map;

            const marker = new window.kakao.maps.Marker({
                position: center,
                map: map,
            });
            markerRef.current = marker;

            window.kakao.maps.event.addListener(map, 'click', (mouseEvent: { latLng: kakao.maps.LatLng }) => {
                const latlng = mouseEvent.latLng;
                const lat = latlng.getLat();
                const lng = latlng.getLng();

                marker.setPosition(latlng);
                setSelectedCoords({ lat, lng });
                onLocationSelect?.(lat, lng);
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [isLoaded, initialLocation, onLocationSelect]);

    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    const isKeyConfigured = kakaoKey && kakaoKey !== 'YOUR_KEY_HERE';

    if (!isKeyConfigured) {
        return (
            <div className="kakao-map-picker">
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                    .env 파일에 VITE_KAKAO_MAP_KEY를 설정해주세요
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="kakao-map-picker">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                    지도 로딩 중...
                </div>
            </div>
        );
    }

    return (
        <div className="kakao-map-picker">
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '250px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                }}
            />
            <p style={{ marginTop: '0.5rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                지도를 클릭하여 위치를 선택하세요
            </p>
            {selectedCoords && (
                <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--gray-600)'
                }}>
                    선택된 위치: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
                </div>
            )}
        </div>
    );
}
