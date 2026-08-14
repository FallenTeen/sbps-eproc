export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-black uppercase tracking-wider text-ink.DEFAULT mb-1.5 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
