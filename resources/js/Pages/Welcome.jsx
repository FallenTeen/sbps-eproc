import React from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Building2,
    ShieldCheck,
    Truck,
    Factory,
    Users,
    Wallet,
    ShoppingCart,
    FolderKanban,
    ArrowRight,
    CheckCircle2,
    Layers,
    FileText,
    Sparkles,
    Award,
    Zap,
    BarChart3,
} from "lucide-react";

export default function Welcome({
    auth,
    appName = "SBPS OPS/Control",
    laravelVersion,
    phpVersion,
}) {
    // Data fitur utama (hanya 4, ringkas)
    const features = [
        {
            icon: FolderKanban,
            title: "Manajemen Proyek & RAB",
            desc: "Struktur Unit Bisnis → Proyek → Titik. Realisasi RAB on-the-fly tanpa penyimpanan statis.",
        },
        {
            icon: ShoppingCart,
            title: "Procurement & PO Control",
            desc: "Alur PO ketat dengan validasi RAB otomatis & approval matrix per divisi.",
        },
        {
            icon: Truck,
            title: "Fleet & Armada GCS",
            desc: "Ritase harian, sewa alat HM, BBM, downtime, reminder servis, dan payroll borongan.",
        },
        {
            icon: Factory,
            title: "Produksi CBP & AMP",
            desc: "Sesi produksi, mix design/BOM, QC sampling, dan pengiriman molen.",
        },
        {
            icon: Users,
            title: "HR & Payroll 3 Skema",
            desc: "Gaji tetap, harian lembur, dan borongan ritase terintegrasi dengan presensi.",
        },
        {
            icon: Wallet,
            title: "Keuangan & Invoice",
            desc: "Kas per unit, transfer internal, invoice otomatis, dan laporan laba rugi.",
        },
    ];

    return (
        <>
            <Head title={`${appName} — Multi-Unit Business Management`} />

            <div className="min-h-screen bg-white font-sans text-gray-800 selection:bg-red-600 selection:text-white">
                {/* ─── HEADER / NAVBAR ───────────────────────────── */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-red-600/20">
                                S
                            </div>
                            <div>
                                <span className="text-base font-bold text-gray-900">
                                    {appName}
                                </span>
                                <span className="hidden sm:block text-[10px] text-red-500 font-semibold tracking-wide">
                                    Multi-Unit v5
                                </span>
                            </div>
                        </div>

                        {/* Nav Links (Desktop) */}
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                            <a
                                href="#features"
                                className="hover:text-red-600 transition"
                            >
                                Fitur
                            </a>
                            <a
                                href="#about"
                                className="hover:text-red-600 transition"
                            >
                                Tentang
                            </a>
                            <a
                                href="#contact"
                                className="hover:text-red-600 transition"
                            >
                                Kontak
                            </a>
                        </nav>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm shadow-red-600/30"
                                >
                                    <ShieldCheck className="w-4 h-4" />{" "}
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route("login")}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href={route("register")}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition shadow-sm shadow-red-600/30"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ─── HERO SECTION ───────────────────────────────── */}
                <section className="relative overflow-hidden pt-16 pb-20 bg-white">
                    {/* Decorative */}
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-red-500" />
                            <span>Enterprise Multi-Unit System v5</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
                            Kendalikan Seluruh Unit Bisnis <br />
                            <span className="text-red-600">
                                Dalam Satu Platform
                            </span>
                        </h1>

                        <p className="mt-5 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Integrasi penuh untuk Armada (GCS), Batching Plant
                            (CBP), Asphalt Mixing (AMP), serta manajemen proyek,
                            SDM, dan keuangan holding Anda.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <Link
                                href={
                                    auth.user
                                        ? route("dashboard")
                                        : route("register")
                                }
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-600/25 transition transform hover:-translate-y-0.5"
                            >
                                {auth.user
                                    ? "Buka Dashboard"
                                    : "Mulai Sekarang"}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#features"
                                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition"
                            >
                                <Layers className="w-4 h-4 text-red-500" />
                                Lihat Fitur
                            </a>
                        </div>

                        {/* Metrics Bar */}
                        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-2xl font-black text-red-600">
                                    7
                                </p>
                                <p className="text-xs text-gray-500">
                                    Modul Terintegrasi
                                </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-2xl font-black text-red-600">
                                    14
                                </p>
                                <p className="text-xs text-gray-500">
                                    Role & Akses
                                </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-2xl font-black text-red-600">
                                    3
                                </p>
                                <p className="text-xs text-gray-500">
                                    Skema Payroll
                                </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-2xl font-black text-red-600">
                                    100%
                                </p>
                                <p className="text-xs text-gray-500">
                                    Transparansi RAB
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FEATURES SECTION ───────────────────────────── */}
                <section
                    id="features"
                    className="py-16 bg-gray-50/60 border-t border-gray-200"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                                Fitur Unggulan
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                                Apa yang Bisa Dilakukan?
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">
                                Enam modul inti yang menopang operasional
                                holding Anda
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((f, idx) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition hover:border-red-200 group"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition mb-4">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900">
                                            {f.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                            {f.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ─── ABOUT / CTA SECTION ────────────────────────── */}
                <section
                    id="about"
                    className="py-16 bg-white border-t border-gray-200"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 space-y-4">
                                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                                    Tentang Platform
                                </span>
                                <h2 className="text-3xl font-bold text-gray-900">
                                    Dibangun untuk Holding Multi-Unit
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                                    {appName} dirancang spesifik untuk
                                    mengintegrasikan seluruh operasional unit
                                    bisnis Anda — dari armada, produksi, SDM,
                                    hingga keuangan — dalam satu sistem yang
                                    transparan dan real-time.
                                </p>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                                        <span>Realisasi RAB on-the-fly</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                                        <span>Approval matrix per divisi</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                                        <span>
                                            3 skema payroll terintegrasi
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 text-center max-w-md w-full">
                                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                                    <Award className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Siap Mengelola Holding Anda?
                                </h3>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    Akses penuh ke seluruh modul dengan satu
                                    akun terintegrasi.
                                </p>
                                {auth.user ? (
                                    <Link
                                        href={route("dashboard")}
                                        className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                                    >
                                        Buka Dashboard{" "}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
                                        <Link
                                            href={route("login")}
                                            className="px-6 py-2.5 border border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 rounded-lg text-sm font-semibold transition"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href={route("register")}
                                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                                        >
                                            Daftar Sekarang
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FOOTER ───────────────────────────────────────── */}
                <footer
                    id="contact"
                    className="bg-gray-900 text-gray-400 border-t border-gray-800 py-8"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                                {appName}
                            </span>
                            <span>—</span>
                            <span className="text-gray-500">
                                Powered by Laravel {laravelVersion} (PHP{" "}
                                {phpVersion})
                            </span>
                        </div>
                        <p className="text-gray-500">
                            © {new Date().getFullYear()} {appName}. All rights
                            reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
