export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all duration-150 ease-in-out hover:bg-white hover:text-black focus:bg-white focus:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 active:bg-surface.subtle shadow-bw-sm ${
                    disabled && 'opacity-25 cursor-not-allowed hover:bg-black hover:text-white'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
