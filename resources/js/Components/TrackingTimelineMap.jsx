import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Info,
    LogIn,
    LogOut,
    MapPin,
    Maximize2,
    Minimize2,
    Navigation,
    Route,
    Timer,
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

function jarakAntar(a, b) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const aLat = Number(a.lat);
    const bLat = Number(b.lat);
    const dLat = (bLat - aLat) * rad;
    const dLng = (Number(b.lng) - Number(a.lng)) * rad;
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function toMs(value) {
    if (!value) return NaN;
    return Date.parse(String(value).replace(' ', 'T'));
}

function formatDurasi(menit) {
    const m = Math.max(0, Math.round(Number(menit) || 0));
    const j = Math.floor(m / 60);
    const sisa = m % 60;
    if (j === 0) return `${sisa} m`;
    return sisa === 0 ? `${j} j` : `${j} j ${sisa} m`;
}

function formatJarak(meter) {
    const m = Math.max(0, Number(meter) || 0);
    if (m >= 1000) {
        return `± ${(m / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`;
    }
    return `${Math.round(m)} m`;
}

function Stat({ icon: Icon, label, value, hint, tone = 'gray' }) {
    const tones = {
        gray: 'bg-gray-50 border-gray-200',
        amber: 'bg-amber-50 border-amber-200',
    };
    return (
        <div className={`rounded-md border px-2.5 py-1.5 ${tones[tone]}`}>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <Icon className="h-3 w-3 shrink-0" />
                {label}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-gray-900">{value}</div>
            {hint && <div className="text-[10px] text-gray-400">{hint}</div>}
        </div>
    );
}

const KIND_META = {
    check_in: { color: '#16a34a', label: 'Check-in' },
    check_out: { color: '#dc2626', label: 'Check-out' },
    track: { color: '#111827', label: 'Titik' },
    gap: { color: '#d97706', label: 'Gap' },
};

const isPresensiEvent = (jenis) => jenis === 'check_in' || jenis === 'check_out';

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

function MapEffects({ points, extraCoord, focusAt, focusCoordinate, isFull }) {
    const map = useMap();
    const lastFocusRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 150);
        return () => clearTimeout(t);
    }, [map, isFull]);

    useEffect(() => {
        if (!focusCoordinate) {
            lastFocusRef.current = null;
            return;
        }
        if (lastFocusRef.current === focusAt) return;
        lastFocusRef.current = focusAt;
        map.flyTo(focusCoordinate, Math.max(map.getZoom(), 16), { duration: 0.8 });
    }, [focusAt, focusCoordinate, map]);

    const sig =
        points.length === 0
            ? '0'
            : `${points.length}|${points[0].recorded_at}|${points[points.length - 1].recorded_at}`;
    const extraKey = extraCoord ? extraCoord.join(',') : '';

    useEffect(() => {
        if (focusCoordinate) return;
        const coords = points.map((p) => [p.lat, p.lng]);
        if (extraCoord) coords.push(extraCoord);
        if (coords.length === 0) return;
        map.invalidateSize();
        if (coords.length === 1) {
            map.setView(coords[0], 15);
        } else {
            map.fitBounds(L.latLngBounds(coords), { padding: [50, 50], maxZoom: 16 });
        }
    }, [sig, extraKey, map]);

    return null;
}

export default function TrackingTimelineMap({ tracking, titik = null, presensiId = null, height = '460px' }) {
    const rawPoints = Array.isArray(tracking?.points) ? tracking.points : [];
    const rawCount = tracking?.raw_count ?? 0;
    const truncated = Boolean(tracking?.truncated);
    const intervalMenit = tracking?.interval_menit ?? null;
    const durasiMenit = tracking?.durasi_menit ?? null;
    const jarakMeter = tracking?.jarak_meter ?? null;

    const hasTitik = Boolean(titik && isValidCoord(titik.latitude, titik.longitude));
    const titikLat = hasTitik ? Number(titik.latitude) : null;
    const titikLng = hasTitik ? Number(titik.longitude) : null;
    const radiusMeter = hasTitik ? Number(titik.radius_presensi_meter || 0) : 0;

    const gapEntries = useMemo(
        () => rawPoints.filter((p) => p.jenis === 'gap'),
        [rawPoints]
    );

    const gapCount = tracking?.gap_count ?? gapEntries.length;

    const points = useMemo(() => {
        let prev = null;
        return rawPoints
            .filter((p) => isValidCoord(p.lat, p.lng))
            .map((p, i) => {
                const t = toMs(p.recorded_at);
                const dariSebelumnya = prev
                    ? {
                          meter: jarakAntar(prev, p),
                          menit:
                              !isNaN(t) && !isNaN(prev.t)
                                  ? Math.max(0, Math.round((t - prev.t) / 60000))
                                  : null,
                      }
                    : null;
                prev = { lat: p.lat, lng: p.lng, t };
                const dariTitik =
                    hasTitik ? jarakAntar({ lat: titikLat, lng: titikLng }, p) : null;
                return { ...p, nomor: i + 1, dariSebelumnya, dariTitik };
            });
    }, [rawPoints, hasTitik, titikLat, titikLng]);

    const timelineItems = useMemo(() => {
        const byAt = new Map(points.map((p) => [p.recorded_at, p]));
        return rawPoints
            .map((p) => (p.jenis === 'gap' ? p : byAt.get(p.recorded_at)))
            .filter(Boolean);
    }, [rawPoints, points]);

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

    const luarRadius = useMemo(
        () =>
            radiusMeter > 0
                ? points.filter(
                      (p) => isPresensiEvent(p.jenis) && p.dariTitik != null && p.dariTitik > radiusMeter
                  )
                : [],
        [points, radiusMeter]
    );

    const [focusAt, setFocusAt] = useState(null);
    const [isFull, setIsFull] = useState(false);
    const activeItemRef = useRef(null);

    useEffect(() => {
        setFocusAt(null);
    }, [presensiId]);

    const focusIdx = focusAt == null ? -1 : points.findIndex((p) => p.recorded_at === focusAt);
    const focus = focusIdx >= 0 ? points[focusIdx] : null;
    const focusCoordinate = focus ? [focus.lat, focus.lng] : null;

    const step = (dir) => {
        if (points.length === 0) return;
        const base = focusIdx >= 0 ? focusIdx : (dir > 0 ? -1 : 0);
        const next = Math.min(points.length - 1, Math.max(0, base + dir));
        setFocusAt(points[next].recorded_at);
    };

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

    const center = points.length > 0
        ? [points[0].lat, points[0].lng]
        : hasTitik
            ? [titikLat, titikLng]
            : [-6.2088, 106.8456];

    const navLabel = focus
        ? `#${focus.nomor}/${points.length} • ${focus.bucket_label || focus.label_jam}${
              focus.bucket_label ? ` (${focus.label_jam})` : ''
          }`
        : `${points.length} titik`;

    const showLegendTrack = points.some((p) => p.jenis === 'track');
    const noGpsTrail = rawCount === 0 && points.length > 0;

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
                            title={focus ? `${KIND_META[focus.jenis]?.label || 'Titik'} • ${focus.label_jam}` : 'Belum ada fokus'}
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
                            extraCoord={hasTitik ? [titikLat, titikLng] : null}
                            focusAt={focusAt}
                            focusCoordinate={focusCoordinate}
                            isFull={isFull}
                        />

                        {hasTitik && radiusMeter > 0 && (
                            <Circle
                                center={[titikLat, titikLng]}
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
                                    <div className="p-1 min-w-[170px] text-gray-800">
                                        <p className="text-xs font-semibold text-gray-900 mb-1">
                                            {KIND_META[p.jenis]?.label || 'Titik'} #{p.nomor}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {p.bucket_label || p.label_jam}
                                        </p>
                                        {p.bucket_label && (
                                            <p className="text-[10px] text-gray-500 mt-0.5 pl-4">
                                                Titik aktual {p.label_jam} • interval {p.bucket_menit} mnt
                                            </p>
                                        )}
                                        {p.dariTitik != null && (
                                            <p className="text-[11px] text-gray-600 mt-1">
                                                {formatJarak(p.dariTitik)} dari titik presensi
                                            </p>
                                        )}
                                        <p className="text-[11px] font-mono text-gray-500 mt-1">
                                            {Number(p.lat).toFixed(6)}, {Number(p.lng).toFixed(6)}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {!isFull && points.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
                        {['check_in', 'check_out'].map((k) => (
                            <span key={k} className="inline-flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: KIND_META[k].color }} />
                                {KIND_META[k].label}
                            </span>
                        ))}
                        {showLegendTrack && (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: KIND_META.track.color }} />
                                Titik GPS
                            </span>
                        )}
                        {gapCount > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-0 w-4 border-t-[3px] border-dotted border-amber-600" />
                                Gap data
                            </span>
                        )}
                        {hasTitik && radiusMeter > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full border-2 border-dashed border-blue-600 bg-blue-500/15" />
                                Radius presensi ({radiusMeter} m)
                            </span>
                        )}
                    </div>
                )}
            </div>

            {!isFull && (
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-gray-400" />
                                Linimasa
                            </h3>
                            {intervalMenit != null && (
                                <span
                                    className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                                    title={`Sampling per ${intervalMenit} menit, label waktu = awal interval`}
                                >
                                    Per {intervalMenit} mnt
                                </span>
                            )}
                        </div>

                        {luarRadius.length > 0 && (
                            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-2.5 py-2 mb-3">
                                <TriangleAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-red-800 space-y-0.5">
                                    {luarRadius.map((p) => (
                                        <p key={p.recorded_at}>
                                            {KIND_META[p.jenis].label} berjarak {formatJarak(p.dariTitik)} dari titik
                                            presensi (radius {radiusMeter} m).
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {points.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <Stat
                                    icon={Timer}
                                    label="Durasi"
                                    value={durasiMenit != null ? formatDurasi(durasiMenit) : '-'}
                                />
                                <Stat
                                    icon={Route}
                                    label="Jarak tempuh"
                                    value={rawCount === 0 || jarakMeter == null ? '-' : formatJarak(jarakMeter)}
                                    hint={rawCount === 0 ? 'Tidak ada jejak GPS' : null}
                                />
                                <Stat
                                    icon={TriangleAlert}
                                    label="Gap data"
                                    value={gapCount}
                                    tone={gapCount > 0 ? 'amber' : 'gray'}
                                />
                                <Stat
                                    icon={MapPin}
                                    label="Data GPS"
                                    value={rawCount}
                                    hint={rawCount > 0 ? `${points.length} ditampilkan` : null}
                                />
                            </div>
                        )}

                        {noGpsTrail && (
                            <div className="flex items-start gap-2 rounded-md bg-gray-50 border border-gray-200 px-2.5 py-2 mb-3">
                                <Info className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-600">
                                    Tidak ada jejak GPS di antara check-in dan check-out. Hanya lokasi presensi yang tercatat.
                                </p>
                            </div>
                        )}

                        {truncated && (
                            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2 mb-3">
                                <TriangleAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800">
                                    Linimasa dipotong, hanya {points.length} titik pertama dari {rawCount} yang ditampilkan.
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
                            <ol className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
                                {timelineItems.map((p, i) => {
                                    const isLast = i === timelineItems.length - 1;
                                    const connector = !isLast && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute left-[19px] top-8 -bottom-1 w-px bg-gray-200"
                                        />
                                    );

                                    if (p.jenis === 'gap') {
                                        return (
                                            <li key={`gap-${i}`} className="relative">
                                                {connector}
                                                <div className="flex items-center gap-2 border border-dashed border-amber-300 bg-amber-50/70 rounded-md px-2 py-1.5 my-1">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-700 shrink-0">
                                                        <Navigation className="w-3 h-3" />
                                                    </span>
                                                    <span className="text-xs font-semibold text-amber-800">
                                                        Gap {p.label_jam}
                                                    </span>
                                                    <span className="ml-auto text-[10px] font-medium text-amber-700 whitespace-nowrap">
                                                        {p.durasi_menit} mnt tanpa data
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    }

                                    const meta = KIND_META[p.jenis] || KIND_META.track;
                                    const active = p.recorded_at === focusAt;
                                    const Icon = p.jenis === 'check_in' ? LogIn : p.jenis === 'check_out' ? LogOut : MapPin;
                                    const kindText = {
                                        check_in: 'text-green-600',
                                        check_out: 'text-red-600',
                                    }[p.jenis] || 'text-gray-500';

                                    const isEvent = isPresensiEvent(p.jenis);
                                    const dalamRadius =
                                        isEvent && radiusMeter > 0 && p.dariTitik != null
                                            ? p.dariTitik <= radiusMeter
                                            : null;
                                    const seg = p.dariSebelumnya;

                                    return (
                                        <li key={p.recorded_at} className="relative">
                                            {connector}
                                            <button
                                                type="button"
                                                ref={active ? activeItemRef : null}
                                                onClick={() => setFocusAt(p.recorded_at)}
                                                className={`w-full flex items-start gap-2 rounded-md px-2 py-1.5 text-left transition ${
                                                    active ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                <span
                                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold text-white shrink-0"
                                                    style={{ backgroundColor: meta.color }}
                                                >
                                                    {p.nomor}
                                                </span>

                                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="flex items-center gap-1.5">
                                                        <Icon
                                                            className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : kindText}`}
                                                        />
                                                        <span className={`text-xs font-semibold ${active ? 'text-white' : kindText}`}>
                                                            {meta.label}
                                                        </span>
                                                        <span className="ml-auto font-mono text-sm font-semibold">
                                                            {p.bucket_label || p.label_jam}
                                                        </span>
                                                    </span>

                                                    {dalamRadius !== null && (
                                                        <span className="flex items-center gap-1.5">
                                                            <span
                                                                className={`rounded border px-1.5 py-px text-[10px] font-semibold ${
                                                                    dalamRadius
                                                                        ? active
                                                                            ? 'border-green-400/40 bg-green-500/20 text-green-200'
                                                                            : 'border-green-200 bg-green-50 text-green-700'
                                                                        : active
                                                                          ? 'border-red-400/40 bg-red-500/25 text-red-200'
                                                                          : 'border-red-200 bg-red-50 text-red-700'
                                                                }`}
                                                            >
                                                                {dalamRadius ? 'Dalam radius' : 'Di luar radius'}
                                                            </span>
                                                            <span className={`text-[10px] ${active ? 'text-gray-300' : 'text-gray-500'}`}>
                                                                {formatJarak(p.dariTitik)} dari titik presensi
                                                            </span>
                                                        </span>
                                                    )}

                                                    {p.bucket_label && (
                                                        <span className={`font-mono text-[10px] ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                                                            aktual {p.label_jam}
                                                        </span>
                                                    )}

                                                    {seg && (
                                                        <span className={`text-[10px] ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                                                            {seg.menit != null ? `${formatDurasi(seg.menit)} • ` : ''}
                                                            {formatJarak(seg.meter)} dari titik sebelumnya
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}

                        <p className="mt-3 border-t border-gray-100 pt-2 text-[10px] leading-relaxed text-gray-400">
                            Tekan ← → untuk berpindah titik, Esc untuk keluar layar penuh.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
