import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 text-base font-bold transition-all duration-150 ease-in-out focus:outline-none ${
                active
                    ? 'border-black bg-surface.subtle text-black focus:border-black'
                    : 'border-transparent text-ink.secondary hover:border-black hover:bg-surface.muted hover:text-black focus:border-black focus:bg-surface.muted focus:text-black'
            } ${className}`}
        >
            {children}
        </Link>
    );
}
