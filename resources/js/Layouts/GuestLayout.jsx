import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-white pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <div className="flex h-20 w-20 items-center justify-center text-black">
                        <ApplicationLogo className="h-12 w-12 fill-current text-red-500" />
                    </div>
                </Link>
            </div>

            <div className="mt-6 p-8 rounded-md w-full overflow-hidden bg-white shadow-bw-md sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
