import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Shield,
    Truck,
    Factory,
    Wallet,
    Users,
    ClipboardList,
    ArrowLeft,
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
        header: 'bg-red-600',
        button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        link: 'text-red-600 hover:text-red-700',
        iconBg: 'bg-red-700',
    },
    blue: {
        header: 'bg-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        link: 'text-blue-600 hover:text-blue-700',
        iconBg: 'bg-blue-700',
    },
    green: {
        header: 'bg-green-600',
        button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        link: 'text-green-600 hover:text-green-700',
        iconBg: 'bg-green-700',
    },
    amber: {
        header: 'bg-amber-500',
        button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500',
        link: 'text-amber-500 hover:text-amber-600',
        iconBg: 'bg-amber-600',
    },
    purple: {
        header: 'bg-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        link: 'text-purple-600 hover:text-purple-700',
        iconBg: 'bg-purple-700',
    },
    teal: {
        header: 'bg-teal-600',
        button: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500',
        link: 'text-teal-600 hover:text-teal-700',
        iconBg: 'bg-teal-700',
    },
};

export default function PortalLogin({ portal, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const Icon = iconMap[portal.icon] || Shield;
    const styles = colorStyles[portal.color] || colorStyles.red;

    const submit = (e) => {
        e.preventDefault();

        post(route('portal.login.store', portal.slug), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center bg-white pt-6 sm:justify-center sm:pt-0">
            <Head title={`Login — ${portal.name}`} />

            {/* Logo + Back */}
            <div className="mb-6 flex items-center gap-4">
                <Link
                    href={route('portal')}
                    className="flex items-center gap-1 text-xs font-bold text-ink-secondary hover:text-black"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Portal
                </Link>
                <div className="h-4 w-px bg-ink-tertiary/30" />
                <Link href="/" className="flex items-center gap-2">
                    <ApplicationLogo className="h-8 w-8 fill-current text-red-500" />
                </Link>
            </div>

            {/* Login Card */}
            <div className="w-full overflow-hidden bg-white shadow-bw-md sm:max-w-md">
                {/* Colored Header */}
                <div className={`${styles.header} px-8 py-6`}>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center ${styles.iconBg}`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white">
                                {portal.name}
                            </h1>
                            <p className="text-xs font-semibold text-white/80">
                                SBPS System
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div>
                            <InputLabel htmlFor="email" value="Email" />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Password" />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mt-4 block">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                />
                                <span className="ms-2 text-sm text-gray-600">
                                    Ingat saya
                                </span>
                            </label>
                        </div>

                        <div className="mt-6 flex items-center justify-end">
                            <Link
                                href={route('password.request')}
                                className={`text-sm font-semibold ${styles.link}`}
                            >
                                Lupa password?
                            </Link>

                            <PrimaryButton
                                className={`ms-4 rounded-none ${styles.button}`}
                                disabled={processing}
                            >
                                Masuk
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
