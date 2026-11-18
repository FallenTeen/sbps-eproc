import React from 'react';
import { Head, Link } from '@inertiajs/react';
import HeavyEquipment3D from '@/Components/HeavyEquipment3D';

export default function ErrorPage({ status }) {
    const errorConfig = {
        404: {
            code: 'ERR-404',
            badge: 'AREA BELUM TERPETAKAN',
            title: 'Jalur Akses Tidak Ditemukan',
            description:
                'Titik koordinat atau halaman proyek yang Anda tuju belum dibuka, telah dipindahkan, atau berada di luar area operasional.',
        },
        403: {
            code: 'ERR-403',
            badge: 'ZONA TERBATAS • K3',
            title: 'Akses Area Ditolak',
            description:
                'Anda tidak memiliki otorisasi atau izin keselamatan (Safety Clearance) untuk memasuki modul dan data divisi ini.',
        },
        500: {
            code: 'ERR-500',
            badge: 'GANGGUAN OPERASIONAL SISTEM',
            title: 'Kendala Teknis pada Server',
            description:
                'Terjadi gangguan internal pada mesin server kami. Tim mekanik & IT lapangan sedang melakukan penanganan segera.',
        },
        503: {
            code: 'ERR-503',
            badge: 'UNIT DALAM PERAWATAN',
            title: 'Sistem Sedang Maintenance',
            description:
                'Sistem manajemen armada dan proyek sedang dalam jadwal pemeliharaan berkala. Silakan akses kembali beberapa saat lagi.',
        },
    };

    const current = errorConfig[status] || {
        code: `ERR-${status}`,
        badge: 'PERINGATAN SISTEM',
        title: 'Terjadi Kendala Akses',
        description: 'Sistem mendeteksi gangguan tak terduga saat memuat halaman ini.',
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
            <Head title={`${status} - ${current.title}`} />

            {/* Top Industrial Hazard Stripe */}
            <div
                className="h-2.5 w-full opacity-90"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(-45deg, #f50b0b, #f50b0b 14px, #ffffff 14px, #ffffff 28px)',
                }}
            />

            {/* Technical CAD Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            {/* Ambient Amber Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Content */}
            <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-12 my-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Column */}
                    <div className="lg:col-span-6 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs tracking-wider uppercase">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>{current.badge}</span>
                        </div>

                        <div>
                            <div className="font-mono text-sm text-slate-400 tracking-widest mb-1">
                                SYSTEM DIAGNOSTIC // {current.code}
                            </div>
                            <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-red-300 via-red-500 to-red-700 leading-none">
                                {status}
                            </h1>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            {current.title}
                        </h2>

                        <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                            {current.description}
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-sm tracking-wide uppercase transition-all shadow-lg shadow-red-500/20"
                            >
                                Kembali ke Beranda
                            </Link>

                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm tracking-wide transition-all"
                            >
                                ← Halaman Sebelumnya
                            </button>
                        </div>
                    </div>

                    {/* Right Column: 3D Canvas Tanpa Dependency */}
                    <div className="lg:col-span-6">
                        <div className="relative rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm p-4 shadow-2xl">
                            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500/70" />
                            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500/70" />
                            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500/70" />
                            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500/70" />

                            <div className="flex items-center justify-between gap-3 px-2 pb-2 border-b border-slate-800/80 font-mono text-[11px] text-slate-400">
                                <span className="truncate">UNIT: EXC-320D // HYDRAULIC IDLE</span>
                                <span className="inline-flex shrink-0 items-center gap-2 text-amber-400">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                                    </span>
                                    <span>BEACON ACTIVE</span>
                                </span>
                            </div>

                            <HeavyEquipment3D />
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Industrial Hazard Stripe */}
            <div
                className="h-2.5 w-full opacity-90"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(-45deg, #f50b0b, #f50b0b 14px, #ffffff 14px, #ffffff 28px)',
                }}
            />
        </div>
    );
}