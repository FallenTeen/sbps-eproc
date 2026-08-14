export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={'text-xs font-bold text-status-warning.DEFAULT mt-1.5 ' + className}
        >
            {message}
        </p>
    ) : null;
}
