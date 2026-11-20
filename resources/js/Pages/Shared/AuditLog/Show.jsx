import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';
import { formatTanggalWaktu } from '@/utils/date';
import {
    formatAuditValue,
    getAuditActionLabel,
    getAuditAdditionalDetails,
    getAuditChanges,
    getAuditFieldLabel,
    getAuditSubjectLabel,
} from '@/utils/auditLog';

export default function Show({ log }) {
    const changes = getAuditChanges(log);
    const additionalDetails = getAuditAdditionalDetails(log);
    const properties = log.properties && typeof log.properties === 'object' ? log.properties : {};
    const subjectLabel = getAuditSubjectLabel(log.subject_type);
    const actionLabel = getAuditActionLabel(log.event);

    return (
        <AuthenticatedLayout>
            <Head title={`Rincian Perubahan: ${subjectLabel}`} />

            <div className="mb-5">
                <Link
                    href={route('audit.logs')}
                    className="inline-flex min-h-10 items-center gap-2 font-semibold text-gray-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Kembali ke riwayat perubahan
                </Link>
            </div>

            <div className="space-y-5">
                <section className="border-2 border-black bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">Rincian perubahan pada {subjectLabel}</h1>
                        <span className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700">
                            {actionLabel}
                        </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-700">
                        {log.description || `${actionLabel} pada ${subjectLabel.toLowerCase()}.`}
                    </p>

                    <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Dilakukan oleh</dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900">
                                {log.causer?.nama_lengkap || log.causer?.name || 'Sistem'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Tanggal dan waktu</dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900">
                                {formatTanggalWaktu(log.created_at)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Bagian data</dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900">{subjectLabel}</dd>
                        </div>
                    </dl>
                </section>

                <section className="border border-gray-300 bg-white p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Apa yang berubah?</h2>
                    {changes.length > 0 ? (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-300 text-gray-600">
                                        <th scope="col" className="py-3 pr-4 font-medium">Bagian</th>
                                        <th scope="col" className="py-3 px-4 font-medium">Sebelumnya</th>
                                        <th scope="col" className="py-3 pl-4 font-medium">Sesudahnya</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {changes.map(({ field, label, before, after }) => (
                                        <tr key={field} className="border-b border-gray-100 last:border-0">
                                            <th scope="row" className="py-3 pr-4 font-medium text-gray-900">{label}</th>
                                            <td className="max-w-sm whitespace-pre-wrap break-words px-4 py-3 text-gray-700">
                                                {formatAuditValue(before, field)}
                                            </td>
                                            <td className="max-w-sm whitespace-pre-wrap break-words pl-4 py-3 font-medium text-gray-900">
                                                {formatAuditValue(after, field)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : additionalDetails.length > 0 ? (
                        <>
                            <p className="mt-2 text-sm text-gray-600">
                                Aktivitas ini tidak menyimpan nilai sebelum dan sesudah. Informasi yang tercatat:
                            </p>
                            <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                                {additionalDetails.map(({ field, label, value }) => (
                                    <div key={field} className="flex justify-between gap-4 border-b border-gray-100 py-3">
                                        <dt className="text-sm text-gray-600">{label || getAuditFieldLabel(field)}</dt>
                                        <dd className="text-right text-sm font-medium text-gray-900">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-gray-600">
                            Tidak ada rincian nilai yang disimpan untuk aktivitas ini.
                        </p>
                    )}
                </section>

                <details className="border border-gray-300 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                        Informasi teknis (untuk admin)
                    </summary>
                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-gray-600">ID aktivitas</dt>
                            <dd className="mt-1 break-all font-mono text-xs text-gray-800">{log.id}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">ID data</dt>
                            <dd className="mt-1 break-all font-mono text-xs text-gray-800">{log.subject_id || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Alamat IP</dt>
                            <dd className="mt-1 text-gray-800">{properties.ip || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Perangkat atau browser</dt>
                            <dd className="mt-1 break-words text-gray-800">{properties.user_agent || '—'}</dd>
                        </div>
                    </dl>
                </details>
            </div>
        </AuthenticatedLayout>
    );
}