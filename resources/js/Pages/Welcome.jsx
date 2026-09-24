import React, { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { MapPin, Phone, Mail, Sun, Moon, ExternalLink } from "lucide-react";

/**
 * Landing page — profil perusahaan (PT Satria Buana Pamula Sakti / SBPS).
 *
 * Halaman publik company profile, bukan pemasaran sistem internal — tidak
 * menjelaskan modul/fitur software. Merah adalah warna dominan (identitas
 * perusahaan). Mendukung dark mode via toggle di header.
 *
 * PENTING — placeholder yang wajib diganti sebelum publikasi:
 * - Nomor telepon (`phone` prop) masih dummy.
 * - Milestone di bagian "Tentang Kami" ditulis tanpa tahun spesifik karena
 *   tahun berdiri & riwayat perusahaan belum diberikan — lengkapi dengan
 *   tanggal/tahun asli jika ada.
 * - Nomor legalitas (NIB/izin usaha) di bagian "Legalitas" masih kosong.
 * - Wilayah layanan (Banyumas, Purbalingga, dst.) adalah asumsi berdasarkan
 *   lokasi kantor di Patikraja, Banyumas — sesuaikan dengan cakupan nyata.
 */

const MILESTONE = [
    {
        tahap: "Fondasi",
        judul: "Berawal dari armada dan alat berat",
        desk: "SBPS memulai operasinya dengan layanan pengangkutan material dan pengoperasian alat berat untuk mendukung kebutuhan proyek infrastruktur di wilayah Banyumas dan sekitarnya.",
    },
    {
        tahap: "Perluasan",
        judul: "Menambah dua lini produksi",
        desk: "Untuk memperpendek rantai pasok, SBPS membangun lini produksi beton siap pakai (batching plant) dan aspal hotmix (asphalt mixing plant) — material tidak lagi bergantung sepenuhnya pada pemasok luar.",
    },
    {
        tahap: "Hari ini",
        judul: "Empat lini usaha, satu kendali",
        desk: "Armada, batching plant, asphalt mixing plant, dan pelaksanaan proyek berjalan sebagai satu rantai pasok internal — dari titik quarry sampai pekerjaan selesai di lapangan.",
    },
];

const RANTAI_USAHA = [
    {
        nomor: "01",
        judul: "Armada & Alat Berat",
        desk: "Pengangkutan material dari titik quarry serta pengoperasian alat berat (excavator, dump truck, wheel loader) untuk mendukung produksi dan pekerjaan lapangan. Kondisi armada dipantau harian sebelum unit dioperasikan.",
    },
    {
        nomor: "02",
        judul: "Batching Plant Beton",
        desk: "Produksi beton siap pakai (ready mix) dengan takaran campuran yang diukur di setiap batch — bukan hanya di awal produksi — untuk menjaga mutu tetap konsisten dari batch pertama sampai terakhir.",
    },
    {
        nomor: "03",
        judul: "Asphalt Mixing Plant",
        desk: "Produksi aspal hotmix untuk pekerjaan jalan, mulai dari pemanasan dan pencampuran agregat dengan aspal, hingga pengiriman dalam kondisi suhu yang sesuai untuk dihampar di titik pekerjaan.",
    },
    {
        nomor: "04",
        judul: "Pelaksanaan Proyek",
        desk: "Eksekusi pekerjaan infrastruktur di lapangan — jalan, struktur, dan pekerjaan pendukungnya — didukung penuh oleh tiga lini di atas tanpa perlu menunggu pasokan dari pihak ketiga.",
    },
];

const PROSES_LAYANAN = [
    {
        nomor: "1",
        judul: "Konsultasi kebutuhan",
        desk: "Diskusi awal mengenai spesifikasi material, volume pekerjaan, dan jadwal proyek Anda.",
    },
    {
        nomor: "2",
        judul: "Survei & penawaran",
        desk: "Peninjauan lokasi bila diperlukan, dilanjutkan penyusunan penawaran teknis dan komersial.",
    },
    {
        nomor: "3",
        judul: "Produksi & mobilisasi",
        desk: "Proses produksi beton atau aspal, atau mobilisasi armada dan alat berat, dijadwalkan sesuai kebutuhan proyek.",
    },
    {
        nomor: "4",
        judul: "Pengiriman & kontrol mutu",
        desk: "Pengiriman ke titik proyek dengan pengecekan mutu di setiap tahap, bukan hanya sebelum keberangkatan.",
    },
    {
        nomor: "5",
        judul: "Layanan purna pengiriman",
        desk: "Dukungan lanjutan selama masa pelaksanaan proyek berlangsung, termasuk penyesuaian jadwal bila diperlukan.",
    },
];

const WILAYAH = ["Banyumas", "Purbalingga", "Banjarnegara", "Cilacap", "Kebumen"];

const NILAI = [
    {
        judul: "Keselamatan kerja",
        desk: "Prosedur K3 diterapkan di seluruh lini — dari operator alat berat di lapangan sampai kru produksi di batching plant dan AMP. Unit yang tidak lolos pemeriksaan harian tidak dioperasikan.",
    },
    {
        judul: "Mutu yang diukur, bukan diasumsikan",
        desk: "Setiap batch beton dan aspal melalui pengecekan, bukan hanya sampel di awal produksi. Penyimpangan mutu ditangani sebelum material dikirim, bukan setelah sampai di lokasi proyek.",
    },
    {
        judul: "Ketepatan waktu",
        desk: "Jadwal produksi dan pengiriman disusun berdasarkan kebutuhan proyek riil, dengan armada dan alat berat milik sendiri — tidak bergantung pada ketersediaan pihak ketiga.",
    },
    {
        judul: "Tanggung jawab lingkungan",
        desk: "Pengelolaan titik quarry dan lokasi produksi memperhatikan dampak terhadap lingkungan sekitar, sesuai kaidah operasional pertambangan dan produksi material yang bertanggung jawab.",
    },
];

function ThemeToggle({ theme, onToggle }) {
    const isDark = theme === "dark";
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            aria-pressed={isDark}
            className="w-9 h-9 flex items-center justify-center border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shrink-0"
        >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
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
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const saved = window.localStorage.getItem("theme");
        const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setTheme(saved || preferred);
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

    return (
        <>
            <Head title={`${companyName} — Profil Perusahaan`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                :root {
                    --bg: #E4E1D8;
                    --bg-panel: #F7F5F0;
                    --bg-invert: #201F1C;
                    --text: #201F1C;
                    --text-invert: #F7F5F0;
                    --text-muted: rgba(32, 31, 28, 0.7);
                    --line: rgba(32, 31, 28, 0.14);
                    --accent: #C6281D;
                    --steel: #5B6472;
                }
                .theme-dark {
                    --bg: #1B1A18;
                    --bg-panel: #242220;
                    --bg-invert: #F2EFE9;
                    --text: #EDEAE2;
                    --text-invert: #1B1A18;
                    --text-muted: rgba(237, 234, 226, 0.65);
                    --line: rgba(237, 234, 226, 0.16);
                    --accent: #E4453A;
                    --steel: #8B96A3;
                }

                .font-head { font-family: 'Oswald', sans-serif; }
                .font-body { font-family: 'IBM Plex Sans', sans-serif; }

                @keyframes riseIn {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .rise-in { animation: riseIn 0.7s ease-out both; }
                .rise-in-delay { animation: riseIn 0.7s ease-out 0.15s both; }
                @media (prefers-reduced-motion: reduce) {
                    .rise-in, .rise-in-delay { animation: none; }
                }

                .strata-clip {
                    clip-path: polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%);
                }
            `}</style>

            <div className={`min-h-screen bg-[var(--bg)] font-body text-[var(--text)] antialiased transition-colors ${theme === "dark" ? "theme-dark" : ""}`}>
                {/* ─── HEADER ───────────────────────────────────────── */}
                <header className="border-b border-[var(--line)]">
                    <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-9 bg-[var(--accent)] text-[#F7F5F0] font-head font-semibold text-base flex items-center justify-center shrink-0">
                                {shortName.charAt(0)}
                            </span>
                            <div className="leading-tight min-w-0">
                                <p className="font-head font-semibold text-lg tracking-tight">{shortName}</p>
                                <p className="hidden sm:block text-[11px] text-[var(--text-muted)] truncate">{companyName}</p>
                            </div>
                        </div>

                        <nav className="hidden lg:flex items-center gap-7 text-sm shrink-0">
                            <a href="#tentang" className="hover:text-[var(--accent)] transition-colors">Tentang Kami</a>
                            <a href="#usaha" className="hover:text-[var(--accent)] transition-colors">Lini Usaha</a>
                            <a href="#proses" className="hover:text-[var(--accent)] transition-colors">Proses Layanan</a>
                            <a href="#wilayah" className="hover:text-[var(--accent)] transition-colors">Wilayah</a>
                            <a href="#kontak" className="hover:text-[var(--accent)] transition-colors">Kontak</a>
                        </nav>

                        <div className="flex items-center gap-3 text-sm shrink-0">
                            {auth?.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="border-b border-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors pb-0.5 hidden sm:inline"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route("login")}
                                    className="border-b border-[var(--text)]/30 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors pb-0.5 hidden sm:inline"
                                >
                                    Portal internal
                                </Link>
                            )}
                            <ThemeToggle theme={theme} onToggle={toggleTheme} />
                        </div>
                    </div>
                </header>

                {/* ─── HERO ─────────────────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 pt-16 pb-14 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
                    <div className="rise-in">
                        <h1 className="font-head font-semibold text-[2.5rem] sm:text-[3.3rem] leading-[1.06] tracking-tight max-w-xl">
                            Dari titik quarry sampai ke permukaan jalan yang jadi.
                        </h1>
                        <p className="mt-6 font-body text-[1.05rem] leading-relaxed text-[var(--text-muted)] max-w-md">
                            {companyName} mengelola rantai material dan alat berat sendiri —
                            armada, produksi beton, dan aspal hotmix — untuk mendukung
                            pekerjaan infrastruktur secara menyeluruh, bukan sepotong-sepotong.
                        </p>
                        <div className="mt-9 flex flex-wrap items-center gap-6 text-sm">
                            <a
                                href="#kontak"
                                className="px-5 py-2.5 bg-[var(--accent)] text-[#F7F5F0] hover:opacity-90 transition-opacity"
                            >
                                Hubungi kami
                            </a>
                            <a
                                href="#usaha"
                                className="border-b border-[var(--text)]/40 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors pb-0.5"
                            >
                                Lihat lini usaha
                            </a>
                        </div>
                        <p className="mt-8 text-xs text-[var(--text-muted)] max-w-sm">
                            Berbasis di Kabupaten Banyumas, melayani kebutuhan material dan
                            pekerjaan infrastruktur di Banyumas Raya dan sekitarnya.
                        </p>
                    </div>

                    <div className="rise-in-delay relative h-72 sm:h-96 lg:h-[26rem]">
                        <svg
                            viewBox="0 0 480 560"
                            className="w-full h-full strata-clip"
                            preserveAspectRatio="xMidYMid slice"
                            role="img"
                            aria-label="Ilustrasi lapisan material dan jalan"
                        >
                            <rect width="480" height="560" fill="var(--accent)" />
                            <polygon points="0,560 480,340 480,560" fill="var(--bg-invert)" opacity="0.85" />
                            <polygon points="0,560 480,420 480,560 0,470" fill="var(--bg-invert)" opacity="0.5" />
                            <polygon points="0,220 480,60 480,180 0,340" fill="var(--steel)" opacity="0.35" />
                            <line x1="0" y1="345" x2="480" y2="185" stroke="var(--bg-panel)" strokeWidth="4" strokeDasharray="18 14" opacity="0.85" />
                        </svg>
                    </div>
                </section>

                {/* ─── TENTANG KAMI ─────────────────────────────────── */}
                <section id="tentang" className="border-t border-[var(--line)] bg-[var(--bg-panel)]">
                    <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12">
                        <div>
                            <h2 className="font-head font-semibold text-3xl leading-tight max-w-xs">
                                Satu perusahaan, satu rantai pasok.
                            </h2>
                            <p className="mt-4 text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
                                {shortName} tumbuh dari layanan armada menjadi perusahaan yang
                                mengelola produksi material dan pelaksanaan proyek sekaligus —
                                supaya setiap tahap pekerjaan tetap dalam satu kendali.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {MILESTONE.map((m, i) => (
                                <div key={m.tahap} className="relative pl-8">
                                    {i !== MILESTONE.length - 1 && (
                                        <span className="absolute left-[5px] top-5 bottom-[-2rem] w-px bg-[var(--line)]" aria-hidden="true" />
                                    )}
                                    <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                                    <p className="text-xs font-medium text-[var(--accent)] mb-1">{m.tahap}</p>
                                    <h3 className="font-head font-medium text-xl">{m.judul}</h3>
                                    <p className="mt-1.5 text-sm text-[var(--text-muted)] leading-relaxed max-w-lg">
                                        {m.desk}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── LINI USAHA (rantai proses) ───────────────────── */}
                <section id="usaha" className="bg-[var(--bg-invert)] text-[var(--text-invert)]">
                    <div className="max-w-6xl mx-auto px-6 py-20">
                        <h2 className="font-head font-semibold text-3xl sm:text-4xl max-w-lg leading-tight">
                            Empat lini usaha, satu rantai pasok.
                        </h2>
                        <p className="mt-4 max-w-md opacity-65">
                            Setiap lini menyuplai lini berikutnya — material tidak perlu
                            melewati banyak pihak luar sebelum menjadi jalan atau struktur jadi.
                        </p>

                        <div className="mt-14 divide-y divide-[var(--text-invert)]/15">
                            {RANTAI_USAHA.map((item) => (
                                <div
                                    key={item.nomor}
                                    className="py-7 grid grid-cols-[auto_1fr] sm:grid-cols-[5rem_1fr_1.3fr] gap-x-6 gap-y-2 items-baseline"
                                >
                                    <span className="font-head text-2xl text-[var(--accent)]">{item.nomor}</span>
                                    <h3 className="font-head font-medium text-xl sm:text-2xl">{item.judul}</h3>
                                    <p className="text-sm leading-relaxed sm:col-start-3 opacity-65">
                                        {item.desk}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── PROSES LAYANAN ───────────────────────────────── */}
                <section id="proses" className="max-w-6xl mx-auto px-6 py-20">
                    <div className="max-w-lg mb-14">
                        <h2 className="font-head font-semibold text-3xl sm:text-4xl leading-tight">
                            Bagaimana kami bekerja sama dengan Anda.
                        </h2>
                        <p className="mt-4 text-[var(--text-muted)] text-sm leading-relaxed">
                            Dari permintaan awal sampai pekerjaan berjalan di lapangan,
                            berikut tahapan yang biasa kami lalui bersama klien.
                        </p>
                    </div>

                    <div className="space-y-0">
                        {PROSES_LAYANAN.map((p, i) => (
                            <div
                                key={p.nomor}
                                className={`grid grid-cols-1 sm:grid-cols-[3rem_1fr] gap-x-6 gap-y-1 py-6 border-t border-[var(--line)] ${
                                    i === PROSES_LAYANAN.length - 1 ? "border-b" : ""
                                } ${i % 2 === 1 ? "sm:pl-16" : ""}`}
                            >
                                <span className="font-head text-3xl text-[var(--accent)]">{p.nomor}</span>
                                <div className="max-w-lg">
                                    <h3 className="font-head font-medium text-lg">{p.judul}</h3>
                                    <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">{p.desk}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── WILAYAH LAYANAN ──────────────────────────────── */}
                <section id="wilayah" className="border-y border-[var(--line)] bg-[var(--bg-panel)]">
                    <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
                        <div>
                            <h2 className="font-head font-semibold text-3xl leading-tight max-w-sm">
                                Beroperasi dari Banyumas, melayani sekitarnya.
                            </h2>
                            <p className="mt-4 text-[var(--text-muted)] text-sm leading-relaxed max-w-sm">
                                Kantor dan fasilitas produksi kami berada di Kecamatan
                                Patikraja, Kabupaten Banyumas — posisi yang memudahkan
                                pengiriman material ke kabupaten-kabupaten sekitarnya tanpa
                                jarak tempuh yang berlebihan.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2.5 content-start">
                            {WILAYAH.map((w) => (
                                <span
                                    key={w}
                                    className="px-4 py-2 border border-[var(--line)] text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                                >
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── NILAI / KOMITMEN ─────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 py-20">
                    <h2 className="font-head font-semibold text-3xl sm:text-4xl max-w-lg leading-tight mb-14">
                        Yang kami pegang di setiap pekerjaan.
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {NILAI.map((n, i) => (
                            <div
                                key={n.judul}
                                className={`border-l-2 border-[var(--accent)] pl-5 ${i % 2 === 1 ? "md:mt-10" : ""}`}
                            >
                                <h3 className="font-head font-medium text-xl">{n.judul}</h3>
                                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
                                    {n.desk}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── LEGALITAS & KARIER ───────────────────────────── */}
                <section className="border-t border-[var(--line)] bg-[var(--bg-panel)]">
                    <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="font-head font-semibold text-xl">Legalitas</h3>
                            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
                                {shortName} beroperasi sebagai badan hukum Perseroan Terbatas
                                dengan legalitas usaha yang lengkap. Detail nomor NIB dan izin
                                usaha dapat dicantumkan di sini sesuai dokumen resmi perusahaan.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-head font-semibold text-xl">Karier</h3>
                            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
                                Tertarik bergabung dengan tim kami — baik di lapangan maupun
                                produksi? Kirimkan CV dan portofolio Anda melalui email kontak
                                di bawah, dengan subjek sesuai posisi yang diminati.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── KONTAK ───────────────────────────────────────── */}
                <section id="kontak" className="bg-[var(--bg-invert)] text-[var(--text-invert)]">
                    <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-12">
                        <div>
                            <h2 className="font-head font-semibold text-2xl sm:text-3xl max-w-sm">
                                Diskusikan kebutuhan proyek Anda.
                            </h2>
                            <p className="mt-3 opacity-65 max-w-sm text-sm leading-relaxed">
                                Untuk kerja sama pengadaan material, sewa alat, atau
                                pelaksanaan proyek, hubungi kami melalui kontak berikut.
                            </p>
                        </div>
                        <div className="space-y-5 text-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                                <div>
                                    <p>{address}</p>
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 mt-1 text-xs opacity-65 hover:opacity-100 hover:text-[var(--accent)] transition-colors"
                                    >
                                        Buka di Google Maps <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                                <span>{phone}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                                <a href={`mailto:${email}`} className="hover:text-[var(--accent)] transition-colors">
                                    {email}
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FOOTER ───────────────────────────────────────── */}
                <footer className="border-t border-[var(--line)]">
                    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr] gap-8 text-sm">
                        <div>
                            <p className="font-head font-semibold">{shortName}</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)] max-w-[26ch]">{companyName}</p>
                        </div>
                        <div className="space-y-1.5 text-[var(--text-muted)]">
                            <a href="#tentang" className="block hover:text-[var(--accent)] transition-colors">Tentang Kami</a>
                            <a href="#usaha" className="block hover:text-[var(--accent)] transition-colors">Lini Usaha</a>
                            <a href="#proses" className="block hover:text-[var(--accent)] transition-colors">Proses Layanan</a>
                        </div>
                        <div className="space-y-1.5 text-[var(--text-muted)]">
                            <a href="#wilayah" className="block hover:text-[var(--accent)] transition-colors">Wilayah Layanan</a>
                            <a href="#kontak" className="block hover:text-[var(--accent)] transition-colors">Kontak</a>
                            <a href={`mailto:${email}`} className="block hover:text-[var(--accent)] transition-colors">{email}</a>
                        </div>
                    </div>
                    <div className="border-t border-[var(--line)]">
                        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-[var(--text-muted)]">
                            © {new Date().getFullYear()} {companyName} — seluruh hak cipta dilindungi.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
