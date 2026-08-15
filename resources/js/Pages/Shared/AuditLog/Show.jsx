import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

export default function Show({ log }) {
    const formatValue = (value) => {
        if (value === null) return '-';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    const getActionBadge = (action) => {
        const colors = { created: 'bg-green-200 text-green-800', updated: 'bg-blue-200 text-blue-800', deleted: 'bg-red-200 text-red-800' };
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[action] || 'bg-gray-200 text-gray-800'}`}>{action}</span>;
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('audit.logs')} className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></Link>
                <h1 className="text-2xl font-bold">Detail Audit Log</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><strong>Waktu:</strong> {new Date(log.created_at).toLocaleString('id-ID')}</div>
                    <div><strong>User:</strong> {log.causer?.name || 'System'}</div>
                    <div><strong>Model:</strong> {log.subject_type}</div>
                    <div><strong>ID:</strong> {log.subject_id}</div>
                    <div><strong>Aksi:</strong> {getActionBadge(log.event)}</div>
                    <div><strong>IP:</strong> {log.properties?.ip || '-'}</div>
                </div>

                {log.properties?.old && (
                    <div className="mt-4">
                        <h3 className="font-medium mb-2">Data Sebelum</h3>
                        <div className="bg-gray-50 p-3 rounded border overflow-x-auto">
                            <pre className="text-sm">{formatValue(log.properties.old)}</pre>
                        </div>
                    </div>
                )}

                {log.properties?.attributes && (
                    <div className="mt-4">
                        <h3 className="font-medium mb-2">Data Sesudah</h3>
                        <div className="bg-gray-50 p-3 rounded border overflow-x-auto">
                            <pre className="text-sm">{formatValue(log.properties.attributes)}</pre>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}