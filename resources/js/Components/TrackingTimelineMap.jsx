import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    LogIn,
    LogOut,
    MapPin,
    Maximize2,
    Minimize2,
    Navigation,
    TriangleAlert,
} from 'lucide-react';

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
    gap: { color: '#d97706', label: 'Gap' },
};

function markerIcon(nomor, jenis, active) {
    const color = KIND_META[jenis]?.color || KIND_META.track.color;
    const scale = active ? 'transform:scale(1.18);z-index:10;position:relative;' : '';
    return L.divIcon({
        className: 'custom-timeline-marker',
        html: `<div style="background:${color};color:#ffffff;border:2px solid #ffffff;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.4);${scale}">${nomor}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
    });
}

function MapEffects({ points, focusCoordinate, isFull }) {
    const map = useMap();

    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 150);
        return () => clearTimeout(t);
    }, [map, isFull]);

    useEffect(() => {
        if (focusCoordinate) {
            map.flyTo(
                focusCoordinate,
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
    }, [points, focusCoordinate, map]);

    return null;
}

export default function TrackingTimelineMap({ tracking, titik = null, height = '460px' }) {
    const rawPoints = Array.isArray(tracking?.points) ? tracking.points : [];
    const rawCount = tracking?.raw_count ?? 0;
    const truncated = Boolean(tracking?.truncated);

    const points = useMemo(
        () =>
            rawPoints
                .filter((p) => isValidCoord(p.lat, p.lng))
                .map((p, i) => ({ ...p, nomor: i + 1 })),
        [rawPoints]
    );

    const gapEntries = useMemo(
        () => rawPoints.filter((p) => p.jenis === 'gap'),
        [rawPoints]
    );

    const gapSegments = useMemo(() => {
        const segments = [];
        gapEntries.forEach((gap, gIdx) => {
            const gPos = rawPoints.indexOf(gap);
            const prev = [...rawPoints.slice(0, gPos)].reverse().find((p) => isValidCoord(p.lat, p.lng));
            const next = rawPoints.slice(gPos + 1).find((p) => isValidCoord(p.lat, p.lng));
            if (prev && next) {
                segments.push({ key: `gap-${gIdx}`, positions: [[prev.lat, prev.lng], [next.lat, next.lng]] });
            }
        });
        return segments;
    }, [rawPoints, gapEntries]);

    // Fokus disimpan sebagai identitas titik (recorded_at), BUKAN index
    // mentah - list (raw) dan marker (points tanpa gap) tetap konsisten.
    const [focusAt, setFocusAt] = useState(null);
    const [isFull, setIsFull] = useState(false);
    const activeItemRef = useRef(null);

    useEffect(() => {
        setFocusAt(null);
    }, [tracking]);

    const focusIdx = focusAt == null ? -1 : points.findIndex((p) => p.recorded_at === focusAt);
    const focus = focusIdx >= 0 ? points[focusIdx] : null;
    const focusCoordinate = focus ? [focus.lat, focus.lng] : null;

    const step = (dir) => {
        if (points.length === 0) return;
        const base = focusIdx >= 0 ? focusIdx : (dir > 0 ? -1 : 0);
        const next = Math.min(points.length - 1, Math.max(0, base + dir));
        setFocusAt(points[next].recorded_at);
    };

    // Navigasi keyboard: panah kiri/kanan (kecuali sedang mengetik di input).
    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                step(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                step(1);
            } else if (e.key === 'Escape' && isFull) {
                setIsFull(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    useEffect(() => {
        if (focusAt && activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [focusAt]);

    const hasTitik = titik && isValidCoord(titik.latitude, titik.longitude);
    const radiusMeter = hasTitik ? Number(titik.radius_presensi_meter || 0) : 0;

    const center = points.length > 0
        ? [points[0].lat, points[0].lng]
        : hasTitik
            ? [Number(titik.latitude), Number(titik.longitude)]
            : [-6.2088, 106.8456];

    const navLabel = focus
        ? `#${focus.nomor}/${points.length} • ${focus.label_jam}`
        : `${points.length} titik`;

    return (
        <div className={`grid grid-cols-1 gap-4 ${isFull ? 'block' : 'lg:grid-cols-3'}`}>
            <div className={isFull ? '' : 'lg:col-span-2'}>
                <div
                    className={`relative border-2 border-black rounded-md overflow-hidden bg-gray-100 shadow-sm ${
                        isFull ? 'fixed inset-0 z-[3000] rounded-none border-0' : ''
                    }`}
                    style={{ height: isFull ? '100vh' : height }}
                >
                    {points.length === 0 && (
                        <div className="absolute top-2 left-2 z-[1000] bg-white/90 border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-600 shadow">
                            {rawCount > 0
                                ? 'Titik GPS ada, namun dikosongkan karena terlalu banyak (data tidak valid).'
                                : 'Tidak ada titik GPS tercatat untuk presensi ini.'}
                        </div>
                    )}

                    {/* Bar navigasi linimasa + fullscreen di atas peta */}
                    <div className="absolute top-2 right-2 z-[2000] flex items-center gap-1 rounded-lg border border-gray-300 bg-white/95 px-1.5 py-1 shadow">
                        <button
                            type="button"
                            title="Titik sebelumnya (←)"
                            onClick={() => step(-1)}
                            disabled={focusIdx <= 0 || points.length === 0}
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span
                            className={`min-w-[104px] px-1 text-center text-[11px] font-semibold ${
                                focus ? 'text-gray-900' : 'text-gray-500'
                            }`}
                            title={focus ? `${focus.jenis === 'check_in' ? 'Check-in' : focus.jenis === 'check_out' ? 'Check-out' : 'Titik'} • ${focus.label_jam}` : 'Belum ada fokus'}
                        >
                            {navLabel}
                        </span>
                        <button
                            type="button"
                            title="Titik berikutnya (→)"
                            onClick={() => step(1)}
                            disabled={focusIdx >= points.length - 1 || points.length === 0}
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="mx-0.5 h-4 w-px bg-gray-200" />
                        <button
                            type="button"
                            title={isFull ? 'Keluar dari layar penuh (Esc)' : 'Layar penuh'}
                            onClick={() => setIsFull((v) => !v)}
                            className={`flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 ${
                                isFull ? 'text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                    </div>

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

                        <MapEffects
                            points={points}
                            focusCoordinate={focusCoordinate}
                            isFull={isFull}
                        />

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

                        {gapSegments.map((seg) => (
                            <Polyline
                                key={seg.key}
                                positions={seg.positions}
                                pathOptions={{
                                    color: '#d97706',
                                    weight: 3,
                                    opacity: 0.8,
                                    dashArray: '2, 8',
                                    lineCap: 'round',
                                }}
                                interactive={false}
                            />
                        ))}

                        {points.map((p) => (
                            <Marker
                                key={p.recorded_at}
                                position={[p.lat, p.lng]}
                                icon={markerIcon(p.nomor, p.jenis, p.recorded_at === focusAt)}
                                eventHandlers={{ click: () => setFocusAt(p.recorded_at) }}
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

            {!isFull && (
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

                        {truncated && (
                            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2 mb-3">
                                <TriangleAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800">
                                    Linimasa dipotong — hanya {points.length} titik pertama dari {rawCount} yang ditampilkan.
                                </p>
                            </div>
                        )}

                        {points.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                {rawCount > 0
                                    ? 'Data GPS terlalu banyak untuk ditampilkan.'
                                    : 'Belum ada data lokasi.'}
                            </p>
                        ) : (
                            <ol className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                                {rawPoints.map((p, i) => {
                                    if (p.jenis === 'gap') {
                                        return (
                                            <li key={`gap-${i}`}>
                                                <div className="flex items-center gap-2 px-2 py-1">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-[10px] shrink-0">
                                                        <Navigation className="w-3 h-3" />
                                                    </span>
                                                    <span className="text-xs font-medium text-amber-700">
                                                        Gap {p.label_jam}
                                                    </span>
                                                    <span className="text-[10px] text-amber-600">
                                                        {p.durasi_menit} mnt tanpa data
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    }
                                    if (!isValidCoord(p.lat, p.lng)) return null;
                                    const meta = KIND_META[p.jenis] || KIND_META.track;
                                    const active = p.recorded_at === focusAt;
                                    const Icon = p.jenis === 'check_in' ? LogIn : p.jenis === 'check_out' ? LogOut : MapPin;
                                    return (
                                        <li key={i}>
                                            <button
                                                type="button"
                                                ref={active ? activeItemRef : null}
                                                onClick={() => setFocusAt(p.recorded_at)}
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

                        <p className="mt-3 border-t border-gray-100 pt-2 text-[10px] leading-relaxed text-gray-400">
                            Navigasi: tombol ‹ ›  di atas peta, panah keyboard ← →,
                            klik nomor di list/peta, Esc untuk keluar layar penuh.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}