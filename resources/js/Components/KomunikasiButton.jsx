import { Link, usePage } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';

function hasPermission(userPermissions, required) {
    if (!required) return true;
    const list = Array.isArray(required) ? required : [required];
    return list.some((p) => userPermissions.includes(p));
}

export default function KomunikasiButton() {
    const { auth } = usePage().props;
    const roles = auth?.roles || [];
    const userPermissions = auth?.permissions || [];

    const allowed =
        !roles.includes('Kontraktor') &&
        hasPermission(userPermissions, ['manage proyek', 'view proyek']);

    if (!allowed) return null;

    return (
        <Link
            href={route('komunikasi.index')}
            className="relative flex items-center justify-center w-9 h-9 rounded-md bg-white text-black hover:bg-black hover:text-white transition-all shadow-bw-sm"
            title="Komunikasi Proyek"
            aria-label="Komunikasi Proyek"
        >
            <MessageSquare className="w-4.5 h-4.5" />
        </Link>
    );
}