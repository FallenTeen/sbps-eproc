import React, { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Map as MapIcon, MapPin, X } from 'lucide-react';

// Lazy load Leaflet: JS & tile peta baru dimuat saat dialog pertama kali dibuka
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
    dialogMapHeight = '60vh', // tinggi peta di dalam dialog
    optionFormatter = null,
    name = 'titik_id',
    id = 'titik_id',
}) {
    const [open, setOpen] = useState(false);
    // Pilihan sementara di dalam dialog; baru diterapkan saat klik "Pilih titik ini"
    const [pendingId, setPendingId] = useState('');

    const triggerRef = useRef(null);
    const dialogRef = useRef(null);
    const titleId = `${id}-dialog-title`;

    const pendingTitik = useMemo(
        () => titiks.find((t) => String(t.id) === String(pendingId)) || null,
        [titiks, pendingId]
    );

    const openDialog = () => {
        setPendingId(value || '');
        setOpen(true);
    };

    const closeDialog = useCallback(() => {
        setOpen(false);
        // Kembalikan fokus ke tombol pemicu
        triggerRef.current?.focus();
    }, []);

    const confirmSelection = () => {
        if (!pendingId) return;
        onChange(pendingId);
        closeDialog();
    };

    // Tutup dengan Esc, kunci scroll halaman, dan fokus ke dialog saat terbuka
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeDialog();
        };
        document.addEventListener('keydown', onKeyDown);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        dialogRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, closeDialog]);

    const formatOption = (t) =>
        optionFormatter
            ? optionFormatter(t)
            : `${t.nama}${t.proyek?.nama ? ` (Proyek: ${t.proyek.nama})` : ''}`;

    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Dropdown + tombol buka peta: tinggi & posisi sama seperti input lain */}
            <div className="flex items-stretch gap-2">
                <select
                    id={id}
                    name={name}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className={`min-w-0 flex-1 border rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900 transition-colors ${
                        error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                    } ${selectClassName}`}
                >
                    <option value="">{placeholder}</option>
                    {titiks.map((t) => (
                        <option key={t.id} value={t.id}>
                            {formatOption(t)}
                        </option>
                    ))}
                </select>

                <button
                    ref={triggerRef}
                    type="button"
                    onClick={openDialog}
                    title="Pilih titik lewat peta"
                    aria-label="Pilih titik lewat peta"
                    aria-haspopup="dialog"
                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 transition-colors"
                >
                    <MapIcon className="w-5 h-5" />
                </button>
            </div>

            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}

            {/* Dialog peta: dirender lewat portal ke <body> supaya tidak terpengaruh layout/overflow induk */}
            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={closeDialog}
                            aria-hidden="true"
                        />

                        {/* Panel dialog */}
                        <div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={titleId}
                            tabIndex={-1}
                            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl outline-none sm:rounded-xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                                <div className="min-w-0">
                                    <h2 id={titleId} className="text-base font-bold text-gray-900">
                                        Pilih {label ? label.toLowerCase() : 'titik'} lewat peta
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {titiks.length > 0
                                            ? `${titiks.length} titik tersedia`
                                            : 'Belum ada titik tersedia'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    aria-label="Tutup"
                                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="space-y-3 overflow-y-auto p-4">
                                {/* Ringkasan pilihan sementara */}
                                <div className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        <MapPin className="w-4 h-4 shrink-0 text-gray-900" />
                                        {pendingTitik ? (
                                            <span className="truncate">
                                                <strong className="font-bold text-gray-900">
                                                    {pendingTitik.nama}
                                                </strong>
                                                {pendingTitik.proyek?.nama && (
                                                    <span className="text-gray-500">
                                                        {' '}
                                                        ({pendingTitik.proyek.nama})
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="italic text-gray-500">
                                                Klik salah satu marker pada peta untuk memilih.
                                            </span>
                                        )}
                                    </div>
                                    {pendingTitik && (
                                        <button
                                            type="button"
                                            onClick={() => setPendingId('')}
                                            className="shrink-0 text-xs font-medium text-red-600 underline hover:text-red-800"
                                        >
                                            Batal pilih
                                        </button>
                                    )}
                                </div>

                                {/* Peta. `isolate` menjaga z-index internal Leaflet tetap di dalam kotak ini */}
                                <div className="isolate overflow-hidden rounded-md">
                                    <Suspense
                                        fallback={
                                            <div
                                                className="flex items-center justify-center rounded-md border-2 border-black bg-gray-100 text-sm text-gray-500"
                                                style={{ height: dialogMapHeight }}
                                            >
                                                Memuat peta...
                                            </div>
                                        }
                                    >
                                        <PetaTitikProyek
                                            titiks={titiks}
                                            selectedTitikId={pendingId}
                                            onMarkerClick={(titikId) => setPendingId(titikId)}
                                            height={dialogMapHeight}
                                            showDetailButton={true}
                                        />
                                    </Suspense>
                                </div>

                                <p className="text-[11px] text-gray-500">
                                    Tip: marker hitam menandakan titik yang sedang dipilih.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmSelection}
                                    disabled={!pendingId}
                                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Pilih titik ini
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
