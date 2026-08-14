export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center border-2 border-status-warning.dark bg-status-warning.DEFAULT px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all duration-150 ease-in-out hover:bg-status-warning.dark focus:outline-none focus:ring-2 focus:ring-status-warning.DEFAULT focus:ring-offset-2 active:bg-status-warning.dark shadow-bw-sm ${
                    disabled && 'opacity-25 cursor-not-allowed hover:bg-status-warning.DEFAULT'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
