import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, router, Link } from '@inertiajs/react';
import {
    Shield,
    Truck,
    Factory,
    Wallet,
    Users,
    ClipboardList,
    ArrowRight,
    LogOut,
} from 'lucide-react';

const iconMap = {
    Shield,
    Truck,
    Factory,
    Wallet,
    Users,
    ClipboardList,
};

const colorStyles = {
    red: {
        card: 'border-red-600 hover:bg-red-50 hover:border-red-700',
        icon: 'bg-red-600',
        divider: 'border-red-600',
        role: 'text-red-700',
        arrow: 'text-red-600',
    },
    blue: {
        card: 'border-blue-600 hover:bg-blue-50 hover:border-blue-700',
        icon: 'bg-blue-600',
        divider: 'border-blue-600',
        role: 'text-blue-700',
        arrow: 'text-blue-600',
    },
    green: {
        card: 'border-green-600 hover:bg-green-50 hover:border-green-700',
        icon: 'bg-green-600',
        divider: 'border-green-600',
        role: 'text-green-700',
        arrow: 'text-green-600',
    },
    amber: {
        card: 'border-amber-500 hover:bg-amber-50 hover:border-amber-600',
        icon: 'bg-amber-500',
        divider: 'border-amber-500',
        role: 'text-amber-700',
        arrow: 'text-amber-500',
    },
    purple: {
        card: 'border-purple-600 hover:bg-purple-50 hover:border-purple-700',
        icon: 'bg-purple-600',
        divider: 'border-purple-600',
        role: 'text-purple-700',
        arrow: 'text-purple-600',
    },
    teal: {
        card: 'border-teal-600 hover:bg-teal-50 hover:border-teal-700',
        icon: 'bg-teal-600',
        divider: 'border-teal-600',
        role: 'text-teal-700',
        arrow: 'text-teal-600',
    },
};

export default function PortalSelect({ portals }) {
    const handleSelect = (slug) => {
        router.post(route('portal.pilih', slug));
    };

    return (
        <>
            <Head title="Pilih Portal" />

            <div className="flex min-h-screen flex-col bg-white">
                {/* Top bar */}
                <header className="border-b-2 border-black">
                    <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center gap-3">
                            <ApplicationLogo className="h-9 w-9 fill-current text-red-500" />
                            <span className="text-base font-black tracking-tight text-black">
                                SBPS System
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => router.post(route('logout'))}
                            className="flex items-center gap-2 rounded-none border-2 border-black px-3 py-1.5 text-xs font-black text-black transition-all hover:bg-black hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </header>

                {/* Main: dipusatkan secara vertikal supaya tidak menggantung di atas */}
                <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                    <div className="w-full max-w-5xl">
                        {/* Heading */}
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl font-black tracking-tight text-black">
                                Pilih portal
                            </h1>
                            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-ink-secondary">
                                Masuk ke bagian sistem yang sesuai dengan peran akun Anda.
                            </p>
                        </div>

                        {/* Cards: flex-wrap + justify-center agar baris terakhir
                            (atau jumlah portal yang sedikit) tetap simetris */}
                        <div className="flex flex-wrap justify-center gap-4">
                            {portals.map((portal) => {
                                const Icon = iconMap[portal.icon] || Shield;
                                const styles = colorStyles[portal.color] || colorStyles.red;

                                return (
                                    <button
                                        key={portal.slug}
                                        type="button"
                                        onClick={() => handleSelect(portal.slug)}
                                        className={`group flex min-h-[260px] w-full flex-col rounded-none border-2 bg-white text-left shadow-bw-sm transition-all hover:shadow-bw-md sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] ${styles.card}`}
                                    >
                                        {/* Body */}
                                        <div className="flex flex-1 flex-col p-6">
                                            <div className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center ${styles.icon}`}>
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>

                                            <h2 className="mb-2 text-lg font-black text-black">
                                                {portal.name}
                                            </h2>

                                            <p className="text-xs font-semibold leading-relaxed text-ink-secondary">
                                                {portal.description}
                                            </p>
                                        </div>

                                        {/* Footer seragam: peran di kiri, aksi di kanan */}
                                        <div className={`flex items-center justify-between gap-3 border-t-2 px-6 py-3 ${styles.divider}`}>
                                            <span className={`truncate text-[11px] font-black ${styles.role}`}>
                                                {portal.matchedRole
                                                    ? `Sebagai ${portal.matchedRole}`
                                                    : 'Masuk'}
                                            </span>
                                            <span className={`flex shrink-0 items-center gap-1 text-xs font-bold ${styles.arrow}`}>
                                                Masuk
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t-2 border-black py-4">
                    <p className="text-center text-xs text-ink-tertiary">
                        &copy; {new Date().getFullYear()} SBPS Multi-Unit Enterprise
                    </p>
                </footer>
            </div>
        </>
    );
}
