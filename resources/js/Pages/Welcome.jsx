import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import {
    MapPin,
    Phone,
    Mail,
    Sun,
    Moon,
    ExternalLink,
    ArrowRight,
    Menu,
    X,
    Truck,
    Construction,
    Layers,
    Route,
    Factory,
    Check,
} from "lucide-react";
import ScrollToTop from "./ScrollToTop";

const IMG = {
    large: "https://images.unsplash.com/photo-1772852325224-f3caade1a5b5?auto=format&fit=crop&w=2000&q=85",
    gcs: "https://images.unsplash.com/photo-1751054631354-a42bd7609d75?auto=format&fit=crop&w=1400&q=85",
    cbp: "https://images.unsplash.com/photo-1530139675202-8c52bb810762?auto=format&fit=crop&w=1400&q=85",
    amp: "https://images.unsplash.com/photo-1774274951965-3828c5cea7c9?auto=format&fit=crop&w=1400&q=85",
    hero: "https://images.unsplash.com/photo-1760708626681-59a5373819a6?auto=format&fit=crop&w=2000&q=85",
};

const LAYANAN = [
    {
        icon: Route,
        judul: "Pengaspalan & perbaikan jalan",
        desk: "Hotmix HRS dan AC-BC untuk pelapisan ulang, penambalan, dan pembangunan jalan.",
    },
    {
        icon: Layers,
        judul: "Beton ready-mix",
        desk: "Beton dari batching plant sendiri, mutu disesuaikan kebutuhan proyek, dikirim ke titik pekerjaan.",
    },
    {
        icon: Truck,
        judul: "Angkutan material",
        desk: "Dump truck untuk pengangkutan agregat, tanah, dan material proyek.",
    },
    {
        icon: Construction,
        judul: "Sewa alat berat",
        desk: "Penyewaan alat berat dengan skema sewa jam, siap mobilisasi ke lokasi.",
    },
    {
        icon: Factory,
        judul: "Supply material",
        desk: "Pengadaan material untuk pekerjaan jalan, drainase, dan konstruksi umum.",
    },
];

const PLANT = [
    {
        kode: "AMP",
        nama: "Asphalt Mixing Plant",
        desk: "Pencampuran agregat dan aspal menjadi hotmix, dikirim dalam suhu yang sesuai untuk dihampar di lapangan.",
        list: ["Hotmix asphalt production", "HRS", "AC-BC"],
        img: IMG.amp,
    },
    {
        kode: "CBP",
        nama: "Concrete Batching Plant",
        desk: "Produksi beton ready-mix dengan campuran yang disesuaikan mutu proyek, hingga pengiriman ke titik pekerjaan.",
        list: ["Ready-mix concrete production", "Concrete delivery"],
        img: IMG.cbp,
    },
    {
        kode: "GCS",
        nama: "General Contractor & Supplier",
        desk: "Pengangkutan material dan pekerjaan lapangan memakai armada serta alat berat milik sendiri.",
        list: [
            "Dump truck transportation",
            "Heavy equipment rental",
            "Material supply",
        ],
        img: IMG.gcs,
    },
];

const CAMPURAN = [
    [
        "HRS",
        "Hot Rolled Sheet",
        "Lapisan permukaan jalan dari campuran aspal panas bergradasi senjang.",
    ],
    [
        "AC-BC",
        "Asphalt Concrete – Binder Course",
        "Lapisan antara yang menahan beban lalu lintas sebelum lapisan permukaan.",
    ],
];

const LANGKAH = [
    {
        judul: "Sampaikan kebutuhan",
        desk: "Lokasi, volume, jenis pekerjaan, dan target jadwal.",
    },
    {
        judul: "Tentukan layanan",
        desk: "Material, armada, alat berat, atau produksi di plant.",
    },
    {
        judul: "Produksi & mobilisasi",
        desk: "Plant berproduksi dan armada dijadwalkan sesuai lapangan.",
    },
    {
        judul: "Kirim & kerjakan",
        desk: "Material tiba di lokasi, pekerjaan berjalan.",
    },
];

const WILAYAH = [
    "Banyumas",
    "Purbalingga",
    "Banjarnegara",
    "Cilacap",
    "Kebumen",
];

export default function Welcome({
    companyName = "PT Satria Buana Pamula Sakti",
    shortName = "SBPS",
    address = "Kertayasa, Desa Kedungrandu, Kec. Patikraja, Kabupaten Banyumas, Jawa Tengah 53171",
    plusCode = "G6J9+H3C",
    email = "sistemsbps@gmail.com",
    phone = "+62 xxx-xxxx-xxxx",
}) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === "undefined") return "light";
        try {
            const t = window.localStorage.getItem("theme");
            return t === "dark" || t === "light" ? t : "light";
        } catch {
            return "light";
        }
    });
    const [menu, setMenu] = useState(false);
    const [activeSection, setActiveSection] = useState("");

    useEffect(() => {
        try {
            window.localStorage.setItem("theme", theme);
        } catch {}
        document.documentElement.style.colorScheme = theme;
    }, [theme]);

    useEffect(() => {
        const updateActiveSection = () => {
            const current = [...nav]
                .map(([, id]) => document.querySelector(id))
                .filter(
                    (section) => section?.getBoundingClientRect().top <= 110,
                )
                .at(-1);
            setActiveSection(current ? `#${current.id}` : "");
        };

        updateActiveSection();
        window.addEventListener("scroll", updateActiveSection, {
            passive: true,
        });
        window.addEventListener("resize", updateActiveSection);
        return () => {
            window.removeEventListener("scroll", updateActiveSection);
            window.removeEventListener("resize", updateActiveSection);
        };
    }, []);

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${plusCode} ${address}`)}`;
    const nav = [
        ["Layanan", "#layanan"],
        ["Plant", "#plant"],
        ["Cara Kerja", "#proses"],
        ["Wilayah", "#wilayah"],
        ["Kontak", "#kontak"],
    ];

    return (
        <>
            <Head
                title={`${companyName} - Kontraktor Perbaikan Jalan, Hotmix & Beton di Banyumas`}
            >
                <meta
                    name="description"
                    content={`${companyName} (${shortName}): pengaspalan dan perbaikan jalan, produksi hotmix HRS & AC-BC, beton ready-mix, angkutan dan sewa alat berat di Banyumas Raya.`}
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="true"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className={`sbps ${theme === "dark" ? "sbps-dark" : ""}`}>
                {/* TOP BAR */}
                <div className="topbar">
                    <div className="wrap topbar-in">
                        <span className="hide-sm">
                            <MapPin size={13} /> Patikraja, Banyumas, Jawa
                            Tengah
                        </span>
                        <span className="topbar-right">
                            <a href={`mailto:${email}`}>
                                <Mail size={13} /> {email}
                            </a>
                            <a href="#kontak">
                                <Phone size={13} /> {phone}
                            </a>
                        </span>
                    </div>
                </div>

                {/* HEADER */}
                <header className="header">
                    <div className="wrap header-in">
                        <a
                            href="#top"
                            className="brand"
                            onClick={(event) => {
                                event.preventDefault();
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                window.history.replaceState(
                                    null,
                                    "",
                                    window.location.pathname +
                                        window.location.search,
                                );
                            }}
                        >
                            <span className="brand-mark">S</span>
                            <span>
                                <b>{shortName}</b>
                                <small>{companyName}</small>
                            </span>
                        </a>
                        <nav className="nav">
                            {nav.map(([l, h]) => (
                                <a
                                    key={h}
                                    href={h}
                                    className={
                                        activeSection === h
                                            ? "active"
                                            : undefined
                                    }
                                >
                                    {l}
                                </a>
                            ))}
                        </nav>
                        <div className="header-act">
                            <button
                                type="button"
                                className="icon-btn"
                                aria-label={
                                    theme === "dark"
                                        ? "Aktifkan mode terang"
                                        : "Aktifkan mode gelap"
                                }
                                onClick={() =>
                                    setTheme(
                                        theme === "dark" ? "light" : "dark",
                                    )
                                }
                            >
                                {theme === "dark" ? (
                                    <Sun size={18} />
                                ) : (
                                    <Moon size={18} />
                                )}
                            </button>
                            <button
                                type="button"
                                className="icon-btn menu-btn"
                                aria-label="Buka menu"
                                onClick={() => setMenu(!menu)}
                            >
                                {menu ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                    {menu && (
                        <nav className="mnav">
                            {nav.map(([l, h]) => (
                                <a
                                    key={h}
                                    href={h}
                                    className={
                                        activeSection === h
                                            ? "active"
                                            : undefined
                                    }
                                    onClick={() => setMenu(false)}
                                >
                                    {l}
                                </a>
                            ))}
                        </nav>
                    )}
                </header>

                {/* HERO */}
                <section id="top" className="hero">
                    <img
                        src={IMG.hero}
                        alt="Pekerjaan perbaikan jalan"
                        className="hero-img"
                        fetchPriority="high"
                    />
                    <div className="hero-shade" />
                    <div className="wrap hero-in">
                        <div className="hero-copy">
                            <p className="tag">
                                Kontraktor jalan · Banyumas Raya
                            </p>
                            <h1>
                                Jalan rusak diperbaiki, dari plant aspal sampai
                                hamparan.
                            </h1>
                            <p className="lead">
                                {shortName} mengoperasikan asphalt mixing plant,
                                batching plant beton, dump truck, dan alat berat
                                sendiri. Hotmix diproduksi dan dikirim langsung
                                ke titik pekerjaan.
                            </p>
                            <div className="hero-cta">
                                <a
                                    href="#kontak"
                                    className="btn btn-red btn-lg"
                                >
                                    Minta penawaran <ArrowRight size={18} />
                                </a>
                                <a
                                    href="#layanan"
                                    className="btn btn-ghost btn-lg"
                                >
                                    Lihat layanan
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="roadline" aria-hidden="true" />
                </section>

                {/* TRUST STRIP */}
                <section className="strip">
                    <div className="wrap strip-in">
                        {[
                            ["AMP", "Asphalt Mixing Plant sendiri"],
                            ["CBP", "Concrete Batching Plant sendiri"],
                            ["GCS", "Armada & alat berat sendiri"],
                        ].map(([k, t]) => (
                            <div key={k}>
                                <b>{k}</b>
                                <span>{t}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* LAYANAN */}
                <section id="layanan" className="sec">
                    <div className="wrap">
                        <div className="sec-head">
                            <h2>
                                Layanan untuk pekerjaan jalan dan konstruksi
                            </h2>
                            <p>
                                Satu perusahaan menangani material, produksi,
                                dan pengiriman, sehingga jadwal tidak bergantung
                                pada beberapa pemasok.
                            </p>
                        </div>
                        <div className="grid-svc">
                            {LAYANAN.map(({ icon: Icon, judul, desk }) => (
                                <article key={judul} className="svc">
                                    <span className="svc-icon">
                                        <Icon size={26} />
                                    </span>
                                    <h3>{judul}</h3>
                                    <p>{desk}</p>
                                </article>
                            ))}
                            <article className="svc svc-cta">
                                <h3>Butuh pekerjaan lain?</h3>
                                <p>
                                    Sampaikan kebutuhan proyek Anda, kami cek
                                    kesesuaiannya.
                                </p>
                                <a
                                    href="#kontak"
                                    className="btn btn-dark !bg-white !text-gray-900"
                                >
                                    Hubungi kami <ArrowRight size={16} />
                                </a>
                            </article>
                        </div>
                    </div>
                </section>

                {/* PLANT */}
                <section id="plant" className="sec sec-alt">
                    <div className="wrap">
                        <div className="sec-head">
                            <h2>Tiga lini usaha, dikelola langsung</h2>
                        </div>
                        <div className="plants">
                            {PLANT.map((p, i) => (
                                <article
                                    key={p.kode}
                                    className={`plant ${i % 2 ? "plant-rev" : ""}`}
                                >
                                    <div className="plant-img">
                                        <img
                                            src={p.img}
                                            alt={`${p.kode} - ${p.nama}`}
                                            loading="lazy"
                                        />
                                        <span className="badge">{p.kode}</span>
                                    </div>
                                    <div className="plant-body">
                                        <h3>{p.nama}</h3>
                                        <p>{p.desk}</p>
                                        <ul>
                                            {p.list.map((l) => (
                                                <li key={l}>
                                                    <Check size={16} />
                                                    {l}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CAMPURAN */}
                <section className="sec">
                    <div className="wrap split">
                        <div className="sec-head" style={{ marginBottom: 0 }}>
                            <h2>Jenis campuran hotmix</h2>
                            <p>
                                Pilihan campuran disesuaikan dengan fungsi
                                lapisan, beban lalu lintas, dan spesifikasi
                                proyek.
                            </p>
                        </div>
                        <div className="mix">
                            {CAMPURAN.map(([k, n, d]) => (
                                <div key={k} className="mix-row">
                                    <b>{k}</b>
                                    <div>
                                        <h3>{n}</h3>
                                        <p>{d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PROSES */}
                <section id="proses" className="sec sec-dark">
                    <div className="wrap">
                        <div className="sec-head">
                            <h2>Cara kerja</h2>
                            <p>
                                Empat langkah dari permintaan sampai material
                                tiba di lokasi.
                            </p>
                        </div>
                        <ol className="steps">
                            {LANGKAH.map((s, i) => (
                                <li key={s.judul}>
                                    <span className="step-n">{i + 1}</span>
                                    <h3>{s.judul}</h3>
                                    <p>{s.desk}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* BANNER */}
                <section className="banner">
                    <img
                        src={IMG.large}
                        alt="Area pekerjaan konstruksi"
                        loading="lazy"
                    />
                    <div className="banner-shade" />
                    <div className="wrap banner-in">
                        <h2>
                            Proyek jalan Anda berikutnya, kami siap kirim
                            materialnya.
                        </h2>
                        <a href="#kontak" className="btn btn-red btn-lg">
                            Minta penawaran <ArrowRight size={18} />
                        </a>
                    </div>
                </section>

                {/* WILAYAH */}
                <section id="wilayah" className="sec sec-alt">
                    <div className="wrap split">
                        <div className="sec-head" style={{ marginBottom: 0 }}>
                            <h2>Wilayah layanan</h2>
                            <p>
                                Berbasis di Kabupaten Banyumas. Melayani
                                kebutuhan material dan pekerjaan infrastruktur
                                di Banyumas Raya dan sekitarnya.
                            </p>
                        </div>
                        <div className="areas">
                            {WILAYAH.map((w) => (
                                <span key={w}>
                                    <MapPin size={16} />
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* KONTAK */}
                <section id="kontak" className="sec contact">
                    <div className="wrap contact-in">
                        <div>
                            <h2>Minta penawaran</h2>
                            <p className="muted">
                                Bahas kebutuhan material, armada, atau produksi
                                bersama {shortName}. Kirim email berisi lokasi,
                                volume, dan target jadwal proyek Anda.
                            </p>
                            <a
                                href={`mailto:${email}`}
                                className="btn btn-red btn-lg contact-btn !text-white"
                            >
                                Kirim email <ArrowRight size={18} />
                            </a>
                        </div>
                        <div className="info">
                            <div>
                                <MapPin size={20} />
                                <div>
                                    <b>Alamat</b>
                                    <p>{address}</p>
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Buka di Google Maps{" "}
                                        <ExternalLink size={13} />
                                    </a>
                                </div>
                            </div>
                            <div>
                                <Phone size={20} />
                                <div>
                                    <b>Telepon</b>
                                    <p>{phone}</p>
                                </div>
                            </div>
                            <div>
                                <Mail size={20} />
                                <div>
                                    <b>Email</b>
                                    <a href={`mailto:${email}`}>{email}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="footer">
                    <div className="wrap footer-in">
                        <div>
                            <b>{shortName}</b>
                            <p>{companyName}</p>
                        </div>
                        <nav>
                            {nav.map(([l, h]) => (
                                <a
                                    key={h}
                                    href={h}
                                    className={
                                        activeSection === h
                                            ? "active"
                                            : undefined
                                    }
                                >
                                    {l}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div className="wrap copy">
                        © {new Date().getFullYear()} {companyName}. Seluruh hak
                        cipta dilindungi.
                    </div>
                </footer>
                <ScrollToTop />
            </div>

            <style>{`
.sbps{--r:#d0141c;--r-l:#ff5a61;--asp:#1d2025;--ink:#14161a;--svc-cta-shadow:#14161a;--bg:#fff;--bg2:#f4f4f1;--card:#fff;--tx:#1d2025;--mut:#5b616b;--line:#e3e3df;
  font-family:Barlow,system-ui,sans-serif;color:var(--tx);background:var(--bg);line-height:1.6;transition:background-color .25s,color .25s}
.sbps-dark{--bg:#14161a;--bg2:#1a1d22;--card:#21252b;--tx:#eceae4;--mut:#a4a9b1;--line:#32373e;--svc-cta-shadow:#fff}
.sbps *{box-sizing:border-box}
.sbps h1,.sbps h2,.sbps h3{font-family:'Barlow Condensed',sans-serif;line-height:1.05;margin:0;font-weight:800;letter-spacing:.005em}
.sbps p{margin:0}.sbps a{color:inherit;text-decoration:none}.sbps ul,.sbps ol{list-style:none;margin:0;padding:0}
.sbps :focus-visible{outline:3px solid var(--r);outline-offset:2px}
.sbps .topbar :focus-visible,.sbps .header :focus-visible,.sbps .hero :focus-visible,.sbps .sec-dark :focus-visible,.sbps .banner :focus-visible,.sbps .svc-cta :focus-visible,.sbps .strip :focus-visible,.sbps .footer :focus-visible{outline-color:#fff}
html{scroll-behavior:smooth}section[id]{scroll-margin-top:84px}
.wrap{width:min(92%,1200px);margin:0 auto}
.hide-sm{display:inline-flex}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 22px;font-weight:700;font-size:15px;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:background-color .2s,color .2s,border-color .2s;font-family:inherit}
.btn-lg{padding:16px 28px;font-size:16px}.btn-block{width:100%}
.btn-red{background:var(--r);color:#fff}.btn-red:hover{background:#a80f16}
.btn-dark{background:var(--ink);color:#fff}.btn-dark:hover{background:#2a2e35}
.btn-ghost{border-color:rgba(255,255,255,.55);color:#fff}.btn-ghost:hover{background:rgba(255,255,255,.14)}
/* topbar + header */
.topbar{background:#0d0f12;color:#c8ccd2;font-size:13px}
.topbar-in{display:flex;justify-content:space-between;gap:16px;padding:8px 0;align-items:center}
.topbar-in span,.topbar-in a{display:inline-flex;align-items:center;gap:6px}
.topbar-right{display:flex;gap:22px}.topbar a:hover{color:var(--r-l)}
.header{position:sticky;top:0;z-index:50;background:var(--bg);color:var(--tx);border-bottom:4px solid var(--r)}
.header-in{display:flex;align-items:center;justify-content:space-between;height:72px;gap:20px}
.brand{display:flex;align-items:center;gap:12px}
.brand-mark{display:grid;place-items:center;width:42px;height:42px;background:var(--r);color:#fff;font:800 26px 'Barlow Condensed',sans-serif;border-radius:4px}
.brand b{display:block;font:800 24px/1 'Barlow Condensed',sans-serif;letter-spacing:.04em}
.brand small{display:block;font-size:11px;color:var(--tx);margin-top:2px}
.nav{display:flex;gap:28px;font-weight:600;font-size:15px}.nav a:hover{color:var(--r-l)}
.nav a.active,.mnav a.active,.footer nav a.active{color:var(--r)}
.header-act{display:flex;align-items:center;gap:12px}
.icon-btn{display:grid;place-items:center;width:40px;height:40px;border-radius:6px;border:1px solid var(--line);background:transparent;color:inherit;cursor:pointer}
.icon-btn:hover{border-color:var(--r-l);color:var(--r-l)}
.menu-btn{display:none}
.mnav{display:none;flex-direction:column;gap:4px;padding:12px 4%;background:var(--bg);border-top:1px solid var(--line);color:var(--tx)}
.mnav a:not(.btn){padding:12px 0;border-bottom:1px solid var(--line);font-weight:600}
.mnav .btn{margin-top:10px}
/* hero */
.hero{position:relative;background:var(--asp);color:#fff;overflow:hidden}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(13,15,18,.92) 0%,rgba(13,15,18,.72) 55%,rgba(13,15,18,.4) 100%)}
.hero-in{position:relative;display:grid;grid-template-columns:1.35fr .65fr;gap:56px;align-items:center;padding:96px 0 120px}
.tag{display:inline-block;background:var(--r);color:#fff;font-weight:700;font-size:14px;padding:5px 12px;border-radius:3px;margin-bottom:22px}
.hero h1{font-size:clamp(46px,7vw,92px);text-transform:uppercase;max-width:14ch}
.lead{margin-top:24px;max-width:56ch;font-size:18px;color:rgba(255,255,255,.85)}
.hero-cta{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.hero-card{background:#fff;color:#1d2025;border-top:6px solid var(--r);padding:28px;border-radius:6px}
.hero-card h2{font-size:30px;margin-bottom:16px;color:#14161a}
.hero-card li{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #e6e6e2;font-weight:600;font-size:15px}
.hero-card li svg{flex:none;margin-top:4px;color:var(--r)}
.hero-card .btn{margin-top:22px}
.roadline{position:absolute;left:0;right:0;bottom:34px;height:6px;background:repeating-linear-gradient(90deg,var(--r) 0 46px,transparent 46px 92px)}
.hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:34px;background:#0d0f12}
/* strip */
.strip{background:var(--r);color:#fff}
.strip-in{display:grid;grid-template-columns:repeat(3,1fr)}
.strip-in div{display:flex;align-items:center;gap:14px;padding:20px 18px;border-right:2px solid rgba(255,255,255,.28)}
.strip-in div:last-child{border:0}
.strip-in b{font:800 38px/1 'Barlow Condensed',sans-serif}.strip-in span{font-weight:600;font-size:15px;line-height:1.3}
/* sections */
.sec{padding:96px 0;background:var(--bg)}.sec-alt{background:var(--bg2)}
.sec-dark{background:var(--asp);color:#fff}
.sec-head{max-width:640px;margin-bottom:48px}
.sec-head h2{font-size:clamp(36px,5vw,56px);text-transform:uppercase}
.sec-head p{margin-top:16px;color:var(--mut);font-size:17px}
.sec-dark .sec-head p{color:#aab0b8}
.split{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.muted{color:var(--mut)}
/* services */
.grid-svc{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.svc{background:var(--card);border:1px solid var(--line);border-bottom:4px solid var(--r);border-radius:6px;padding:28px}
.svc-icon{display:grid;place-items:center;width:52px;height:52px;background:var(--r);color:#fff;border-radius:6px;margin-bottom:18px}
.svc h3{font-size:26px;margin-bottom:10px}.svc p{color:var(--mut);font-size:15px}
.svc-cta{background:var(--r);border-color:var(--r);border-bottom-color:var(--svc-cta-shadow);color:#fff;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:14px}
.svc-cta p{color:rgba(255,255,255,.92)}
/* plants */
.plants{display:grid;gap:28px}
.plant{display:grid;grid-template-columns:1fr 1fr;background:var(--card);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.plant-img{position:relative;min-height:300px}
.plant-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.badge{position:absolute;left:20px;bottom:20px;background:var(--r);color:#fff;font:800 26px/1 'Barlow Condensed',sans-serif;padding:8px 16px;border-radius:3px}
.plant-body{padding:44px;display:flex;flex-direction:column;justify-content:center}
.plant-rev .plant-img{order:2}
.plant h3{font-size:38px;text-transform:uppercase}.plant-body>p{color:var(--mut);margin-top:14px;max-width:46ch}
.plant ul{margin-top:20px;display:grid;gap:8px}
.plant li{display:flex;gap:10px;align-items:center;font-weight:600;font-size:15px}.plant li svg{color:var(--r);flex:none}
.sbps-dark .plant li svg,.sbps-dark .areas svg,.sbps-dark .info svg{color:var(--r-l)}
/* mix */
.mix{display:grid;gap:16px}
.mix-row{display:flex;gap:22px;align-items:center;background:var(--bg2);border-left:8px solid var(--r);padding:24px;border-radius:4px}
.mix-row b{font:800 44px/1 'Barlow Condensed',sans-serif;min-width:96px}
.mix-row h3{font-size:22px;margin-bottom:4px}.mix-row p{color:var(--mut);font-size:15px}
/* steps */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative}
.steps li{position:relative;padding-top:8px}
.steps li:not(:last-child)::after{content:"";position:absolute;top:30px;left:64px;right:-12px;border-top:3px dashed var(--r);opacity:.8}
.step-n{position:relative;z-index:1;display:grid;place-items:center;width:46px;height:46px;background:var(--r);color:#fff;font:800 26px 'Barlow Condensed',sans-serif;border-radius:50%;margin-bottom:20px}
.steps h3{font-size:26px;margin-bottom:8px}.steps p{color:#aab0b8;font-size:15px}
/* banner */
.banner{position:relative;overflow:hidden;background:var(--asp);color:#fff;min-height:380px;display:flex;align-items:center}
.banner img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.banner-shade{position:absolute;inset:0;background:rgba(13,15,18,.78)}
.banner::before,.banner::after{content:"";position:absolute;left:0;right:0;height:14px;z-index:2;background:repeating-linear-gradient(-45deg,var(--r) 0 18px,#fff 18px 36px)}
.banner::before{top:0}.banner::after{bottom:0}
.banner-in{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:32px;padding:70px 0}
.banner h2{font-size:clamp(34px,5vw,58px);text-transform:uppercase;max-width:18ch}
/* areas */
.areas{display:flex;flex-wrap:wrap;gap:12px}
.areas span{display:inline-flex;gap:8px;align-items:center;background:var(--card);border:1px solid var(--line);padding:14px 20px;border-radius:999px;font-weight:700}
.areas svg{color:var(--r)}
/* contact */
.contact{background:var(--bg)}
.contact-in{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.contact h2{font-size:clamp(36px,5vw,56px);text-transform:uppercase;margin-bottom:16px}
.contact-btn{margin-top:28px}
.info{border-top:1px solid var(--line)}
.info>div{display:flex;gap:16px;padding:20px 0;border-bottom:1px solid var(--line)}
.info svg{flex:none;color:var(--r);margin-top:3px}
.info b{display:block;margin-bottom:2px}.info p{color:var(--mut);font-size:15px;max-width:44ch}
.info a{font-size:14px;font-weight:600;display:inline-flex;gap:6px;align-items:center;margin-top:6px}.info a:hover{text-decoration:underline}
/* footer */
.footer{background:#0d0f12;color:#fff;border-top:4px solid var(--r)}
.footer-in{display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;padding:44px 0 32px}
.footer b{font:800 34px 'Barlow Condensed',sans-serif;letter-spacing:.04em}.footer p{color:#8b9199;font-size:13px}
.footer nav{display:flex;gap:26px;flex-wrap:wrap;font-size:14px;color:#aab0b8;align-items:flex-end}.footer nav a:hover{color:var(--r-l)}
.copy{border-top:1px solid rgba(255,255,255,.1);padding:18px 0;font-size:12px;color:#8b9199}
/* responsive */
@media(max-width:1023px){
 .nav{display:none}.menu-btn{display:grid}.mnav{display:flex}
 .hero-in{grid-template-columns:1fr;padding:64px 0 100px}.hero-card{max-width:460px}
 .grid-svc{grid-template-columns:repeat(2,1fr)}
 .split,.contact-in{grid-template-columns:1fr;gap:40px}
 .steps{grid-template-columns:repeat(2,1fr);row-gap:40px}.steps li::after{display:none}
 .plant,.plant-rev{grid-template-columns:1fr}.plant-rev .plant-img{order:0}.plant-img{min-height:240px}
 .banner-in{flex-direction:column;align-items:flex-start}
}
@media(max-width:640px){
 .topbar{display:none}.hide-sm{display:none}.brand small{display:none}
 .sec{padding:64px 0}.grid-svc{grid-template-columns:1fr}.steps{grid-template-columns:1fr}
 .strip-in{grid-template-columns:1fr}.strip-in div{border-right:0;border-bottom:2px solid rgba(255,255,255,.28);padding:14px 4px}
 .plant-body{padding:28px}.mix-row{flex-direction:column;align-items:flex-start;gap:8px}
 .hero-cta .btn{width:100%}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.sbps *{transition-duration:.01ms!important}}
            `}</style>
        </>
    );
}
