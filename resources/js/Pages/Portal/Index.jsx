import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, Head } from '@inertiajs/react';
import {
    Shield,
    Truck,
    Factory,
    Wallet,
    Users,
    ClipboardList,
    ArrowRight,
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
        badge: 'bg-red-100 text-red-700',
        arrow: 'text-red-600 group-hover:translate-x-1',
    },
    blue: {
        card: 'border-blue-600 hover:bg-blue-50 hover:border-blue-700',
        icon: 'bg-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        arrow: 'text-blue-600 group-hover:translate-x-1',
    },
    green: {
        card: 'border-green-600 hover:bg-green-50 hover:border-green-700',
        icon: 'bg-green-600',
        badge: 'bg-green-100 text-green-700',
        arrow: 'text-green-600 group-hover:translate-x-1',
    },
    amber: {
        card: 'border-amber-500 hover:bg-amber-50 hover:border-amber-600',
        icon: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700',
        arrow: 'text-amber-500 group-hover:translate-x-1',
    },
    purple: {
        card: 'border-purple-600 hover:bg-purple-50 hover:border-purple-700',
        icon: 'bg-purple-600',
        badge: 'bg-purple-100 text-purple-700',
        arrow: 'text-purple-600 group-hover:translate-x-1',
    },
    teal: {
        card: 'border-teal-600 hover:bg-teal-50 hover:border-teal-700',
        icon: 'bg-teal-600',
        badge: 'bg-teal-100 text-teal-700',
        arrow: 'text-teal-600 group-hover:translate-x-1',
    },
};

export default function PortalIndex({ portals }) {
    return (
        <>
            <Head title="Pilih Portal" />

            <div className="flex min-h-screen flex-col items-center bg-white px-4 py-12 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="mb-8 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center">
                        <ApplicationLogo className="h-12 w-12 fill-current text-red-500" />
                    </div>
                </Link>

                {/* Title */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black tracking-tight text-black">
                        SBPS System
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-ink-secondary">
                        Pilih portal untuk masuk ke sistem
                    </p>
                </div>

                {/* Portal Cards Grid */}
                <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {portals.map((portal) => {
                        const Icon = iconMap[portal.icon] || Shield;
                        const styles = colorStyles[portal.color] || colorStyles.red;

                        return (
                            <Link
                                key={portal.slug}
                                href={route('portal.login', portal.slug)}
                                className={`group relative flex flex-col items-start rounded-none border-2 bg-white p-6 shadow-bw-sm transition-all hover:shadow-bw-md ${styles.card}`}
                            >
                                {/* Icon */}
                                <div className={`mb-4 flex h-12 w-12 items-center justify-center ${styles.icon}`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>

                                {/* Name */}
                                <h2 className="mb-2 text-lg font-black text-black">
                                    {portal.name}
                                </h2>

                                {/* Description */}
                                <p className="mb-6 flex-1 text-xs font-semibold leading-relaxed text-ink-secondary">
                                    {portal.description}
                                </p>

                                {/* Arrow */}
                                <div className={`flex items-center gap-1 text-xs font-bold transition-transform ${styles.arrow}`}>
                                    <span>Masuk</span>
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer */}
                <p className="mt-10 text-center text-xs text-ink-tertiary">
                    &copy; {new Date().getFullYear()} SBPS Multi-Unit Enterprise
                </p>
            </div>
        </>
    );
}
