// Kakao Maps SDK type declarations
declare namespace kakao {
    namespace maps {
        class Map {
            constructor(container: HTMLElement, options: MapOptions);
            getCenter(): LatLng;
            setCenter(latlng: LatLng): void;
            getLevel(): number;
            setLevel(level: number): void;
        }

        class LatLng {
            constructor(lat: number, lng: number);
            getLat(): number;
            getLng(): number;
        }

        class Marker {
            constructor(options: MarkerOptions);
            setMap(map: Map | null): void;
            setPosition(position: LatLng): void;
            getPosition(): LatLng;
        }

        interface MapOptions {
            center: LatLng;
            level?: number;
        }

        interface MarkerOptions {
            position: LatLng;
            map?: Map;
        }

        function load(callback: () => void): void;

        namespace event {
            function addListener(
                target: Map | Marker,
                type: string,
                callback: (mouseEvent: { latLng: LatLng }) => void
            ): void;
        }
    }
}

interface Window {
    kakao: typeof kakao;
}
