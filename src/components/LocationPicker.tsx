import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Fix Leaflet default icon issue
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

function LocationMarker({ onSelect, initialPos }: { onSelect: (lat: number, lng: number, address?: string) => void, initialPos: L.LatLngExpression | null }) {
    const [position, setPosition] = useState<L.LatLngExpression | null>(initialPos);

    const getAddress = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            return data.display_name;
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return undefined;
        }
    };

    const map = useMapEvents({
        async click(e) {
            setPosition(e.latlng);
            const address = await getAddress(e.latlng.lat, e.latlng.lng);
            onSelect(e.latlng.lat, e.latlng.lng, address);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (initialPos) {
            setPosition(initialPos);
            map.flyTo(initialPos as L.LatLng, 13);
        }
    }, [initialPos, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
    const { t } = useApp();
    // Default to Tashkent coordinates if none provided
    const defaultCenter: L.LatLngExpression = [41.2995, 69.2401];
    const initialPos = initialLat && initialLng ? [initialLat, initialLng] as L.LatLngExpression : null;

    return (
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-[var(--color-border)] relative z-0 shadow-inner">
            <MapContainer
                center={initialPos || defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker onSelect={onLocationSelect} initialPos={initialPos} />
            </MapContainer>

            <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[10px] text-[var(--text-primary)] font-black uppercase tracking-widest shadow-lg pointer-events-none">
                <div className="flex items-center gap-3">
                    <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    <span>{initialLat ? `${initialLat.toFixed(4)}, ${initialLng?.toFixed(4)}` : t('clickToSelectLocation')}</span>
                </div>
            </div>
        </div>
    );
}
