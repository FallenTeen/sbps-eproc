import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Layout({ header, children }) {
    return (
        <AuthenticatedLayout header={header}>
            {children}
        </AuthenticatedLayout>
    );
}
