import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    PortalMotionStyles,
    focusRing,
    getPortalView,
    groups,
    normalize,
    searchRoles,
} from '@/Components/PortalDisplay';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ChevronDown, Search, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const groupLabel = Object.fromEntries(groups.map((g) => [g.key, g.title]));

/**
 * Tinggi layar penuh hanya dipakai di desktop/laptop yang cukup tinggi.
 * Pada layar pendek atau kecil, halaman kembali normal (bisa digulir)
 * supaya tulisan tidak dikecilkan dan tidak ada yang terpotong.
 */
function ViewportStyles() {
    return (
        <style>{`
            @media (min-width: 1024px) and (min-height: 600px) {
                .portal-viewport { height: 100vh; height: 100dvh; overflow: hidden; }
                .portal-main { overflow-y: auto; }
                .portal-grid { margin-block: auto; grid-template-rows: repeat(2, minmax(18rem, 1fr)); }
            }
        `}</style>
    );
}

function PortalCard({ portal, hits, dimmed, delay }) {
    const { Icon, styles, number, group, title, summary } = getPortalView(portal);
    const roles = portal.roles || [];
    const found = hits.length > 0;

    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const closeRef = useRef(null);
    const panelId = `roles-${portal.slug}`;

    useEffect(() => {
        if (open) closeRef.current?.focus();
    }, [open]);

    const close = () => {
        setOpen(false);
        triggerRef.current?.focus();
    };

    return (
        <article
            style={{ animationDelay: `${delay}ms` }}
            onKeyDown={(e) => {
                if (e.key === 'Escape' && open) close();
            }}
            className={`portal-rise group relative flex min-h-[18rem] flex-col border-2 border-neutral-900 bg-white transition-all duration-200 motion-reduce:transition-none ${
                found
                    ? `shadow-bw-md ring-2 ${styles.ring}`
                    : 'shadow-bw-sm hover:-translate-y-0.5 hover:shadow-bw-md motion-reduce:hover:transform-none'
            } ${dimmed ? 'opacity-50' : ''}`}
        >
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center text-white transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transition-none motion-reduce:group-hover:transform-none ${styles.solid}`}
                    >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold leading-5 text-neutral-600">
                            {groupLabel[group]} &middot; {number}
                        </p>
                        <h2 className="mt-1 break-words text-lg font-black leading-tight text-neutral-900">
                            {title}
                        </h2>
                    </div>
                </div>

                <p
                    title={summary}
                    className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-neutral-700"
                >
                    {summary}
                </p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t-2 border-neutral-900 pt-4">
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-neutral-900">
                        {found ? (
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2
                                    className="h-4 w-4 shrink-0 text-green-700"
                                    aria-hidden="true"
                                />
                                <span className={`${styles.soft} px-1 font-black`}>
                                    Jabatan Anda: {hits.join(', ')}
                                </span>
                            </span>
                        ) : (
                            <>
                                <span className="font-black">Untuk: </span>
                                {roles.slice(0, 2).join(', ')}
                            </>
                        )}
                    </p>

                    {roles.length > 0 && (
                        <button
                            ref={triggerRef}
                            type="button"
                            onClick={() => setOpen(true)}
                            aria-expanded={open}
                            aria-controls={panelId}
                            className={`inline-flex min-h-[36px] shrink-0 items-center gap-1 text-sm font-bold underline underline-offset-4 ${styles.link} ${focusRing}`}
                        >
                            Semua jabatan ({roles.length})
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            <Link
                href={route('portal.login', portal.slug)}
                aria-label={`Buka portal ${title}`}
                className={`group/btn flex h-11 shrink-0 items-center justify-between border-t-2 border-neutral-900 px-4 text-base font-black text-white transition-colors active:translate-y-px ${styles.button} ${focusRing}`}
            >
                <span>Buka Portal</span>
                <ArrowRight
                    className="h-5 w-5 transition-transform duration-200 group-hover/btn:translate-x-1 motion-reduce:transition-none"
                    aria-hidden="true"
                />
            </Link>

            {/* Daftar lengkap jabatan: menutupi isi kartu, tombol masuk tetap terlihat */}
            {open && (
                <div
                    id={panelId}
                    role="region"
                    aria-label={`Semua jabatan di portal ${title}`}
                    className="portal-rise absolute inset-x-0 top-0 bottom-11 z-10 flex flex-col border-x-2 border-t-2 border-neutral-900 bg-white p-5"
                >
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-black">
                            Semua jabatan ({roles.length})
                        </p>
                        <button
                            ref={closeRef}
                            type="button"
                            onClick={close}
                            className={`inline-flex min-h-[36px] items-center gap-1 border-2 border-neutral-900 px-3 text-sm font-black hover:bg-neutral-900 hover:text-white ${focusRing}`}
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                            Tutup
                        </button>
                    </div>
                    <ul className="mt-2 grid flex-1 content-start gap-x-4 gap-y-1 overflow-y-auto text-sm font-semibold sm:grid-cols-2">
                        {roles.map((role) => (
                            <li
                                key={role}
                                className={
                                    hits.includes(role)
                                        ? `${styles.soft} font-black`
                                        : ''
                                }
                            >
                                {role}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
}

export default function PortalIndex({ portals = [] }) {
    const [query, setQuery] = useState('');

    const searching = normalize(query) !== '';
    const hitsBySlug = useMemo(() => searchRoles(portals, query), [portals, query]);
    const matchedCount = Object.keys(hitsBySlug).length;
    const notFound = searching && matchedCount === 0;

    // Urutan tampil: internal dulu, lalu eksternal, agar grid 3x2 tetap rapi.
    const ordered = groups.flatMap((g) =>
        portals.filter((p) => getPortalView(p).group === g.key),
    );

    return (
        <>
            <Head title="Pilih Portal" />
            <PortalMotionStyles />
            <ViewportStyles />

            <div className="portal-viewport flex min-h-dvh flex-col bg-neutral-100 text-neutral-900">
                <header className="flex h-14 shrink-0 items-center border-b-2 border-neutral-900 bg-white px-4 sm:px-6 lg:px-10">
                    <Link
                        href="/"
                        aria-label="SBPS System, ke halaman awal"
                        className={`flex items-center gap-3 ${focusRing}`}
                    >
                        <ApplicationLogo className="h-9 w-9 fill-current text-red-600" />
                        <span className="text-lg font-black tracking-tight">SBPS System</span>
                    </Link>
                </header>

                <section className="flex shrink-0 flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:px-10 lg:py-7">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                            Selamat Datang di SBPS Web Companion
                        </h1>
                        <p
                            role="status"
                            aria-live="polite"
                            className="mt-2 text-sm font-semibold text-neutral-700 sm:text-base"
                        >
                            {notFound ? (
                                <span className="inline-flex items-center gap-1.5 text-neutral-900">
                                    <SearchX className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    Jabatan tidak ditemukan. Hubungi administrator SBPS.
                                </span>
                            ) : searching ? (
                                <span className="inline-flex items-center gap-1.5 text-green-800">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    Jabatan ditemukan di {matchedCount} portal.
                                </span>
                            ) : (
                                'Pilih bagian kerja Anda untuk melanjutkan.'
                            )}
                        </p>
                    </div>

                    <div className="relative w-full lg:max-w-[34rem] lg:flex-1">
                        <label htmlFor="role-search" className="sr-only">
                            Cari jabatan Anda
                        </label>
                        <Search
                            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-600"
                            aria-hidden="true"
                        />
                        <input
                            id="role-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari jabatan Anda, misalnya Mandor Proyek..."
                            autoComplete="off"
                            className="block h-12 w-full rounded-none border-2 border-neutral-900 bg-white pl-11 pr-12 text-base font-semibold text-neutral-900 shadow-bw-sm transition-shadow duration-200 placeholder:font-medium placeholder:text-neutral-500 focus:border-neutral-900 focus:shadow-bw-md focus:outline-none focus:ring-4 focus:ring-red-600/40 motion-reduce:transition-none [&::-webkit-search-cancel-button]:hidden"
                        />
                        {searching && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Hapus pencarian"
                                className={`absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-black ${focusRing}`}
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </section>

                <main className="portal-main flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6 lg:px-10 lg:pb-8">
                    <div className="portal-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {ordered.map((portal, i) => {
                            const hits = hitsBySlug[portal.slug] || [];
                            return (
                                <PortalCard
                                    key={portal.slug}
                                    portal={portal}
                                    hits={hits}
                                    dimmed={searching && matchedCount > 0 && hits.length === 0}
                                    delay={40 + i * 40}
                                />
                            );
                        })}
                    </div>
                </main>

                <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t-2 border-neutral-900 bg-white px-4 py-3 text-xs font-medium text-neutral-700 sm:px-6 sm:text-sm lg:px-10">
                    <span>Jabatan tidak ditemukan? Hubungi administrator SBPS.</span>
                    <span>&copy; {new Date().getFullYear()} SBPS Multi-Unit Enterprise</span>
                </footer>
            </div>
        </>
    );
}
