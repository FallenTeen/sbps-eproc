import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    PortalMotionStyles,
    focusRing,
    getPortalView,
} from '@/Components/PortalDisplay';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function PortalSelect({ portals }) {
    const userName = usePage().props?.auth?.user?.name;
    const [choosing, setChoosing] = useState(null);

    const handleSelect = (slug) => {
        if (choosing) return;

        router.post(
            route('portal.pilih', slug),
            {},
            {
                onStart: () => setChoosing(slug),
                onFinish: () => setChoosing(null),
            },
        );
    };

    return (
        <>
            <Head title="Pilih Portal" />
            <PortalMotionStyles />

            <div className="flex min-h-screen flex-col bg-neutral-100 text-neutral-900">
                {/* Bilah atas: status login */}
                <header className="border-b-4 border-neutral-900 bg-white">
                    <div className="mx-auto flex min-h-[72px] w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                        <Link
                            href="/"
                            aria-label="SBPS System, ke halaman awal"
                            className={`flex items-center gap-3 ${focusRing}`}
                        >
                            <ApplicationLogo className="h-10 w-10 fill-current text-red-600" />
                            <span className="text-lg font-black">SBPS System</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {userName && (
                                <p className="hidden items-center gap-2 text-sm font-bold sm:flex">
                                    <BadgeCheck className="h-5 w-5 text-green-700" aria-hidden="true" />
                                    <span>Anda masuk sebagai {userName}</span>
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => router.post(route('logout'))}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-none border-2 border-neutral-900 bg-white px-4 text-sm font-black transition-colors hover:bg-neutral-900 hover:text-white active:translate-y-px ${focusRing}`}
                            >
                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                Keluar
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                    <div className="w-full max-w-5xl">
                        <div className="portal-rise mb-8 text-center">
                            {userName && (
                                <p className="mb-2 text-base font-bold sm:hidden">
                                    Anda masuk sebagai {userName}
                                </p>
                            )}
                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                                Pilih bagian kerja
                            </h1>
                            <p className="mx-auto mt-2 max-w-xl text-lg font-semibold text-neutral-800">
                                Anda memiliki akses ke beberapa bagian sistem.
                            </p>
                            <p className="mx-auto mt-1 max-w-xl text-base font-medium text-neutral-700">
                                Pilih bagian yang ingin Anda kerjakan sekarang. Anda bisa
                                berpindah bagian kapan saja dengan masuk kembali.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6">
                            {portals.map((portal, i) => {
                                const { Icon, styles, number, title, summary } =
                                    getPortalView(portal);
                                const busy = choosing === portal.slug;

                                return (
                                    <article
                                        key={portal.slug}
                                        style={{ animationDelay: `${80 + i * 60}ms` }}
                                        className="portal-rise group flex w-full flex-col border-2 border-neutral-900 bg-white shadow-bw-sm transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-bw-md motion-reduce:transition-none motion-reduce:hover:transform-none md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                                    >
                                        <div className={`h-2 w-full ${styles.solid}`} aria-hidden="true" />

                                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                                            <div className="mb-4 flex items-center gap-4">
                                                <div
                                                    className={`flex h-14 w-14 shrink-0 items-center justify-center text-white transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transition-none motion-reduce:group-hover:transform-none ${styles.solid}`}
                                                >
                                                    <Icon className="h-7 w-7" aria-hidden="true" />
                                                </div>
                                                <div className="min-w-0">
                                                    {number && (
                                                        <p className="text-sm font-bold text-neutral-600">
                                                            Portal {number}
                                                        </p>
                                                    )}
                                                    <h2 className="text-xl font-black leading-tight break-words">
                                                        {title}
                                                    </h2>
                                                </div>
                                            </div>

                                            <p className="text-[15px] font-medium leading-relaxed text-neutral-700">
                                                {summary}
                                            </p>

                                            {portal.matchedRole && (
                                                <p className={`mt-5 border-l-4 py-1 pl-3 text-base font-black ${styles.border} ${styles.text}`}>
                                                    Jabatan: {portal.matchedRole}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelect(portal.slug)}
                                            disabled={choosing !== null}
                                            aria-label={`Pilih portal ${title}`}
                                            className={`group/btn flex min-h-[56px] w-full items-center justify-between border-t-2 border-neutral-900 px-5 text-base font-black text-white transition-colors active:translate-y-px disabled:cursor-wait disabled:opacity-70 sm:px-6 ${styles.button} ${focusRing}`}
                                        >
                                            <span>{busy ? 'Membuka...' : 'Pilih Portal'}</span>
                                            <ArrowRight
                                                className="h-5 w-5 transition-transform duration-200 group-hover/btn:translate-x-1 motion-reduce:transition-none"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </main>

                <footer className="border-t-2 border-neutral-900 bg-white py-4">
                    <p className="text-center text-sm font-medium text-neutral-600">
                        &copy; {new Date().getFullYear()} SBPS Multi-Unit Enterprise
                    </p>
                </footer>
            </div>
        </>
    );
}
