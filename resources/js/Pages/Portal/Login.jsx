import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {
    PortalMotionStyles,
    focusRing,
    getPortalView,
} from '@/Components/PortalDisplay';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function PortalLogin({ portal, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const { Icon, styles, number, title, summary } = getPortalView(portal);

    const submit = (e) => {
        e.preventDefault();

        post(route('portal.login.store', portal.slug), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center bg-neutral-100 px-4 py-8 sm:justify-center">
            <Head title={`Login - ${title}`} />
            <PortalMotionStyles />

            {/* Kembali + logo */}
            <div className="portal-rise mb-6 flex w-full max-w-lg items-center justify-between">
                <Link
                    href={route('portal')}
                    className={`inline-flex min-h-[44px] items-center gap-2 border-2 border-neutral-900 bg-white px-4 text-sm font-black text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white active:translate-y-px ${focusRing}`}
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Kembali ke daftar portal
                </Link>
                <Link
                    href="/"
                    aria-label="SBPS System, ke halaman awal"
                    className={focusRing}
                >
                    <ApplicationLogo className="h-10 w-10 fill-current text-red-600" />
                </Link>
            </div>

            <div
                className={`portal-rise w-full max-w-lg overflow-hidden border-2 border-neutral-900 bg-white shadow-bw-md`}
                style={{ animationDelay: '80ms' }}
            >
                {/* Identitas portal */}
                <div className={`${styles.solid} border-b-2 border-neutral-900 px-6 py-6 sm:px-8`}>
                    <p className="mb-3 text-sm font-bold text-white">
                        Anda sedang masuk ke portal
                    </p>
                    <div className="flex items-center gap-4">
                        <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center border-2 border-white text-white ${styles.solidDark}`}
                        >
                            <Icon className="h-7 w-7" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-black leading-tight text-white break-words">
                                {title}
                            </h1>
                            {number && (
                                <p className="text-sm font-bold text-white/90">
                                    Portal {number} &middot; SBPS System
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="mt-4 text-[15px] font-medium leading-relaxed text-white">
                        {summary}
                    </p>
                </div>

                {/* Form */}
                <div className="p-6 sm:p-8">
                    <p className="mb-5 text-base font-bold text-neutral-900">
                        Masukkan email dan password akun Anda.
                    </p>

                    {status && (
                        <div className="mb-4 text-sm font-semibold text-green-700" role="status">
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
                                className="mt-1 block min-h-[48px] w-full text-base"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Password" />

                            <div className="relative mt-1">
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className="block min-h-[48px] w-full pe-12 text-base"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                                    className={`absolute inset-y-0 end-0 flex w-12 items-center justify-center text-neutral-700 hover:text-black ${focusRing}`}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mt-4 block">
                            <label className="flex min-h-[44px] items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                />
                                <span className="ms-2 text-base text-neutral-800">
                                    Ingat saya
                                </span>
                            </label>
                        </div>

                        <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <Link
                                href={route('password.request')}
                                className={`inline-flex min-h-[44px] items-center justify-center text-base font-bold underline underline-offset-4 ${styles.link} ${focusRing}`}
                            >
                                Lupa password?
                            </Link>

                            <PrimaryButton
                                className={`min-h-[48px] justify-center rounded-none px-8 text-base normal-case tracking-normal active:translate-y-px ${styles.button}`}
                                disabled={processing}
                            >
                                {processing ? 'Memproses...' : 'Masuk'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
