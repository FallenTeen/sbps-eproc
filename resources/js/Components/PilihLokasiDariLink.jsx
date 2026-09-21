import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Link2,
    MapPin,
    Loader2,
    CheckCircle2,
    RotateCcw,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function isValidNum(value) {
    const n = Number(value);
    return value !== null && value !== '' && !isNaN(n) && isFinite(n);
}

export function isValidCoordinate(lat, lng) {
    if (!isValidNum(lat) || !isValidNum(lng)) return false;
    const nLat = Number(lat);
    const nLng = Number(lng);
    return (
        nLat >= -90 &&
        nLat <= 90 &&
        nLng >= -180 &&
        nLng <= 180 &&
        (nLat !== 0 || nLng !== 0)
    );
}

function RecenterMap({ lat, lng }) {
    const map = useMap();

    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 150);
    }, [map]);

    useEffect(() => {
        if (!isValidCoordinate(lat, lng)) return;
        map.flyTo([Number(lat), Number(lng)], Math.max(map.getZoom(), 16), {
            duration: 0.8,
        });
    }, [lat, lng, map]);

    return null;
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
    });
    let payload = {};
    try {
        payload = await response.json();
    } catch (e) {
        payload = {};
    }
    if (!response.ok) {
        throw new Error(
            payload.error || payload.message || 'Gagal memproses lokasi.',
        );
    }
    return payload;
}

export default function PilihLokasiDariLink({
    onConfirm,
    initialLatitude = null,
    initialLongitude = null,
    mapHeight = '320px',
    label = 'Lokasi dari Google Maps',
}) {
    const prefill = isValidCoordinate(initialLatitude, initialLongitude);

    const [link, setLink] = useState('');
    const [latitude, setLatitude] = useState(prefill ? Number(initialLatitude) : null);
    const [longitude, setLongitude] = useState(prefill ? Number(initialLongitude) : null);
    const [alamat, setAlamat] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [loadingAlamat, setLoadingAlamat] = useState(false);
    const [error, setError] = useState(null);
    const [confirmed, setConfirmed] = useState(false);

    const hasCoords = isValidCoordinate(latitude, longitude);

    useEffect(() => {
        if (!hasCoords) return;
        let active = true;
        setLoadingAlamat(true);
        fetchJson(route('core.lokasi.reverse', { lat: latitude, lng: longitude }))
            .then((data) => {
                if (active) setAlamat(data.alamat || null);
            })
            .catch(() => {
                if (active) setAlamat(null);
            })
            .finally(() => {
                if (active) setLoadingAlamat(false);
            });
        return () => {
            active = false;
        };
    }, [latitude, longitude, hasCoords]);

    const handleAmbil = async () => {
        setError(null);
        setConfirmed(false);
        setAlamat(null);
        const trimmed = link.trim();
        if (!trimmed) {
            setError('Tempel link Google Maps terlebih dahulu.');
            return;
        }
        setResolving(true);
        try {
            const data = await fetchJson(
                route('core.lokasi.resolve', { link: trimmed }),
            );
            setLatitude(Number(data.latitude));
            setLongitude(Number(data.longitude));
        } catch (e) {
            setLatitude(null);
            setLongitude(null);
            setError(e.message);
        } finally {
            setResolving(false);
        }
    };

    const handleKonfirmasi = () => {
        if (!hasCoords) return;
        if (typeof onConfirm === 'function') {
            onConfirm({
                latitude: Number(latitude),
                longitude: Number(longitude),
                alamat: alamat || null,
            });
        }
        setConfirmed(true);
    };

    const handleUlangi = () => {
        setConfirmed(false);
        setAlamat(null);
        setLatitude(null);
        setLongitude(null);
        setError(null);
    };

    const gmapsUrl = useMemo(
        () =>
            hasCoords
                ? `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`
                : null,
        [hasCoords, latitude, longitude],
    );

    const mapCenter = hasCoords
        ? [Number(latitude), Number(longitude)]
        : [-6.2088, 106.8456];

    return (
        <div className="md:col-span-2 border border-gray-200 rounded-md p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <p className="text-xs text-gray-500 mb-2">
                Buka Google Maps → bagikan lokasi → salin tautan, lalu tempel di bawah.
                Koordinat diambil dari tautan dan akan ditampilkan pada peta.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAmbil}
                    disabled={resolving}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                >
                    {resolving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <MapPin className="w-4 h-4" />
                    )}
                    {resolving ? 'Memproses...' : 'Ambil Lokasi'}
                </button>
            </div>

            {error && (
                <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="mt-4">
                <div
                    className="relative border-2 border-black rounded-md overflow-hidden bg-gray-100 shadow-sm"
                    style={{ height: mapHeight }}
                >
                    {!hasCoords && (
                        <div className="absolute top-2 left-2 z-[1000] bg-white/90 border border-gray-300 px-3 py-1.5 rounded text-xs text-gray-600 shadow">
                            Peta akan menampilkan lokasi setelah tautan diproses.
                        </div>
                    )}
                    <MapContainer
                        center={mapCenter}
                        zoom={hasCoords ? 16 : 5}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19}
                        />
                        <RecenterMap lat={latitude} lng={longitude} />
                        {hasCoords && (
                            <Marker
                                position={[Number(latitude), Number(longitude)]}
                                icon={defaultIcon}
                            />
                        )}
                    </MapContainer>
                </div>
            </div>

            {hasCoords && (
                <div className="mt-3 space-y-2">
                    <div className="text-sm text-gray-700">
                        <span className="font-medium">Koordinat: </span>
                        <span className="font-mono">
                            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                        </span>
                    </div>

                    <div className="text-sm">
                        {loadingAlamat ? (
                            <span className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Mencari alamat...
                            </span>
                        ) : alamat ? (
                            <span className="flex items-start gap-2 text-green-700">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{alamat}</span>
                            </span>
                        ) : (
                            <span className="flex items-start gap-2 text-amber-600">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                    Alamat tidak ditemukan. Koordinat tetap valid dan bisa
                                    digunakan.
                                </span>
                            </span>
                        )}
                    </div>

                    {gmapsUrl && (
                        <a
                            href={gmapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Buka di Google Maps
                        </a>
                    )}

                    {!confirmed ? (
                        <div className="mt-2 border border-blue-300 bg-blue-50 rounded-md p-3">
                            <p className="text-sm font-medium text-gray-800 mb-3">
                                Apakah lokasi ini sudah benar?
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleKonfirmasi}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Ya, Gunakan Lokasi Ini
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUlangi}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Ulangi
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 flex items-center justify-between gap-3 border border-green-300 bg-green-50 rounded-md p-3">
                            <span className="flex items-center gap-2 text-sm font-medium text-green-800">
                                <CheckCircle2 className="w-4 h-4" />
                                Lokasi dikonfirmasi dan akan disimpan.
                            </span>
                            <button
                                type="button"
                                onClick={handleUlangi}
                                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Ganti
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
