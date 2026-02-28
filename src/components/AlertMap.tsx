'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useAlert } from '@/context/AlertContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon path in Next.js
// @ts-expect-error: Leaflet internal
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Approximate bounding boxes for major cities used in alert highlighting
// Format: [minLng, minLat, maxLng, maxLat]
const CITY_BOUNDS: Record<string, [[number, number], [number, number], [number, number], [number, number], [number, number]]> = {
    'תל אביב - מרכז': [[34.74, 32.03], [34.82, 32.03], [34.82, 32.10], [34.74, 32.10], [34.74, 32.03]],
    'תל אביב - מזרח': [[34.82, 32.03], [34.89, 32.03], [34.89, 32.10], [34.82, 32.10], [34.82, 32.03]],
    'תל אביב - דרום': [[34.74, 31.97], [34.82, 31.97], [34.82, 32.03], [34.74, 32.03], [34.74, 31.97]],
    'תל אביב - צפון': [[34.74, 32.10], [34.82, 32.10], [34.82, 32.17], [34.74, 32.17], [34.74, 32.10]],
    'ירושלים': [[35.18, 31.74], [35.26, 31.74], [35.26, 31.81], [35.18, 31.81], [35.18, 31.74]],
    'חיפה - כרמל ועיר תחתית': [[34.97, 32.79], [35.05, 32.79], [35.05, 32.86], [34.97, 32.86], [34.97, 32.79]],
    'חיפה - קריות': [[35.05, 32.82], [35.12, 32.82], [35.12, 32.87], [35.05, 32.87], [35.05, 32.82]],
    'באר שבע': [[34.78, 31.22], [34.86, 31.22], [34.86, 31.28], [34.78, 31.28], [34.78, 31.22]],
    'אשדוד': [[34.63, 31.79], [34.70, 31.79], [34.70, 31.84], [34.63, 31.84], [34.63, 31.79]],
    'אשקלון': [[34.55, 31.64], [34.62, 31.64], [34.62, 31.69], [34.55, 31.69], [34.55, 31.64]],
    'נתניה': [[34.83, 32.28], [34.89, 32.28], [34.89, 32.33], [34.83, 32.33], [34.83, 32.28]],
    'שדרות': [[34.59, 31.50], [34.65, 31.50], [34.65, 31.54], [34.59, 31.54], [34.59, 31.50]],
    'נתיבות': [[34.57, 31.41], [34.63, 31.41], [34.63, 31.45], [34.57, 31.45], [34.57, 31.41]],
    'קריית שמונה': [[35.56, 33.18], [35.62, 33.18], [35.62, 33.23], [35.56, 33.23], [35.56, 33.18]],
    'עין גדי': [[35.36, 31.45], [35.40, 31.45], [35.40, 31.49], [35.36, 31.49], [35.36, 31.45]],
};

function buildGeoJson(cities: string[]) {
    const features = cities
        .filter(c => CITY_BOUNDS[c])
        .map(city => ({
            type: 'Feature' as const,
            properties: { name: city },
            geometry: {
                type: 'Polygon' as const,
                coordinates: [CITY_BOUNDS[city].map(([lng, lat]) => [lng, lat])],
            },
        }));
    return { type: 'FeatureCollection' as const, features };
}

function AlertLayer() {
    const { currentAlert, isAlarming } = useAlert();
    const map = useMap();
    const layerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }

        if (isAlarming && currentAlert && currentAlert.cities.length > 0) {
            const geoJson = buildGeoJson(currentAlert.cities);
            if (geoJson.features.length > 0) {
                layerRef.current = L.geoJSON(geoJson, {
                    style: {
                        color: '#ef4444',
                        fillColor: '#ef4444',
                        fillOpacity: 0.35,
                        weight: 2,
                        dashArray: '4 4',
                    },
                }).addTo(map);

                // Fit map to highlighted areas
                layerRef.current.getBounds && map.fitBounds(layerRef.current.getBounds(), { padding: [40, 40] });
            }
        } else if (!isAlarming) {
            // Reset to Israel default
            map.setView([31.5, 35.0], 7);
        }
    }, [currentAlert, isAlarming, map]);

    return null;
}

export default function AlertMap() {
    const { isAlarming, severity } = useAlert();

    return (
        <div className={`relative w-full h-full transition-all duration-700 ${isAlarming && severity === 'critical' ? 'ring-2 ring-red-500/50' : ''
            }`}>
            <MapContainer
                center={[31.5, 35.0]}
                zoom={7}
                className="w-full h-full"
                zoomControl={true}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={19}
                />
                <AlertLayer />
            </MapContainer>

            {/* Map overlay: critical alarm flash effect */}
            {isAlarming && severity === 'critical' && (
                <div className="absolute inset-0 pointer-events-none rounded-none animate-alarm-ring z-[400]" />
            )}

            {/* Attribution */}
            <div className="absolute bottom-2 right-2 z-[400] text-[10px] text-white/30">
                © CartoDB · OpenStreetMap
            </div>
        </div>
    );
}
