import React from 'react';

export default function PrimaryButton({
    variant = 'primary',
    className = '',
    disabled,
    asChild = false,
    children,
    ...props
}) {
    const variants = {
        primary: 'bg-primary-600 text-white border-2 border-transparent hover:bg-primary-700 focus:ring-primary-500',
        danger: 'bg-red-600 text-white border-2 border-transparent hover:bg-red-700 focus:ring-red-500',
        outline: 'bg-transparent text-ink-secondary border-2 border-black hover:bg-gray-900 hover:text-white focus:ring-black',
    };
    const base = 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-25 disabled:cursor-not-allowed';
    const classes = `${base} ${variants[variant] ?? variants.primary} ${disabled ? 'opacity-25 cursor-not-allowed' : ''} ${className}`;

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            className: `${classes} ${children.props.className ?? ''}`.trim(),
        });
    }

    return (
        <button {...props} className={classes} disabled={disabled}>
            {children}
        </button>
    );
}