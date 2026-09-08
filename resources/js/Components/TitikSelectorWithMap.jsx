import React, { useState, useMemo, lazy, Suspense } from 'react';
import { List, Map, MapPin } from 'lucide-react';

// Lazy load Leaflet component agar tidak memuat tile / JS peta saat tab Daftar aktif
const PetaTitikProyek = lazy(() => import('@/Components/PetaTitikProyek'));

export default function TitikSelectorWithMap({
    titiks = [],
    value = '',
    onChange = () => {},
    label = 'Titik Lokasi',
    placeholder = '-- Pilih Titik --',
    error = null,
    required = false,
    className = '',
    selectClassName = '',
    mapHeight = '320px',
    optionFormatter = null,
    name = 'titik_id',
    id = 'titik_id'
}) {
    // Mode tampilan: 'daftar' (dropdown standar) atau 'peta' (interaktif Leaflet)
    const [viewMode, setViewMode] = useState('daftar');

    const selectedTitik = useMemo(() => {
        return titiks.find(t => String(t.id) === String(value)) || null;
    }, [titiks, value]);

    const handleMarkerSelect = (titikId) => {
        onChange(titikId);
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Header: Label dan Toggle Tab Daftar vs Peta */}
            <div className="flex items-center justify-between">
                {label && (
                    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                )}

                <div className="inline-flex rounded-md border border-gray-300 p-0.5 bg-gray-100 text-xs">
                    <button
                        type="button"
                        onClick={() => setViewMode('daftar')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                            viewMode === 'daftar'
                                ? 'bg-white text-black shadow-sm font-bold border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Tampilkan pilihan sebagai dropdown daftar"
                    >
                        <List className="w-3.5 h-3.5" />
                        Daftar
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('peta')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                            viewMode === 'peta'
                                ? 'bg-black text-white shadow-sm font-bold'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Tampilkan dan pilih titik lewat peta interaktif"
                    >
                        <Map className="w-3.5 h-3.5" />
                        Peta
                    </button>
                </div>
            </div>

            {/* Tab 1: Dropdown Daftar (selalu ada di DOM untuk form submit, ditampilkan jika viewMode = 'daftar') */}
            {viewMode === 'daftar' && (
                <div>
                    <select
                        id={id}
                        name={name}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={required}
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black transition-colors ${
                            error ? 'border-red-500 ring-1 ring-red-500' : ''
                        } ${selectClassName}`}
                    >
                        <option value="">{placeholder}</option>
                        {titiks.map((t) => {
                            const optionText = optionFormatter
                                ? optionFormatter(t)
                                : `${t.nama}${t.proyek?.nama ? ` (Proyek: ${t.proyek.nama})` : ''}`;

                            return (
                                <option key={t.id} value={t.id}>
                                    {optionText}
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}

            {/* Tab 2: Peta Interaktif (Lazy render jika viewMode = 'peta') */}
            {viewMode === 'peta' && (
                <div className="space-y-2">
                    {/* Ringkasan Titik Terpilih saat di mode peta */}
                    <div className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 px-3 py-2 rounded">
                        <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-4 h-4 text-black shrink-0" />
                            {selectedTitik ? (
                                <span className="truncate">
                                    Titik terpilih: <strong className="text-gray-900 font-bold">{selectedTitik.nama}</strong>
                                    {selectedTitik.proyek?.nama && (
                                        <span className="text-gray-500"> ({selectedTitik.proyek.nama})</span>
                                    )}
                                </span>
                            ) : (
                                <span className="text-gray-500 italic">Klik salah satu marker titik pada peta untuk memilih.</span>
                            )}
                        </div>

                        {selectedTitik && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="text-xs text-red-600 hover:text-red-800 font-medium ml-2 shrink-0 underline"
                            >
                                Reset Pilihan
                            </button>
                        )}
                    </div>

                    <Suspense
                        fallback={
                            <div
                                className="flex items-center justify-center bg-gray-100 border-2 border-black rounded-md text-sm text-gray-500"
                                style={{ height: mapHeight }}
                            >
                                Memuat peta Leaflet...
                            </div>
                        }
                    >
                        <PetaTitikProyek
                            titiks={titiks}
                            selectedTitikId={value}
                            onMarkerClick={handleMarkerSelect}
                            height={mapHeight}
                            showDetailButton={true}
                        />
                    </Suspense>

                    {/* Sinkronisasi info di bawah peta */}
                    <div className="text-[11px] text-gray-500 flex items-center justify-between">
                        <span>Tip: Marker hitam menandakan titik yang sedang dipilih.</span>
                        {titiks.length > 0 && <span>{titiks.length} titik tersedia</span>}
                    </div>
                </div>
            )}

            {/* Tampilkan pesan error validasi jika ada */}
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
    );
}
