import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, MapPin, LogIn, LogOut, Navigation } from 'lucide-react';

function isValidCoord(lat, lng) {
    const nLat = Number(lat);
    const nLng = Number(lng);
    return (
        !isNaN(nLat) && !isNaN(nLng) &&
        nLat >= -90 && nLat <= 90 &&
        nLng >= -180 && nLng <= 180 &&
        (nLat !== 0 || nLng !== 0)
    );
}

const KIND_META = {
    check_in: { color: '#16a34a', label: 'Check-in' },
    check_out: { color: '#dc2626', label: 'Check-out' },
    track: { color: '#111827', label: 'Titik' },
};

function markerIcon(nomor, jenis) {
    const color = KIND_META[jenis]?.color || KIND_META.track.color;
    return L.divIcon({
        className: 'custom-timeline-marker',
        html: `<div style="background:${color};color:#ffffff;border:2px solid #ffffff;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.4);">${nomor}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
    });
}

function MapEffects({ points, focusIndex }) {
    const map = useMap();

    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 150);
    }, [map]);

    useEffect(() => {
        if (focusIndex != null && points[focusIndex]) {
            map.flyTo(
                [points[focusIndex].lat, points[focusIndex].lng],
                Math.max(map.getZoom(), 16),
                { duration: 0.8 }
            );
            return;
        }

        const coords = points.map((p) => [p.lat, p.lng]);
        if (coords.length === 1) {
            map.setView(coords[0], 15);
        } else if (coords.length > 1) {
            map.fitBounds(L.latLngBounds(coords), { padding: [50, 50], maxZoom: 16 });
        }
    }, [points, focusIndex, map]);

    return null;
}

export default function TrackingTimelineMap({ tracking, titik = null, height = '460px' }) {
    const rawPoints = Array.isArray(tracking?.points) ? tracking.points : [];
    const rawCount = tracking?.raw_count ?? 0;

    const points = useMemo(
        () =>
            rawPoints
                .filter((p) => isValidCoord(p.lat, p.lng))
                .map((p, i) => ({ ...p, nomor: i + 1 })),
        [rawPoints]
    );

    const [focusIndex, setFocusIndex] = useState(null);

    const hasTitik = titik && isValidCoord(titik.latitude, titik.longitude);
    const radiusMeter = hasTitik ? Number(titik.radius_presensi_meter || 0) : 0;

    const center = points.length > 0
        ? [points[0].lat, points[0].lng]
        : hasTitik
            ? [Number(titik.latitude), Number(titik.longitude)]
            : [-6.2088, 106.8456];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
                <div
                    className="relative border-2 border-black rounded-md overflow-hidden bg-gray-100 shadow-sm"
                    style={{ height }}
                >
                    {points.length === 0 && (
                        <div className="absolute top-2 left-2 z-[1000] bg-white/90 border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-600 shadow">
                            Tidak ada titik GPS tercatat untuk presensi ini.
                        </div>
                    )}
                    <MapContainer
                        center={center}
                        zoom={points.length > 0 ? 13 : 5}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19}
                        />

                        <MapEffects points={points} focusIndex={focusIndex} />

                        {hasTitik && radiusMeter > 0 && (
                            <Circle
                                center={[Number(titik.latitude), Number(titik.longitude)]}
                                radius={radiusMeter}
                                pathOptions={{
                                    color: '#2563eb',
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.12,
                                    weight: 2,
                                    dashArray: '4, 4',
                                }}
                            />
                        )}

                        {points.length > 1 && (
                            <Polyline
                                positions={points.map((p) => [p.lat, p.lng])}
                                pathOptions={{ color: '#111827', weight: 3, opacity: 0.7 }}
                            />
                        )}

                        {points.map((p, i) => (
                            <Marker
                                key={i}
                                position={[p.lat, p.lng]}
                                icon={markerIcon(p.nomor, p.jenis)}
                                eventHandlers={{ click: () => setFocusIndex(i) }}
                            >
                                <Popup>
                                    <div className="p-1 min-w-[160px] text-gray-800">
                                        <p className="text-xs font-semibold text-gray-900 mb-1">
                                            {KIND_META[p.jenis]?.label || 'Titik'} #{p.nomor}
                                        </p>
                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {p.label_jam}
                                        </p>
                                        <p className="text-[11px] font-mono text-gray-500 mt-1">
                                            {Number(p.lat).toFixed(6)}, {Number(p.lng).toFixed(6)}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-gray-400" />
                            Linimasa
                        </h3>
                        <span className="text-xs text-gray-500">
                            {points.length} titik tampil • {rawCount} GPS mentah
                        </span>
                    </div>

                    {points.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada data lokasi.</p>
                    ) : (
                        <ol className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                            {points.map((p, i) => {
                                const meta = KIND_META[p.jenis] || KIND_META.track;
                                const active = focusIndex === i;
                                const Icon = p.jenis === 'check_in' ? LogIn : p.jenis === 'check_out' ? LogOut : MapPin;
                                return (
                                    <li key={i}>
                                        <button
                                            type="button"
                                            onClick={() => setFocusIndex(i)}
                                            className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                                                active ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <span
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold text-white shrink-0"
                                                style={{ backgroundColor: meta.color }}
                                            >
                                                {p.nomor}
                                            </span>
                                            <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                                            <span className="text-sm font-medium">{p.label_jam}</span>
                                            <span className={`text-xs ${active ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {meta.label}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
}
