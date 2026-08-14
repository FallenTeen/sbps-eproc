import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-bold leading-5 transition-all duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-black text-black focus:border-black'
                    : 'border-transparent text-ink.secondary hover:border-black hover:text-black focus:border-black focus:text-black') +
                className
            }
        >
            {children}
        </Link>
    );
}
