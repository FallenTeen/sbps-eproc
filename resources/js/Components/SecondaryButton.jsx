export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black shadow-bw-sm transition-all duration-150 ease-in-out hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
