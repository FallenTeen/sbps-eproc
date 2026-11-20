export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <img
            src="/main-logo.png"
            alt="SBPS"
            {...props}
            className={`object-contain ${className}`}
        />
    );
}