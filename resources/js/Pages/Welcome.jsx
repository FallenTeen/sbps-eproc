import React, { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { MapPin, Phone, Mail, Sun, Moon, ExternalLink } from "lucide-react";

/**
 * Landing page - company profile (PT Satria Buana Pamula Sakti / SBPS).
 *
 * Halaman publik untuk calon klien jasa konstruksi/material (kontraktor utama,
 * developer, dinas terkait). Fokus: perusahaan B2B industri - bukan pemasaran
 * software, sehingga tidak ada penjelasan modul/fitur sistem.
 *
 * Arah visual: editorial industrial company profile - typography besar,
 * grid edific, fotografi, spacing. Tiga lini usaha (GCS/CBP/AMP) adalah
 * struktur bisnis riil perusahaan.
 *
 * Spatial system: "wide canvas, controlled content" - container utama fluid
 * (min(92vw, 1580px)), kolom teks dibatasi untuk readability, area gambar
 * diizinkan lebih lebar, dan beberapa section full-bleed.
 *
 * PENTING - wajib dilengkapi/diverifikasi sebelum publikasi:
 * - Nomor telepon (`phone` prop) masih dummy.
 * - Sengaja TIDAK mencantumkan kapasitas produksi, jumlah armada, jumlah
 *   proyek, sertifikasi, atau klaim kualitatif karena belum ada data resmi.
 * - Foto masih placeholder (Unsplash) - ganti dengan dokumentasi proyek
 *   milik perusahaan bila tersedia.
 */

const IMG = {
    hero: "https://images.unsplash.com/photo-1772852325224-f3caade1a5b5?auto=format&fit=crop&w=1800&q=80",
    gcs: "https://images.unsplash.com/photo-1751054631354-a42bd7609d75?auto=format&fit=crop&w=1400&q=80",
    cbp: "https://images.unsplash.com/photo-1530139675202-8c52bb810762?auto=format&fit=crop&w=1400&q=80",
    amp: "https://images.unsplash.com/photo-1774274951965-3828c5cea7c9?auto=format&fit=crop&w=1400&q=80",
    large: "https://images.unsplash.com/photo-1760708626681-59a5373819a6?auto=format&fit=crop&w=2000&q=80",
};

const BISNIS = [
    {
        nomor: "01",
        kode: "GCS",
        jenis: "General Contractor & Supplier",
        desk: "Pengangkutan material dan pekerjaan lapangan menggunakan armada serta alat berat milik sendiri, termasuk pelaksanaan pekerjaan sebagai kontraktor umum.",
        list: ["Dump truck transportation", "Heavy equipment rental", "Material supply"],
        img: IMG.gcs,
        flip: false,
    },
    {
        nomor: "02",
        kode: "CBP",
        jenis: "Concrete Batching Plant",
        desk: "Produksi beton ready-mix dengan campuran yang disesuaikan dengan kebutuhan dan mutu proyek, hingga pengiriman ke titik pekerjaan.",
        list: ["Ready-mix concrete production", "Concrete delivery"],
        img: IMG.cbp,
        flip: true,
    },
    {
        nomor: "03",
        kode: "AMP",
        jenis: "Asphalt Mixing Plant",
        desk: "Produksi hotmix, termasuk HRS dan AC-BC, dari pencampuran agregat dan aspal hingga pengiriman dalam suhu yang sesuai untuk dihampar.",
        list: ["Hotmix asphalt production", "HRS", "AC-BC"],
        img: IMG.amp,
        flip: false,
    },
];

const KAPABILITAS = [
    {
        nomor: "01",
        judul: "Angkutan",
        desk: "Dump truck untuk kebutuhan pengangkutan proyek.",
    },
    {
        nomor: "02",
        judul: "Alat berat",
        desk: "Penyewaan alat berat dengan skema sewa jam.",
    },
    {
        nomor: "03",
        judul: "Material",
        desk: "Supply material untuk kebutuhan proyek.",
    },
    {
        nomor: "04",
        judul: "Beton",
        desk: "Produksi dan pengiriman ready-mix concrete.",
    },
    {
        nomor: "05",
        judul: "Aspal",
        desk: "Produksi hotmix asphalt, termasuk HRS dan AC-BC.",
    },
];

const LANGKAH = [
    {
        nomor: "01",
        judul: "Diskusikan kebutuhan proyek",
        desk: "Spesifikasi kebutuhan, volume, dan target jadwal proyek Anda disampaikan di awal.",
    },
    {
        nomor: "02",
        judul: "Tentukan layanan yang dibutuhkan",
        desk: "Layanan disesuaikan dengan kebutuhan: material, armada, alat berat, atau produksi.",
    },
    {
        nomor: "03",
        judul: "Produksi, armada, material disiapkan",
        desk: "Produksi di plant atau mobilisasi armada dijadwalkan mengikuti kebutuhan lapangan.",
    },
    {
        nomor: "04",
        judul: "Pengiriman dan pelaksanaan",
        desk: "Material dikirim dan pekerjaan berjalan di lokasi proyek.",
    },
];

const WILAYAH = ["Banyumas", "Purbalingga", "Banjarnegara", "Cilacap", "Kebumen"];

function ThemeToggle({ theme, onToggle }) {
    const isDark = theme === "dark";
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            aria-pressed={isDark}
            className="w-9 h-9 flex items-center justify-center border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
    );
}

function SectionLabel({ children, nomor }) {
    return (
        <span className="inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[var(--accent)]">
            <span className="inline-block w-2 h-2 bg-[var(--accent)]" aria-hidden="true" />
            {children}
            {nomor ? <span className="text-[var(--text-muted)]">/ {nomor}</span> : null}
        </span>
    );
}

export default function Welcome({
    auth,
    companyName = "PT Satria Buana Pamula Sakti",
    shortName = "SBPS",
    address = "Kertayasa, Desa Kedungrandu, Kec. Patikraja, Kabupaten Banyumas, Jawa Tengah 53171",
    plusCode = "G6J9+H3C",
    email = "sistemsbps@gmail.com",
    phone = "+62 xxx-xxxx-xxxx",
}) {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const saved = window.localStorage.getItem("theme");
        if (saved === "light" || saved === "dark") setTheme(saved);
        else setTheme("dark");
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            window.localStorage.setItem("theme", next);
            return next;
        });
    };

    const mapsQuery = encodeURIComponent(`${plusCode} ${address}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
    const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

    return (
        <>
            <Head title={`${companyName} - Kontraktor, Beton & Aspal di Banyumas`}>
                <meta
                    name="description"
                    content={`${companyName} (${shortName}) mengoperasikan armada & alat berat, batching plant beton, dan asphalt mixing plant sendiri di Kabupaten Banyumas untuk kebutuhan material dan pelaksanaan proyek infrastruktur.`}
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                :root {
                    --bg: #EEEBE4;
                    --bg-panel: #E4E0D6;
                    --bg-invert: #16130F;
                    --text: #17130F;
                    --text-invert: #F2EEE6;
                    --text-muted: rgba(23, 19, 15, 0.64);
                    --line: rgba(23, 19, 15, 0.18);
                    --line-invert: rgba(242, 238, 230, 0.2);
                    --accent: #D81E05;
                    --accent-deep: #A81502;
                    --steel: #6B7075;
                    --ink-dark: #16130F;
                }
                .theme-dark {
                    --bg: #141210;
                    --bg-panel: #1A1713;
                    --bg-invert: #F2EEE6;
                    --text: #EFEBE3;
                    --text-invert: #17130F;
                    --text-muted: rgba(239, 235, 227, 0.6);
                    --line: rgba(239, 235, 227, 0.16);
                    --line-invert: rgba(23, 19, 15, 0.2);
                    --accent: #FF4D33;
                    --accent-deep: #FF6B4A;
                    --steel: #9AA0A4;
                    --ink-dark: #141210;
                }

                .font-head { font-family: 'Big Shoulders Display', sans-serif; letter-spacing: -0.01em; }
                .font-body { font-family: 'IBM Plex Sans', sans-serif; }

                /* Wide canvas, controlled content */
                .container-wide {
                    width: min(92vw, 1580px);
                    margin-inline: auto;
                    padding-inline: clamp(1.25rem, 3vw, 3.5rem);
                }

                html { scroll-behavior: smooth; }
                section[id], footer[id] { scroll-margin-top: 4.5rem; }

                @keyframes heroRise {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hero-rise { animation: heroRise 0.8s ease-out both; }
                .hero-rise-delay { animation: heroRise 0.8s ease-out 0.15s both; }
                .hero-rise-later { animation: heroRise 0.8s ease-out 0.3s both; }
                @media (prefers-reduced-motion: reduce) {
                    .hero-rise, .hero-rise-delay, .hero-rise-later { animation: none; }
                    html { scroll-behavior: auto; }
                }
            `}</style>

            <div className={`min-h-screen bg-[var(--bg)] font-body text-[var(--text)] antialiased transition-colors ${theme === "dark" ? "theme-dark" : ""}`}>
                {/* ─── HEADER ───────────────────────────────────────── */}
                <header className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--line)]">
                    <div className="container-wide h-16 flex items-center justify-between gap-4">
                        <a href="#top" className={`flex items-center gap-3 min-w-0 shrink-0 ${focusRing}`}>
                            <span className="w-9 h-9 bg-[var(--accent)] text-white font-head font-extrabold text-lg flex items-center justify-center">
                                {shortName.charAt(0)}
                            </span>
                            <span className="leading-tight min-w-0">
                                <span className="block font-head font-bold text-lg tracking-tight">{shortName}</span>
                                <span className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)] truncate">
                                    {companyName}
                                </span>
                            </span>
                        </a>

                        <nav className="hidden lg:flex items-center gap-8 text-sm shrink-0">
                            <a href="#tentang" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Tentang Kami</a>
                            <a href="#usaha" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Lini Usaha</a>
                            <a href="#proses" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Cara Kerja</a>
                            <a href="#wilayah" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Wilayah</a>
                            <a href="#kontak" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Kontak</a>
                        </nav>

                        {/* <div className="flex items-center gap-3 text-sm shrink-0">
                            {auth?.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className={`border-b border-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors pb-0.5 hidden sm:inline ${focusRing}`}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route("login")}
                                    className={`border-b border-[var(--text)]/30 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors pb-0.5 hidden sm:inline ${focusRing}`}
                                >
                                    Portal internal
                                </Link>
                            )}

                        </div> */}
                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                    </div>
                </header>

                {/* ─── HERO ─────────────────────────────────────────── */}
                <section id="top" className="border-b border-[var(--line)]">
                    <div className="container-wide pt-6">
                        <div className="hero-rise flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                            <p>{companyName}</p>
                            <p className="text-right">Berbasis di Banyumas</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.08fr] gap-12 lg:gap-16 items-end mt-10 lg:mt-16 pb-16">
                            <div className="hero-rise-delay">
                                <h1 className="font-head font-extrabold uppercase leading-[0.9] tracking-tight text-[clamp(2.8rem,7.2vw,6.6rem)]">
                                    Material, armada,
                                    <br />
                                    dan produksi
                                    <br />
                                    untuk proyek
                                    <br />
                                    <span className="text-[var(--accent)]">konstruksi.</span>
                                </h1>
                                <p className="mt-8 text-[15px] leading-relaxed text-[var(--text-muted)] max-w-md">
                                    {companyName} menyediakan kebutuhan proyek melalui layanan General
                                    Contractor &amp; Supplier, produksi beton ready-mix, dan asphalt
                                    mixing plant.
                                </p>
                                <div className="mt-9 flex flex-wrap items-center gap-7 text-sm">
                                    <a
                                        href="#kontak"
                                        className={`px-6 py-3 bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-deep)] transition-colors ${focusRing}`}
                                    >
                                        Bahas kebutuhan proyek
                                    </a>
                                    <a
                                        href="#usaha"
                                        className={`border-b border-[var(--text)]/30 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors pb-0.5 ${focusRing}`}
                                    >
                                        Lihat lini usaha
                                    </a>
                                </div>
                            </div>

                            <figure className="hero-rise-later max-lg:mt-2">
                                <div className="aspect-[16/10] overflow-hidden border border-[var(--line)]">
                                    <img
                                        src={IMG.hero}
                                        alt="Foto dokumentasi lokasi pekerjaan konstruksi"
                                        loading="eager"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <figcaption className="mt-3 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                                    <span>Lokasi pekerjaan proyek</span>
                                    <span className="h-px flex-1 bg-[var(--line)] max-w-[4rem]" aria-hidden="true" />
                                    <span>Banyumas, Jawa Tengah</span>
                                </figcaption>
                            </figure>
                        </div>
                    </div>

                    {/* business index */}
                    <div className="border-t border-[var(--line)]">
                        <div className="container-wide grid grid-cols-1 sm:grid-cols-3">
                            {BISNIS.map((b) => (
                                <div
                                    key={b.kode}
                                    className={`py-6 sm:px-5 first:pl-0 last:pr-0 border-b sm:border-b-0 sm:border-r last:border-r-0 border-[var(--line)] flex flex-col gap-1`}
                                >
                                    <p className="font-head text-sm font-bold text-[var(--accent)]">{b.nomor}</p>
                                    <p className="font-head font-extrabold text-3xl tracking-tight">{b.kode}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{b.jenis}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── TENTANG SBPS / 01 ────────────────────────────── */}
                <section id="tentang" className="border-b border-[var(--line)] bg-[var(--bg-panel)]">
                    <div className="container-wide py-20 md:py-28">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                            <div className="lg:col-span-2">
                                <SectionLabel nomor="01">Tentang SBPS</SectionLabel>
                            </div>
                            <div className="lg:col-span-10">
                                <h2 className="font-head font-bold uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.2vw,3.6rem)] max-w-4xl">
                                    Satu perusahaan untuk kebutuhan material, armada, dan produksi proyek.
                                </h2>
                                <p className="mt-9 text-[15px] leading-relaxed text-[var(--text-muted)] max-w-xl">
                                    {companyName} menjalankan tiga lini usaha secara langsung: angkutan
                                    dan alat berat sebagai kontraktor &amp; supplier, produksi beton
                                    ready-mix di batching plant, dan produksi hotmix di asphalt mixing
                                    plant. Pengadaan agregat, pencampuran, dan pengiriman ditangani satu
                                    perusahaan - bukan beberapa pemasok dengan jadwal dan standar masing-masing.
                                </p>
                            </div>
                        </div>

                        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[var(--line)]">
                            <div className="p-6 lg:p-8 border-r border-b border-[var(--line)]">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Basis operasional</p>
                                <p className="font-head font-bold text-2xl mt-2">Banyumas</p>
                            </div>
                            <div className="p-6 lg:p-8 border-r border-b sm:border-r-0 lg:border-r border-[var(--line)]">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">GCS</p>
                                <p className="font-head font-bold text-2xl mt-2">General Contractor &amp; Supplier</p>
                            </div>
                            <div className="p-6 lg:p-8 border-r border-b sm:border-r-0 lg:border-r border-[var(--line)]">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">CBP</p>
                                <p className="font-head font-bold text-2xl mt-2">Concrete Batching Plant</p>
                            </div>
                            <div className="p-6 lg:p-8 border-b lg:border-b-0 border-[var(--line)]">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">AMP</p>
                                <p className="font-head font-bold text-2xl mt-2">Asphalt Mixing Plant</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── LINI USAHA / 02 ──────────────────────────────── */}
                <section id="usaha" className="border-b border-[var(--line)]">
                    <div className="container-wide py-20 md:py-28">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                            <div>
                                <SectionLabel nomor="02">Lini Usaha</SectionLabel>
                                <h2 className="font-head font-bold uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.2vw,3.6rem)] mt-6 max-w-2xl">
                                    Tiga lini usaha untuk kebutuhan proyek.
                                </h2>
                            </div>
                            <p className="text-sm leading-relaxed text-[var(--text-muted)] max-w-xs lg:pb-2">
                                Masing-masing dikelola langsung oleh {shortName} sebagai satu perusahaan.
                            </p>
                        </div>

                        <div className="mt-14 flex flex-col">
                            {BISNIS.map((b) => (
                                <article key={b.kode} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 lg:py-20 border-t border-[var(--line)]">
                                    <div className={`${b.flip ? "lg:order-2" : ""}`}>
                                        <div className="flex items-baseline gap-4">
                                            <span className="font-head font-bold text-xl text-[var(--accent)]">{b.nomor} —</span>
                                            <span className="font-head font-extrabold text-5xl sm:text-6xl tracking-tight">{b.kode}</span>
                                        </div>
                                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                                            {b.jenis}
                                        </p>
                                        <p className="mt-7 text-[15px] leading-relaxed text-[var(--text-muted)] max-w-lg">
                                            {b.desk}
                                        </p>
                                        <ul className="mt-8 space-y-3">
                                            {b.list.map((li) => (
                                                <li key={li} className="flex items-center gap-3 text-[15px]">
                                                    <span className="h-px w-4 bg-[var(--accent)] shrink-0" aria-hidden="true" />
                                                    {li}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <figure className={`${b.flip ? "lg:order-1" : ""}`}>
                                        <div className="aspect-[4/3] overflow-hidden border border-[var(--line)]">
                                            <img
                                                src={b.img}
                                                alt={`Foto dokumentasi lini usaha ${b.kode} - ${b.jenis}`}
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <figcaption className="mt-3 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                                            <span>{b.kode} — {b.jenis}</span>
                                            <span className="h-px flex-1 bg-[var(--line)] max-w-[4rem]" aria-hidden="true" />
                                            <span>{b.nomor}</span>
                                        </figcaption>
                                    </figure>
                                </article>
                            ))}
                            <div className="border-t border-[var(--line)]" aria-hidden="true" />
                        </div>
                    </div>
                </section>

                {/* ─── KAPABILITAS / 03 ─────────────────────────────── */}
                <section className="border-b border-[var(--line)] bg-[var(--bg-invert)] text-[var(--text-invert)]">
                    <div className="container-wide py-20 md:py-28">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
                            <div className="lg:col-span-2">
                                <SectionLabel nomor="03">Kapabilitas</SectionLabel>
                            </div>
                            <div className="lg:col-span-10">
                                <h2 className="font-head font-bold uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.2vw,3.6rem)] max-w-4xl">
                                    Kebutuhan proyek, dilihat dari pekerjaannya.
                                </h2>
                            </div>
                        </div>

                        <div className="mt-14 lg:mt-20">
                            {KAPABILITAS.map((k) => (
                                <div
                                    key={k.nomor}
                                    className="group grid grid-cols-[3rem_1fr] md:grid-cols-12 items-baseline gap-x-6 gap-y-2 border-t border-[var(--line-invert)] py-7 md:py-8"
                                >
                                    <span className="md:col-span-1 font-head text-lg font-bold text-[var(--accent)]">
                                        {k.nomor}
                                    </span>
                                    <h3 className="md:col-span-7 font-head font-bold uppercase tracking-tight text-3xl sm:text-4xl lg:text-5xl group-hover:translate-x-2 group-hover:text-[var(--accent)] transition-all duration-200">
                                        {k.judul}
                                    </h3>
                                    <p className="md:col-span-4 md:text-right text-sm text-[var(--text-invert)]/60 col-start-2">
                                        {k.desk}
                                    </p>
                                </div>
                            ))}
                            <div className="border-t border-[var(--line-invert)]" aria-hidden="true" />
                        </div>
                    </div>
                </section>

                {/* ─── CARA KERJA / 04 ──────────────────────────────── */}
                <section id="proses" className="border-b border-[var(--line)]">
                    <div className="container-wide py-20 md:py-28">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                            <div className="lg:col-span-2">
                                <SectionLabel nomor="04">Cara Kerja</SectionLabel>
                            </div>
                            <div className="lg:col-span-10">
                                <h2 className="font-head font-bold uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.2vw,3.6rem)] max-w-3xl">
                                    Mulai dari kebutuhan proyek.
                                </h2>
                            </div>
                        </div>

                        <ol className="mt-14 lg:mt-20 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border-t border-[var(--line)]">
                            {LANGKAH.map((s) => (
                                <li
                                    key={s.nomor}
                                    className="relative pt-10 pr-6 lg:pr-10 pb-2 border-b md:border-b xl:border-b-0 xl:border-r last:border-r-0 border-[var(--line)]"
                                >
                                    <span className="absolute top-0 left-0 h-[3px] w-10 bg-[var(--accent)]" aria-hidden="true" />
                                    <p className="font-head text-sm font-bold text-[var(--accent)]">{s.nomor}</p>
                                    <h3 className="font-head font-bold text-xl mt-4 lg:text-2xl pr-2 lg:max-w-[20ch]">{s.judul}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] lg:max-w-[34ch]">{s.desk}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* ─── BESAR GAMBAR INDUSTRI ────────────────────────── */}
                <section className="relative w-full min-h-[82vh] md:min-h-[100vh] overflow-hidden border-b border-[var(--line)]">
                    <img
                        src={IMG.large}
                        alt="Dokumentasi area pekerjaan konstruksi"
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/40" aria-hidden="true" />
                    <div className="relative container-wide min-h-[82vh] md:min-h-[100vh] flex flex-col justify-end pb-14">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-white/75">Banyumas, Jawa Tengah</p>
                        <p className="font-head font-extrabold uppercase tracking-tight text-[clamp(3.5rem,10vw,8rem)] leading-none text-white mt-3">
                            {shortName}
                        </p>
                        <p className="mt-4 text-[11px] uppercase tracking-[0.32em] text-white/80">
                            Construction&ensp;·&ensp;Material&ensp;·&ensp;Production
                        </p>
                    </div>
                </section>

                {/* ─── WILAYAH / 05 ─────────────────────────────────── */}
                <section id="wilayah" className="border-b border-[var(--line)]">
                    <div className="container-wide py-20 md:py-28">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                            <div className="lg:col-span-2">
                                <SectionLabel nomor="05">Wilayah</SectionLabel>
                            </div>
                            <div className="lg:col-span-10">
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
                                    <div>
                                        <h2 className="font-head font-bold uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.2vw,3.6rem)] max-w-xl">
                                            Berbasis di Kabupaten Banyumas.
                                        </h2>
                                        <p className="mt-7 text-[15px] leading-relaxed text-[var(--text-muted)] max-w-md">
                                            Melayani kebutuhan material dan pekerjaan infrastruktur di Banyumas
                                            Raya dan sekitarnya.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap lg:justify-end border-t border-[var(--line)] lg:self-end">
                                        {WILAYAH.map((w, i) => (
                                            <span
                                                key={w}
                                                className={`font-head font-bold text-xl lg:text-2xl py-4 pr-6 mr-6 sm:mr-8 tracking-tight ${
                                                    i < WILAYAH.length - 1 ? "border-r border-[var(--line)]" : ""
                                                }`}
                                            >
                                                {w}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── KONTAK / CTA ─────────────────────────────────── */}
                <section id="kontak" className="border-b border-[var(--line)] bg-[var(--bg-invert)] text-[var(--text-invert)]">
                    <div className="container-wide py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24">
                        <div>
                            <SectionLabel nomor="06">Kontak</SectionLabel>
                            <h2 className="font-head font-bold uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.2vw,3.6rem)] mt-6 max-w-2xl">
                                Punya kebutuhan untuk proyek berikutnya?
                            </h2>
                            <p className="mt-6 text-[15px] leading-relaxed text-[var(--text-invert)]/65 max-w-md">
                                Bahas kebutuhan material, armada, atau produksi bersama {shortName}.
                            </p>
                            <a
                                href={`mailto:${email}`}
                                className={`inline-block mt-10 px-7 py-3.5 bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-deep)] transition-colors ${focusRing}`}
                            >
                                Hubungi {shortName}
                            </a>
                        </div>

                        <div className="lg:justify-self-end lg:w-full lg:max-w-xl border-t border-[var(--line-invert)]">
                            <div className="py-7 border-b border-[var(--line-invert)] flex gap-5">
                                <MapPin className="w-4 h-4 mt-1 text-[var(--accent)] shrink-0" aria-hidden="true" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-invert)]/50">Alamat</p>
                                    <p className="mt-2 text-sm leading-relaxed max-w-md">{address}</p>
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`inline-flex items-center gap-1.5 mt-3 text-xs text-[var(--text-invert)]/60 hover:text-[var(--accent)] transition-colors ${focusRing}`}
                                    >
                                        Buka di Google Maps <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                            <div className="py-7 border-b border-[var(--line-invert)] flex gap-5">
                                <Phone className="w-4 h-4 mt-1 text-[var(--accent)] shrink-0" aria-hidden="true" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-invert)]/50">Telepon</p>
                                    <p className="mt-2 text-sm">{phone}</p>
                                </div>
                            </div>
                            <div className="py-7 border-b border-[var(--line-invert)] flex gap-5">
                                <Mail className="w-4 h-4 mt-1 text-[var(--accent)] shrink-0" aria-hidden="true" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-invert)]/50">Email</p>
                                    <a href={`mailto:${email}`} className={`mt-2 block text-sm hover:text-[var(--accent)] transition-colors ${focusRing}`}>
                                        {email}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FOOTER ───────────────────────────────────────── */}
                <footer>
                    <div className="container-wide py-12 flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div>
                            <p className="font-head font-extrabold text-2xl tracking-tight">{shortName}</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)] max-w-[26ch]">{companyName}</p>
                        </div>
                        <nav className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-2.5 text-sm text-[var(--text-muted)]">
                            <a href="#tentang" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Tentang Kami</a>
                            <a href="#usaha" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Lini Usaha</a>
                            <a href="#proses" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Cara Kerja</a>
                            <a href="#wilayah" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Wilayah</a>
                            <a href="#kontak" className={`hover:text-[var(--accent)] transition-colors ${focusRing}`}>Kontak</a>
                            <a href={`mailto:${email}`} className={`hover:text-[var(--accent)] transition-colors truncate ${focusRing}`}>{email}</a>
                        </nav>
                    </div>
                    <div className="border-t border-[var(--line)]">
                        <div className="container-wide py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                            <span>© {new Date().getFullYear()} {companyName} - seluruh hak cipta dilindungi.</span>
                            <span className="uppercase tracking-[0.18em]">Banyumas, Jawa Tengah</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
