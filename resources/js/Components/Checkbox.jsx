export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'border-2 border-black text-black focus:ring-2 focus:ring-black focus:ring-offset-0 w-5 h-5 cursor-pointer ' +
                className
            }
        />
    );
}
