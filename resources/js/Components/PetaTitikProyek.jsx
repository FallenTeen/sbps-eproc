import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from '@inertiajs/react';
import { MapPin, ExternalLink, CheckCircle } from 'lucide-react';

// Fix icon bawaan Leaflet pada Vite/Webpack bundling
delete L.Icon.Default.prototype._getIconUrl;

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icon khusus untuk titik yang sedang aktif terpilih (warna berbeda / pin tebal)
const activeIcon = L.divIcon({
    className: 'custom-active-marker',
    html: '<div style="background-color: #000000; color: #ffffff; border: 2px solid #ffffff; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); transform: translate(-50%, -50%);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
});

// Komponen helper untuk auto fit bounds & center fokus
function MapController({ markers, selectedTitikId, autoFit }) {
    const map = useMap();

    useEffect(() => {
        // Trigger invalidateSize setelah render untuk memastikan tile tidak terpotong (terutama di tab/modal)
        setTimeout(() => {
            map.invalidateSize();
        }, 150);
    }, [map]);

    useEffect(() => {
        if (selectedTitikId) {
            const selected = markers.find(m => String(m.id) === String(selectedTitikId));
            if (selected && isValidCoord(selected.latitude, selected.longitude)) {
                map.flyTo([Number(selected.latitude), Number(selected.longitude)], Math.max(map.getZoom(), 15), {
                    duration: 0.8
                });
                return;
            }
        }

        if (autoFit && markers.length > 0) {
            const validCoords = markers
                .filter(m => isValidCoord(m.latitude, m.longitude))
                .map(m => [Number(m.latitude), Number(m.longitude)]);

            if (validCoords.length === 1) {
                map.setView(validCoords[0], 14);
            } else if (validCoords.length > 1) {
                const bounds = L.latLngBounds(validCoords);
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
            }
        }
    }, [markers, selectedTitikId, autoFit, map]);

    return null;
}

function isValidCoord(lat, lng) {
    const nLat = Number(lat);
    const nLng = Number(lng);
    return !isNaN(nLat) && !isNaN(nLng) && nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180 && (nLat !== 0 || nLng !== 0);
}

export default function PetaTitikProyek({
    titiks = [],
    selectedTitikId = null,
    onMarkerClick = null,
    height = '380px',
    className = '',
    showDetailButton = true,
    autoFit = true,
    showRadius = true
}) {
    // Filter titik dengan koordinat valid
    const validTitiks = useMemo(() => {
        return (Array.isArray(titiks) ? titiks : []).filter(t =>
            isValidCoord(t.latitude, t.longitude)
        );
    }, [titiks]);

    // Center default (Indonesia / titik pertama / Jakarta)
    const defaultCenter = useMemo(() => {
        if (selectedTitikId) {
            const sel = validTitiks.find(t => String(t.id) === String(selectedTitikId));
            if (sel) return [Number(sel.latitude), Number(sel.longitude)];
        }
        if (validTitiks.length > 0) {
            return [Number(validTitiks[0].latitude), Number(validTitiks[0].longitude)];
        }
        return [-6.2088, 106.8456]; // Jakarta default
    }, [validTitiks, selectedTitikId]);

    const defaultZoom = validTitiks.length > 0 ? 12 : 5;

    return (
        <div className={`relative border-2 border-black rounded-md overflow-hidden bg-gray-100 shadow-sm ${className}`} style={{ height }}>
            {validTitiks.length === 0 && (
                <div className="absolute top-2 left-2 z-[1000] bg-white/90 border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-600 shadow">
                    Belum ada data koordinat latitude/longitude pada titik proyek ini.
                </div>
            )}

            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                {/* Tile Layer OpenStreetMap dengan atribusi wajib */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                <MapController
                    markers={validTitiks}
                    selectedTitikId={selectedTitikId}
                    autoFit={autoFit}
                />

                {validTitiks.map((titik) => {
                    const isSelected = String(titik.id) === String(selectedTitikId);
                    const lat = Number(titik.latitude);
                    const lng = Number(titik.longitude);
                    const proyekNama = titik.proyek_nama || titik.proyek?.nama || null;
                    const radiusMeter = Number(titik.radius_presensi_meter || titik.radius || 100);

                    return (
                        <React.Fragment key={titik.id}>
                            <Marker
                                position={[lat, lng]}
                                icon={isSelected ? activeIcon : defaultIcon}
                                eventHandlers={{
                                    click: () => {
                                        if (onMarkerClick) {
                                            onMarkerClick(titik.id, titik);
                                        }
                                    }
                                }}
                            >
                                <Popup>
                                    <div className="p-1 min-w-[200px] text-gray-800">
                                        <div className="flex items-start justify-between gap-2 border-b pb-1.5 mb-2">
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 leading-tight">{titik.nama}</h4>
                                                {proyekNama && (
                                                    <p className="text-xs text-gray-600 mt-0.5">Proyek: {proyekNama}</p>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                                titik.status === 'nonaktif' 
                                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                                    : 'bg-green-100 text-green-700 border border-green-200'
                                            }`}>
                                                {titik.status || 'aktif'}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-gray-600 mb-3">
                                            <div className="flex items-center gap-1 font-mono text-[11px]">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                                            </div>
                                            {radiusMeter > 0 && (
                                                <div className="text-[11px] text-gray-500">
                                                    Radius Presensi: <span className="font-semibold text-gray-700">{radiusMeter}m</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5 pt-1 border-t">
                                            {onMarkerClick && (
                                                <button
                                                    type="button"
                                                    onClick={() => onMarkerClick(titik.id, titik)}
                                                    className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
                                                        isSelected
                                                            ? 'bg-black text-white border-black hover:bg-gray-800'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {isSelected ? 'Sedang Dipilih' : 'Pilih Titik Ini'}
                                                </button>
                                            )}

                                            {showDetailButton && typeof route === 'function' && (
                                                <Link
                                                    href={route('core.titik.show', titik.id)}
                                                    className="w-full flex items-center justify-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium py-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Lihat Detail Titik
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Circle Radius presensi saat marker sedang dipilih */}
                            {showRadius && isSelected && radiusMeter > 0 && (
                                <Circle
                                    center={[lat, lng]}
                                    radius={radiusMeter}
                                    pathOptions={{
                                        color: '#000000',
                                        fillColor: '#3b82f6',
                                        fillOpacity: 0.15,
                                        weight: 2,
                                        dashArray: '4, 4'
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
}
