import React, { useState } from "react";
import { Camera, ImageOff, X } from "lucide-react";

export function photoMeta(meta) {
    if (!meta) return null;
    const lat = meta.latitude ?? meta.lat;
    const lng = meta.longitude ?? meta.lng;
    const parts = [];
    if (lat != null && lng != null) parts.push(`${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`);
    if (meta.taken_at) parts.push(new Date(meta.taken_at).toLocaleString("id-ID"));
    return parts.length ? parts.join(" · ") : null;
}

export default function PhotoCard({ label, url, meta, className = "" }) {
    const [zoom, setZoom] = useState(false);
    const metaText = typeof meta === "string" ? meta : photoMeta(meta);

    return (
        <div className={`rounded-lg border border-gray-200 overflow-hidden ${className}`}>
            <p className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-400" />
                {label}
            </p>
            {url ? (
                <button type="button" onClick={() => setZoom(true)} className="block w-full group">
                    <img src={url} alt={label} className="w-full h-56 object-cover group-hover:opacity-90 transition" />
                    {metaText && <p className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50 text-left">{metaText}</p>}
                </button>
            ) : (
                <div className="flex flex-col items-center justify-center h-56 bg-gray-50 text-gray-400">
                    <ImageOff className="w-8 h-8 mb-2" />
                    <p className="text-xs">Tidak ada foto</p>
                </div>
            )}

            {zoom && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setZoom(false)}
                >
                    <button type="button" className="absolute top-4 right-4 text-white" onClick={() => setZoom(false)}>
                        <X className="w-7 h-7" />
                    </button>
                    <img src={url} alt={label} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
