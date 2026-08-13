import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Building2, ShieldCheck, Truck, Factory, Users, Wallet, ShoppingCart,
    FolderKanban, ArrowRight, CheckCircle2, ChevronRight, BookOpen, Presentation,
    Award, BarChart3, Clock, DollarSign, Layers, FileText, Search, Play,
    Check, Sparkles, AlertCircle, HelpCircle, Lock
} from 'lucide-react';

export default function Welcome({ auth, appName = 'SBPS OPS/Control', laravelVersion, phpVersion }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [manualSection, setManualSection] = useState('bab1');
    const [manualSearch, setManualSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('Owner');

    // System Modules Data
    const modules = [
        {
            id: 'core',
            title: 'Core Proyek & RAB',
            icon: FolderKanban,
            color: 'from-blue-600 to-indigo-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            desc: 'Struktur hirarki Unit Bisnis → Proyek → Titik Lokasi. Kalkulasi realisasi RAB dilakukan on-the-fly dari akumulasi PO, ritase, produksi, dan gaji.',
            features: [
                'Manajemen Unit Bisnis (GCS, CBP, AMP, Kontraktor)',
                'Pemetaan Titik Lokasi dengan koordinat GPS',
                'Penyusunan RAB (Material, Sewa Alat, Upah, Overhead)',
                'Perbandingan Realisasi RAB vs Rencana Anggaran Real-time',
                'Penguncian RAB otomatis pada proses Procurement'
            ]
        },
        {
            id: 'procurement',
            title: 'Procurement & PO Control',
            icon: ShoppingCart,
            color: 'from-orange-500 to-amber-600',
            textColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
            desc: 'Alur PO ketat: Draft → Submit (Validasi RAB) → Approval Matrix → Receive (Stok Bertambah) → Pay (Kas Berkurang).',
            features: [
                'Batas Approval PO Granular per Ketua Divisi (20jt - 50jt)',
                'Owner Overrule untuk PO melebihi plafon RAB',
                'Pengecualian PO Sparepart dari RAB (Keputusan Final #1)',
                'Pencatatan Stok Bahan Baku & Price List Supplier',
                'Penyelesaian Pembayaran Internal & Eksternal'
            ]
        },
        {
            id: 'fleet',
            title: 'Fleet & GCS (Armada & Alat)',
            icon: Truck,
            color: 'from-emerald-600 to-teal-600',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            desc: 'Pengelolaan armada dump truck, molen & alat berat. Pencatatan ritase harian, sewa alat HM, log BBM, downtime, dan reminder servis.',
            features: [
                'Log Ritase Harian dengan snapshot tarif rute otomatis',
                'Pencatatan Sewa Alat Berat berbasis HM (Jam Mesin)',
                'Manajemen Checklist Harian kondisi fisik armada',
                'Monitoring BBM & Durasi Downtime Per-Unit',
                'Integrasi otomatis ke Payroll Driver Borongan Rit'
            ]
        },
        {
            id: 'production',
            title: 'Produksi (CBP & AMP)',
            icon: Factory,
            color: 'from-purple-600 to-indigo-600',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            desc: 'Pengendalian operasional Batching Plant Concrete (CBP) dan Hotmix Asphalt (AMP) dari resep BOM hingga pengiriman.',
            features: [
                'Sesi Produksi Batching Plant & Asphalt Mix',
                'Mix Design / Bill of Materials (BOM) pemakaian bahan baku',
                'Sampling Quality Control (QC) & Pengujian Mutu',
                'Pengiriman Truck Molen / Dump Truck',
                'Otomatisasi pemotongan stok bahan baku & perhitungan HPP'
            ]
        },
        {
            id: 'hr',
            title: 'HR & Payroll 3-Skema',
            icon: Users,
            color: 'from-rose-600 to-pink-600',
            textColor: 'text-rose-600',
            bgColor: 'bg-rose-50',
            desc: 'Sistem pengupahan fleksibel mendukung 3 skema kerja industri konstruksi & manufaktur.',
            features: [
                'Skema Gaji Tetap (Bulanan)',
                'Skema Gaji Harian (Presensi & Jam Lembur)',
                'Skema Borongan Rit (Otomatis dari Akumulasi Ritase)',
                'Pengelolaan Presensi, Overtime, dan Pengajuan Cuti',
                'Formulir Pajak NPWP, PTKP & BPJS Kesehatan/Ketenagakerjaan'
            ]
        },
        {
            id: 'finance',
            title: 'Keuangan & Invoice',
            icon: Wallet,
            color: 'from-cyan-600 to-blue-600',
            textColor: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            desc: 'Konsolidasi keuangan holding, kas per divisi, invoicing unit bisnis, hingga Laporan Laba Rugi.',
            features: [
                'Manajemen Rekening Kas & Bank per Unit Bisnis',
                'Transfer Internal antar Kas & Rekonsiliasi Mutasi',
                'Generate Invoice dari Sesi Produksi, Ritase, & Sewa Alat',
                'Pelacakan Piutang Klien & Kartu Piutang',
                'Laporan Konsolidasi Laba Rugi & Perbandingan RAB'
            ]
        }
    ];

    // Manual Book Content
    const manualSections = [
        {
            id: 'bab1',
            title: 'Bab 1: Pendahuluan & Arsitektur System',
            content: `
### 1.1 Latar Belakang & Tujuan
Aplikasi **${appName}** dirancang khusus untuk mengintegrasikan seluruh operasional usaha holding yang memiliki multi-unit bisnis:
1. **Unit GCS (Galian C & Support Armada)** — Pengelolaan armada, ritase, dan sewa alat berat.
2. **Unit CBP (Concrete Batching Plant)** — Produksi beton ready-mix, mix design, dan pengiriman molen.
3. **Unit AMP (Asphalt Mixing Plant)** — Produksi hotmix asphalt dan QC pengaspalan.
4. **Unit Kontraktor / Eksternal** — Pengawasan proyek kontrak klien dan portal invoice.

### 1.2 Arsitektur Sistem
Sistem menggunakan pendekatan **Domain-Driven Design (DDD)** yang membagi modul berdasarkan batas konteks (*bounded context*). Seluruh kalkulasi Realisasi RAB dihitung **on-the-fly** untuk menjamin data selalu mutakhir (*real-time*).
            `
        },
        {
            id: 'bab2',
            title: 'Bab 2: Manajemen Proyek, Titik & RAB',
            content: `
### 2.1 Struktur Hirarki Data
- **Unit Bisnis**: Entitas induk pemilik proyek atau penyedia armada/alat.
- **Proyek**: Kontrak pekerjaan dengan klien atau proyek internal holding.
- **Titik Lokasi**: Area spesifik tempat operasional berlangsung (misal: Quarry A, Titik Km 12).
- **RAB (Rencana Anggaran Biaya)**: Dokumen anggaran Biaya Bahan Baku, Sewa Alat, Upah, dan Overhead.

### 2.2 Aturan Validasi RAB
- Setiap pengajuan Procurement PO bahan baku akan divalidasi secara otomatis terhadap sisa kuota RAB proyek.
- Jika nominal PO melebihi sisa RAB, pengajuan ditolak sistem kecuali disetujui langsung oleh **Owner** (Owner Overrule).
- PO Sparepart armada **dikecualikan** dari validasi RAB proyek.
            `
        },
        {
            id: 'bab3',
            title: 'Bab 3: Alur Procurement & Matriks Approval',
            content: `
### 3.1 Siklus Purchase Order (PO)
1. **Draft**: Pembuatan PO oleh Procurement Officer.
2. **Submit**: Pengecekan sisa RAB & penguncian status.
3. **Approval Matrix**:
   - PO Armada (Sparepart): Limit Rp 25.000.000 (Ketua Divisi Armada).
   - PO Bahan Baku Produksi: Limit Rp 20.000.000 (Ketua Divisi Produksi).
   - PO Kontrak: Limit Rp 30.000.000 (Ketua Divisi Kontraktor).
   - PO Keuangan Umum: Limit Rp 50.000.000 (Ketua Divisi Keuangan).
   - PO di atas limit / over-budget: Wajib Approval **Owner**.
4. **Receive**: Penerimaan barang di gudang → Stok bertambah otomatis.
5. **Payment**: Pembayaran oleh Admin Keuangan → Mutasi kas berkurang.
            `
        },
        {
            id: 'bab4',
            title: 'Bab 4: Operasional Fleet, Ritase & Sewa Alat',
            content: `
### 4.1 Pencatatan Ritase
- Setiap pengiriman material dicatat berdasarkan rute perjalanan (` + '`RuteTarif`' + `).
- Sistem mengambil *snapshot* tarif rute pada saat penginputan untuk mencegah perubahan data historis jika tarif rute diperbarui di kemudian hari.
- Total upah borongan ritase dihitung dari: ` + '`Jumlah Rit × Tarif Snapshot`' + `.

### 4.2 Sewa Alat Berat (HM)
- Pencatatan dilakukan berdasarkan Jam Mesin (HM Awal & HM Akhir).
- Pendapatan sewa dihitung otomatis dari total jam kerja dikali tarif/HM snapshot.
- Sistem memberikan peringatan dini jika armada/alat belum melakukan servis rutin dalam 90 hari.
            `
        },
        {
            id: 'bab5',
            title: 'Bab 5: Produksi CBP & AMP',
            content: `
### 5.1 Mix Design & Pengurangan Stok
- Setiap formula beton (CBP) atau hotmix (AMP) menggunakan ` + '`MixDesign`' + ` (BOM).
- Ketika sesi produksi diselesaikan, stok bahan baku (Semen, Pasir, Split, Bitumen, Additive) akan terpotong secara otomatis sesuai takaran porsi produksi.

### 5.2 QC & Pengiriman
- Sampel QC dicatat per batch produksi untuk pengujian kuat tekan / slump test.
- Surat jalan pengiriman molen/dump truck langsung terhubung dengan laporan realisasi harian.
            `
        },
        {
            id: 'bab6',
            title: 'Bab 6: SDM & Skema Payroll',
            content: `
### 6.1 Tiga Skema Pengupahan
1. **Tetap (Bulanan)**: Menerima Gaji Pokok bulanan tetap + tunjangan.
2. **Harian**: Dihitung dari jumlah hari presensi masuk × rate harian + jam lembur.
3. **Borongan Rit**: Akumulasi nilai upah ritase dari log pengiriman armada selama periode payroll.

### 6.2 Formulir Administrasi Karyawan
- Pencatatan NPWP, Status PTKP (TK/0, K/1, dst.), No BPJS Kesehatan, dan No BPJS Ketenagakerjaan untuk pelaporan SPT & klaim jaminan.
            `
        },
        {
            id: 'bab7',
            title: 'Bab 7: Konsolidasi Keuangan & Invoice',
            content: `
### 7.1 Pembukuan Kas & Bank
- Setiap unit bisnis memegang rekening kas/bank tersendiri.
- Mutasi antar rekening dilakukan melalui fitur ` + '`TransferKas`' + ` dengan approval penerima.

### 7.2 Invoicing Unit Bisnis
- Invoice ditagihkan ke klien berdasarkan 3 sumber tagihan:
  1. Sesi Produksi CBP/AMP.
  2. Ritase Armada GCS.
  3. Sewa Alat Berat (HM).
- Rekapitulasi Piutang Klien menyajikan kartu umur piutang (*Aging Receivables*).
            `
        },
        {
            id: 'bab8',
            title: 'Bab 8: Matriks 14 Role & Wewenang Akses',
            content: `
### 8.1 Daftar Hak Akses Granular
- **Owner**: Akses Super Admin menyeluruh + bypass approval & overrule RAB.
- **Admin Keuangan**: Pembayaran PO, pencatatan kas, invoice & konsolidasi laba rugi.
- **Ketua Divisi (5 Roles)**: Otorisasi operasional & approval PO sesuai limit divisi.
- **Koordinator (5 Roles)**: Pengelolaan input operasional harian (Armada, CBP, AMP, Procurement, SDM).
- **Mandor Proyek / Titik**: Monitoring proyek, presensi & formulir lapangan.
- **Mitra Kontraktor**: Portal read-only invoice & log komunikasi eksternal.
            `
        }
    ];

    // Role Sandbox Options
    const roleProfiles = {
        Owner: {
            title: 'Owner / Direktur Utama',
            desc: 'Akses penuh ke seluruh unit bisnis, dashboard eksekutif, peta titik operasional, serta wewenang bypass PO over-budget.',
            permissions: ['View Owner Dashboard', 'Approve All PO', 'Manage All Units', 'RAB Overrule', 'Konsolidasi Keuangan']
        },
        'Admin Keuangan': {
            title: 'Admin Keuangan Holding',
            desc: 'Mengelola transaksi kas/bank, pembayaran PO supplier, penagihan invoice klien, dan pengolahan laporan laba rugi.',
            permissions: ['Manage Finance', 'Pay Approved PO', 'Generate Invoice', 'Manage Kas & Bank']
        },
        'Ketua Divisi Armada': {
            title: 'Ketua Divisi Armada (GCS)',
            desc: 'Memimpin operasional armada dump truck & alat berat, approval PO sparepart max 25jt, dan evaluasi performa ritase.',
            permissions: ['Manage Fleet', 'Approve Fleet PO (≤25M)', 'View Proyek', 'Monitor Servis Armada']
        },
        'Koordinator CBP': {
            title: 'Koordinator Plant CBP',
            desc: 'Mengontrol sesi produksi beton ready-mix, pemakaian mix design (BOM), QC slump test, dan pengiriman molen.',
            permissions: ['Manage Production CBP', 'Record Batching', 'Manage Mix Design', 'QC Sampling']
        },
        'Kontraktor': {
            title: 'Mitra Kontraktor Klien',
            desc: 'Portal khusus mitra eksternal untuk memantau progres produksi, ringkasan RAB agregat, invoice, dan log komunikasi.',
            permissions: ['View Proyek Kontrak', 'Read-only Invoices', 'Post Log Komunikasi']
        }
    };

    const filteredManual = manualSections.filter(s =>
        s.title.toLowerCase().includes(manualSearch.toLowerCase()) ||
        s.content.toLowerCase().includes(manualSearch.toLowerCase())
    );

    return (
        <>
            <Head title={`Landing & Manual Book — ${appName}`} />

            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">

                {/* ─── TOP NAVIGATION BAR ─────────────────────────────────────── */}
                <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/30">
                                S
                            </div>
                            <div>
                                <span className="text-lg font-extrabold tracking-tight text-white">{appName}</span>
                                <span className="hidden sm:block text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Enterprise Multi-Unit System v5</span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-3.5 py-2 rounded-lg transition ${activeTab === 'overview' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold' : 'hover:bg-slate-800/60 hover:text-white'}`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('modules')}
                                className={`px-3.5 py-2 rounded-lg transition ${activeTab === 'modules' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold' : 'hover:bg-slate-800/60 hover:text-white'}`}
                            >
                                Fitur & Modul
                            </button>
                            <button
                                onClick={() => setActiveTab('pitch')}
                                className={`px-3.5 py-2 rounded-lg transition ${activeTab === 'pitch' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold' : 'hover:bg-slate-800/60 hover:text-white'}`}
                            >
                                <Presentation className="w-4 h-4 inline mr-1 text-amber-400" /> Pitch Deck
                            </button>
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={`px-3.5 py-2 rounded-lg transition ${activeTab === 'manual' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold' : 'hover:bg-slate-800/60 hover:text-white'}`}
                            >
                                <BookOpen className="w-4 h-4 inline mr-1 text-blue-400" /> Manual Book (v5)
                            </button>
                        </nav>

                        {/* Action CTA */}
                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
                                >
                                    <ShieldCheck className="w-4 h-4" /> Buka Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
                                    >
                                        Masuk System <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ─── HERO BANNER SECTION ───────────────────────────────────── */}
                <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/60">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span>System Architecture v5.0 — Multi-Unit Enterprise Suite</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                            Pengendalian Terpadu <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                                Realisasi RAB, Fleet & Produksi Holding
                            </span>
                        </h1>

                        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Platform terintegrasi untuk mengendalikan operasional <strong>Armada (GCS)</strong>, <strong>Batching Plant (CBP)</strong>, <strong>Hotmix (AMP)</strong>, serta <strong>Portal Kontraktor</strong> secara real-time tanpa kebocoran anggaran.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => setActiveTab('pitch')}
                                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/25 transition transform hover:-translate-y-0.5"
                            >
                                <Presentation className="w-4 h-4" /> Lihat Pitch Deck Eksekutif
                            </button>
                            <button
                                onClick={() => setActiveTab('manual')}
                                className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-bold text-sm transition"
                            >
                                <BookOpen className="w-4 h-4 text-blue-400" /> Buka Manual Book v5
                            </button>
                        </div>

                        {/* Metrics Bar */}
                        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
                            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                                <p className="text-3xl font-black text-indigo-400">7 Module</p>
                                <p className="text-xs text-slate-400 mt-1">Core, Fleet, Production, HR, Procurement, Finance, Kontraktor</p>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                                <p className="text-3xl font-black text-emerald-400">14 Roles</p>
                                <p className="text-xs text-slate-400 mt-1">Owner, Admin, 5 Ketua Divisi, Mandor, Driver, Kontraktor</p>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                                <p className="text-3xl font-black text-amber-400">0% Leakage</p>
                                <p className="text-xs text-slate-400 mt-1">Penguncian RAB Otomatis saat Submit Purchase Order</p>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                                <p className="text-3xl font-black text-purple-400">3 Skema</p>
                                <p className="text-xs text-slate-400 mt-1">Payroll Tetap, Harian Lembur, dan Borongan Ritase</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── MAIN TABS CONTENT AREA ────────────────────────────────── */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                    {/* TAB 1: OVERVIEW & ARCHITECTURE */}
                    {activeTab === 'overview' && (
                        <div className="space-y-16">
                            {/* Value Proposition */}
                            <div>
                                <div className="text-center max-w-2xl mx-auto mb-12">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Mengapa {appName}?</h2>
                                    <p className="text-sm text-slate-400 mt-2">
                                        Dirancang spesifik untuk memecahkan kompleksitas pengelolaan multi-unit bisnis dalam satu holding terintegrasi.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Real-Time RAB Realisasi</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Realisasi RAB dihitung secara dinamis dari transaksi PO yang diterima, log ritase, produksi batch, dan payroll karyawan tanpa penyimpan statis.
                                        </p>
                                    </div>

                                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Armada & Sewa Alat HM</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Snapshot tarif rute otomatis mengunci upah ritase driver. Jam Mesin (HM) alat berat terpantau akurat dengan pemicu pengingat jadwal servis.
                                        </p>
                                    </div>

                                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Approval Limit Granular</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Otorisasi bertingkat sesuai batas kewenangan Ketua Divisi (20jt - 50jt) serta hak Istimewa Owner untuk pembatalan over-budget.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Role Sandbox Preview */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Pratinjau Hak Akses Role (14 Roles)</h3>
                                        <p className="text-xs text-slate-400 mt-1">Pilih role di bawah ini untuk melihat cakupan hak akses dalam sistem</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(roleProfiles).map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setSelectedRole(r)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedRole === r ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {roleProfiles[selectedRole] && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1 space-y-3">
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Profil Jabatan</span>
                                            <h4 className="text-lg font-bold text-white">{roleProfiles[selectedRole].title}</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">{roleProfiles[selectedRole].desc}</p>
                                        </div>

                                        <div className="md:col-span-2 space-y-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cakupan Otoritas System</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {roleProfiles[selectedRole].permissions.map((p, idx) => (
                                                    <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                        <span>{p}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: MODULES DETAILED BREAKDOWN */}
                    {activeTab === 'modules' && (
                        <div className="space-y-12">
                            <div className="text-center max-w-2xl mx-auto">
                                <h2 className="text-3xl font-bold text-white">Modul & Kapabilitas Utama</h2>
                                <p className="text-sm text-slate-400 mt-2">Penjelasan komprehensif 6 modul inti penopang operasional holding</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {modules.map((m) => {
                                    const Icon = m.icon;
                                    return (
                                        <div key={m.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${m.color} text-white shadow-lg`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white">{m.title}</h3>
                                                        <span className={`text-[11px] font-semibold ${m.textColor}`}>Domain Module</span>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-400 leading-relaxed mb-5">{m.desc}</p>

                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fitur Inti:</p>
                                                    {m.features.map((f, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                            <span>{f}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-800">
                                                <Link href={route('login')} className="flex items-center justify-between text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                                                    <span>Buka Modul {m.title}</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PITCH DECK FOR EXECUTIVES */}
                    {activeTab === 'pitch' && (
                        <div className="space-y-12">
                            <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 text-center max-w-3xl mx-auto space-y-4">
                                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">Executive Presentation</span>
                                <h2 className="text-3xl font-black text-white">Presentasi Pitching Direksi</h2>
                                <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                                    Transformasi Digital Pengendalian Multi-Unit Bisnis Kontraktor & Transportasi Berbasis Data Terintegrasi.
                                </p>
                            </div>

                            {/* Challenges vs Solutions Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-slate-900 border border-red-900/40 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                        <AlertCircle className="w-5 h-5" /> Tantangan Operasional Sebelum {appName}
                                    </div>
                                    <ul className="space-y-3 text-xs text-slate-400">
                                        <li className="p-3 bg-red-950/30 rounded-xl border border-red-900/30">
                                            ❌ <strong>Pembengkakan Anggaran RAB:</strong> Purchase Order bahan baku sering diterbitkan tanpa pengecekan sisa anggaran RAB proyek.
                                        </li>
                                        <li className="p-3 bg-red-950/30 rounded-xl border border-red-900/30">
                                            ❌ <strong>Sewa Alat & Ritase Tidak Valid:</strong> Pengisian trip driver borongan & jam kerja alat berat rawan klaim ganda.
                                        </li>
                                        <li className="p-3 bg-red-950/30 rounded-xl border border-red-900/30">
                                            ❌ <strong>Lambatnya Laporan Laba Rugi:</strong> Konsolidasi laporan kas holding memakan waktu berminggu-minggu secara manual.
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-slate-900 border border-emerald-900/40 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                        <CheckCircle2 className="w-5 h-5" /> Solusi & Dampak Strategis {appName}
                                    </div>
                                    <ul className="space-y-3 text-xs text-slate-300">
                                        <li className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/30">
                                            ✅ <strong>Penguncian Anggaran Otomatis:</strong> Sistem menolak PO yang melebihi RAB proyek secara otomatis.
                                        </li>
                                        <li className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/30">
                                            ✅ <strong>Snapshot Rute & Jam Mesin HM:</strong> Tarif ritase terkunci aman saat input & reminder servis armada terpicu otomatis.
                                        </li>
                                        <li className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/30">
                                            ✅ <strong>Konsolidasi 1-Klik:</strong> Laporan Keuangan Laba Rugi per unit bisnis & konsolidasi siap dalam detik.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: INTERACTIVE MANUAL BOOK V5 */}
                    {activeTab === 'manual' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-400" /> Manual Book Sistem v5.0
                                    </h2>
                                    <p className="text-xs text-slate-400">Dokumentasi panduan operasional lengkap untuk seluruh pengguna</p>
                                </div>

                                {/* Search Bar */}
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={manualSearch}
                                        onChange={(e) => setManualSearch(e.target.value)}
                                        placeholder="Cari topik / materi..."
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Navigation Tree Sidebar */}
                                <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 max-h-[500px] overflow-y-auto">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">Daftar Bab Manual</p>
                                    {filteredManual.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setManualSection(m.id)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between ${manualSection === m.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                        >
                                            <span className="truncate">{m.title}</span>
                                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>

                                {/* Content Display */}
                                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 min-h-[400px]">
                                    {manualSections.find(s => s.id === manualSection) ? (
                                        <div className="prose prose-invert prose-indigo max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: manualSections.find(s => s.id === manualSection).content
                                                        .replace(/### (.*)/g, '<h3 class="text-base font-bold text-white mt-4 mb-2">$1</h3>')
                                                        .replace(/1\. (.*)/g, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
                                                        .replace(/2\. (.*)/g, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
                                                        .replace(/3\. (.*)/g, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
                                                        .replace(/4\. (.*)/g, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
                                                        .replace(/- (.*)/g, '<li class="ml-4 list-disc text-slate-300">$1</li>')
                                                        .replace(/\n/g, '<br/>')
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-xs text-slate-400">Materi manual tidak ditemukan.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </main>

                {/* ─── FOOTER ─────────────────────────────────────────────────── */}
                <footer className="border-t border-slate-900 bg-slate-950 py-10 mt-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{appName}</span>
                            <span>— Powered by Laravel {laravelVersion} (PHP v{phpVersion})</span>
                        </div>
                        <p>© 2026 {appName}. Hak Cipta Dilindungi Undang-Undang.</p>
                    </div>
                </footer>

            </div>
        </>
    );
}
