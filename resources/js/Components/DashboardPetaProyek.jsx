import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Link } from '@inertiajs/react';
import {
    Map, List, MapPin, Building2, Users, Truck,
    ExternalLink, CheckCircle2, Filter, Layers, Navigation
} from 'lucide-react';

const PetaTitikProyek = lazy(() => import('@/Components/PetaTitikProyek'));

export default function DashboardPetaProyek({
    titiks = [],
    proyeks = [],
    className = ''
}) {
    const [selectedProyekId, setSelectedProyekId] = useState('');
    const [selectedTitikId, setSelectedTitikId] = useState('');
    const [viewMode, setViewMode] = useState('peta'); // 'peta' | 'daftar'

    // Filter titik berdasarkan proyek yang dipilih
    const filteredTitiks = useMemo(() => {
        if (!selectedProyekId) return titiks;
        return titiks.filter(t => String(t.proyek_id) === String(selectedProyekId));
    }, [titiks, selectedProyekId]);

    // Titik yang sedang aktif dipilih
    const activeTitik = useMemo(() => {
        if (!selectedTitikId) return null;
        return titiks.find(t => String(t.id) === String(selectedTitikId)) || null;
    }, [titiks, selectedTitikId]);

    // Proyek yang sedang aktif dipilih atau proyek dari titik yang dipilih
    const activeProyek = useMemo(() => {
        if (selectedProyekId) {
            return proyeks.find(p => String(p.id) === String(selectedProyekId)) || null;
        }
        if (activeTitik?.proyek_id) {
            return proyeks.find(p => String(p.id) === String(activeTitik.proyek_id)) || null;
        }
        return null;
    }, [proyeks, selectedProyekId, activeTitik]);

    // Summary statistics
    const stats = useMemo(() => {
        const totalProyek = proyeks.length;
        const totalTitik = filteredTitiks.length;
        const totalSdm = filteredTitiks.reduce((acc, t) => acc + (t.sdm_count || 0), 0);
        const totalArmada = filteredTitiks.reduce((acc, t) => acc + (t.armada_count || 0), 0);

        return { totalProyek, totalTitik, totalSdm, totalArmada };
    }, [proyeks, filteredTitiks]);

    const handleProyekChange = (proyekId) => {
        setSelectedProyekId(proyekId);
        // Reset titik jika titik terpilih tidak berada pada proyek yang baru dipilih
        if (proyekId && activeTitik && String(activeTitik.proyek_id) !== String(proyekId)) {
            setSelectedTitikId('');
        }
    };

    const handleMarkerClick = (titikId, titikData) => {
        setSelectedTitikId(titikId);
        if (titikData?.proyek_id && !selectedProyekId) {
            // Optional sync if not filtered
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 ${className}`}>
            {/* Header Bagian Peta & Monitoring */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Map className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Monitoring Peta Sebaran Proyek & Titik</h3>
                            <p className="text-xs text-gray-500">Pantau lokasi geografis, kesiapan SDM, dan armada di setiap titik kerja</p>
                        </div>
                    </div>
                </div>

                {/* Toggle Mode: Peta vs Daftar */}
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 text-xs self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode('peta')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                            viewMode === 'peta'
                                ? 'bg-black text-white shadow font-bold'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Map className="w-3.5 h-3.5" />
                        Peta Interaktif
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('daftar')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                            viewMode === 'daftar'
                                ? 'bg-black text-white shadow font-bold'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <List className="w-3.5 h-3.5" />
                        Daftar Titik ({filteredTitiks.length})
                    </button>
                </div>
            </div>

            {/* Filter Bar: Dropdown Pilih Proyek & Dropdown Pilih Titik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-500" />
                        Filter Proyek
                    </label>
                    <select
                        value={selectedProyekId}
                        onChange={(e) => handleProyekChange(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black bg-white shadow-sm"
                    >
                        <option value="">Semua Proyek ({proyeks.length})</option>
                        {proyeks.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama} {p.status ? `(${p.status})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        Fokus Titik Lokasi
                    </label>
                    <select
                        value={selectedTitikId}
                        onChange={(e) => setSelectedTitikId(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black bg-white shadow-sm"
                    >
                        <option value="">-- Pilih Titik untuk Zoom / Highlight --</option>
                        {filteredTitiks.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nama} {t.proyek_nama ? `— ${t.proyek_nama}` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quick Metric Badges */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
                    <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center flex-1 md:flex-initial">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Titik Terpantau</p>
                        <p className="text-base font-extrabold text-gray-900">{stats.totalTitik}</p>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center flex-1 md:flex-initial">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">SDM Lapangan</p>
                        <p className="text-base font-extrabold text-indigo-600">{stats.totalSdm}</p>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center flex-1 md:flex-initial">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Armada Aktif</p>
                        <p className="text-base font-extrabold text-blue-600">{stats.totalArmada}</p>
                    </div>
                </div>
            </div>

            {/* Konten Utama: Mode Peta atau Mode Daftar */}
            {viewMode === 'peta' ? (
                <div className="space-y-4">
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center bg-gray-100 border-2 border-black rounded-xl text-sm text-gray-500 h-[450px]">
                                Memuat peta monitoring Leaflet...
                            </div>
                        }
                    >
                        <PetaTitikProyek
                            titiks={filteredTitiks}
                            selectedTitikId={selectedTitikId}
                            onMarkerClick={handleMarkerClick}
                            height="450px"
                            className="rounded-xl shadow-sm border-2 border-black"
                            showDetailButton={true}
                        />
                    </Suspense>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTitiks.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            Tidak ada titik kerja yang sesuai dengan filter proyek ini.
                        </div>
                    ) : (
                        filteredTitiks.map((titik) => {
                            const isSelected = String(titik.id) === String(selectedTitikId);
                            return (
                                <div
                                    key={titik.id}
                                    onClick={() => {
                                        setSelectedTitikId(titik.id);
                                        setViewMode('peta');
                                    }}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                        isSelected
                                            ? 'border-black bg-indigo-50/50 ring-2 ring-black shadow-md'
                                            : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900">{titik.nama}</h4>
                                            <p className="text-xs text-gray-600 mt-0.5">{titik.proyek_nama || '-'}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                            titik.status === 'nonaktif'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                        }`}>
                                            {titik.status || 'aktif'}
                                        </span>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>{titik.sdm_count || 0} SDM</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Truck className="w-3.5 h-3.5 text-blue-500" />
                                            <span>{titik.armada_count || 0} Armada</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                        <span className="font-mono">
                                            {Number(titik.latitude).toFixed(4)}, {Number(titik.longitude).toFixed(4)}
                                        </span>
                                        <span className="font-medium text-blue-600 hover:underline inline-flex items-center gap-0.5">
                                            Buka di Peta <Navigation className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Detail Panel Card ketika ada Titik atau Proyek yang Dipilih */}
            {(activeTitik || activeProyek) && (
                <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                                    {activeTitik ? 'Detail Titik Terpilih' : 'Detail Proyek Terpilih'}
                                </span>
                                {activeProyek?.kode_proyek && (
                                    <span className="text-xs text-slate-400 font-mono">
                                        [{activeProyek.kode_proyek}]
                                    </span>
                                )}
                            </div>
                            <h4 className="text-lg font-bold text-white">
                                {activeTitik ? `${activeTitik.nama} — ${activeTitik.proyek_nama || '-'}` : activeProyek?.nama}
                            </h4>
                            <p className="text-xs text-slate-400">
                                {activeProyek?.client ? `Client: ${activeProyek.client}` : ''}
                                {activeProyek?.lokasi ? ` • Lokasi: ${activeProyek.lokasi}` : ''}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeTitik && typeof route === 'function' && (
                                <Link
                                    href={route('core.titik.show', activeTitik.id)}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Lihat Detail Titik
                                </Link>
                            )}

                            {activeProyek && typeof route === 'function' && (
                                <Link
                                    href={route('core.proyek.show', activeProyek.id)}
                                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                                >
                                    <Building2 className="w-3.5 h-3.5" />
                                    Kelola Proyek Ini
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
