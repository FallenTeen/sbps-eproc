import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    ClipboardCheck,
    Clock3,
    DollarSign,
    Package,
    Truck,
} from 'lucide-react';
import { formatStatusLabel } from '@/utils/statusLabels';

export default function Index({ metrics }) {
    const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

    const tanggalSingkat = (dateStr) =>
        new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(
            new Date(`${dateStr}T00:00:00`),
        );

    const durasiSejak = (mulai) => {
        if (!mulai) return '-';
        const menit = Math.max(0, Math.floor((Date.now() - new Date(mulai).getTime()) / 60000));
        if (menit < 60) return `${menit} menit`;
        const jam = Math.floor(menit / 60);
        if (jam < 24) return `${jam} jam`;
        return `${Math.floor(jam / 24)} hari`;
    };

    const outputHariIni = Object.entries(metrics.output_today_per_product || {});
    const datasets = metrics.chart_data?.datasets || [];
    const labels = metrics.chart_data?.labels || [];

    const perluPerhatian = [];
    if (Number(metrics.pending_qc_count) > 0) {
        perluPerhatian.push({
            label: `${metrics.pending_qc_count} sampel menunggu uji tekan`,
            href: route('production.qc.pending'),
            icon: ClipboardCheck,
        });
    }
    if (Number(metrics.active_sessions_count) > 0) {
        perluPerhatian.push({
            label: `${metrics.active_sessions_count} proses produksi masih berjalan`,
            href: route('production.sessions.active'),
            icon: Activity,
        });
    }
    if (Number(metrics.margin_today) < 0) {
        perluPerhatian.push({
            label: `Margin hari ini negatif (${rupiah(metrics.margin_today)})`,
            href: null,
            icon: AlertTriangle,
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Ringkasan Produksi" />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="w-full">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ringkasan Produksi</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Pantau proses berjalan, mutu, pengiriman, dan hasil produksi hari ini.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Proses berjalan"
                    value={metrics.active_sessions_count}
                    suffix="proses"
                    description="Sesi produksi yang belum selesai."
                    icon={Activity}
                    href={route('production.sessions.active')}
                />
                <KpiCard
                    title="Menunggu uji tekan"
                    value={metrics.pending_qc_count}
                    suffix="sampel"
                    description="Sampel QC yang belum punya hasil."
                    icon={ClipboardCheck}
                    href={route('production.qc.pending')}
                    highlight={Number(metrics.pending_qc_count) > 0}
                />
                <KpiCard
                    title="Pengiriman hari ini"
                    value={metrics.pengiriman_today_count}
                    suffix="pengiriman"
                    description="Muatan yang berangkat hari ini."
                    icon={Truck}
                    href={route('production.pengiriman.today')}
                />
                <KpiCard
                    title="Margin hari ini"
                    value={rupiah(metrics.margin_today)}
                    description={`Pendapatan ${rupiah(metrics.revenue_today)} · Biaya ${rupiah(metrics.cost_today)}`}
                    icon={DollarSign}
                    highlight={Number(metrics.margin_today) < 0}
                />
            </div>

            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <AlertTriangle className="h-5 w-5 text-[#DC2626]" aria-hidden="true" />
                    <h2 className="text-base font-bold text-gray-900">Perlu perhatian</h2>
                </div>
                {perluPerhatian.length === 0 ? (
                    <p className="py-2 text-sm text-gray-600" role="status">
                        Belum ada yang perlu ditindaklanjuti. Semua proses, QC, dan margin dalam kondisi baik.
                    </p>
                ) : (
                    <ul className="grid gap-2 md:grid-cols-3">
                        {perluPerhatian.map((item) => {
                            const Icon = item.icon;
                            const content = (
                                <span className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    {item.label}
                                    {item.href && <ArrowUpRight className="ml-auto h-4 w-4" aria-hidden="true" />}
                                </span>
                            );

                            return (
                                <li key={item.label}>
                                    {item.href ? (
                                        <Link href={item.href} className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC2626]">
                                            {content}
                                        </Link>
                                    ) : (
                                        content
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900">
                        <Package className="h-5 w-5 text-[#DC2626]" aria-hidden="true" />
                        Hasil selesai hari ini
                    </h2>
                    <p className="mb-4 text-sm text-gray-600">Volume ditampilkan dengan satuan masing-masing produk.</p>
                    <div className="space-y-3">
                        {outputHariIni.length === 0 ? (
                            <p className="py-4 text-sm text-gray-600" role="status">
                                Belum ada produksi yang selesai hari ini.
                            </p>
                        ) : (
                            outputHariIni.map(([produk, data]) => (
                                <div key={produk} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                    <span className="text-sm font-semibold text-gray-900">{produk}</span>
                                    <span className="text-sm font-bold tabular-nums text-gray-900">
                                        {Number(data.volume).toLocaleString('id-ID')}{' '}
                                        <span className="font-normal text-gray-600">{data.satuan}</span>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                            <Activity className="h-5 w-5 text-[#DC2626]" aria-hidden="true" />
                            Proses sedang berjalan
                        </h2>
                        <Link href={route('production.sessions.active')} className="text-sm font-medium text-gray-900 hover:underline">
                            Lihat semua
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {(metrics.active_sessions_list || []).length === 0 ? (
                            <p className="py-4 text-sm text-gray-600" role="status">
                                Belum ada proses produksi yang sedang berjalan.
                            </p>
                        ) : (
                            metrics.active_sessions_list.map((session) => (
                                <Link
                                    key={session.id}
                                    href={route('production.sessions.show', session.id)}
                                    className="block rounded-lg border border-gray-200 p-4 transition hover:border-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{session.produk || 'Produk tidak tercatat'}</p>
                                            <p className="text-sm text-gray-600">Mesin: {session.mesin || 'Belum ditentukan'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{formatStatusLabel('berjalan')}</p>
                                            <p className="mt-0.5 flex items-center justify-end gap-1 text-sm text-gray-600">
                                                <Clock3 className="h-4 w-4" aria-hidden="true" />
                                                {durasiSejak(session.mulai)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900">
                    <Activity className="h-5 w-5 text-[#DC2626]" aria-hidden="true" />
                    Produksi 7 hari terakhir
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                    Setiap produk punya skala tersendiri karena satuan dan volume berbeda.
                </p>

                {datasets.length === 0 ? (
                    <p className="py-6 text-sm text-gray-600" role="status">
                        Belum ada produksi selesai yang tercatat dalam 7 hari terakhir.
                    </p>
                ) : (
                    <div className="space-y-8">
                        {datasets.map((dataset, i) => {
                            const values = (dataset.data || []).map((value) => Number(value) || 0);
                            const maxVal = Math.max(...values, 1);
                            const total = values.reduce((sum, value) => sum + value, 0);

                            return (
                                <div key={`${dataset.label}-${i}`}>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900">{dataset.label}</h3>
                                        <p className="text-sm font-bold tabular-nums text-gray-900">
                                            Total 7 hari: {total.toLocaleString('id-ID')} {dataset.satuan}
                                        </p>
                                    </div>
                                    <div className="flex h-32 items-end gap-2">
                                        {values.map((value, idx) => (
                                            <div key={idx} className="group relative flex h-full flex-1 flex-col items-center gap-1">
                                                <div className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                                                    {value.toLocaleString('id-ID')} {dataset.satuan}
                                                </div>
                                                <div className="flex h-full w-full items-end rounded-t bg-red-100">
                                                    <div
                                                        className="w-full rounded-t bg-[#DC2626] transition-all duration-500"
                                                        style={{ height: `${(value / maxVal) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="w-full truncate text-center text-xs text-gray-600">
                                                    {labels[idx] ? tanggalSingkat(labels[idx]) : '-'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}

function KpiCard({ title, value, suffix, description, icon: Icon, href, highlight = false }) {
    const card = (
        <div className={`flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-red-200' : 'border-gray-200'}`}>
            <p className="flex items-center gap-2 text-sm font-medium text-gray-600">
                {Icon && <Icon className={`h-4 w-4 ${highlight ? 'text-[#DC2626]' : 'text-gray-500'}`} aria-hidden="true" />}
                {title}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-950">
                {value}
                {suffix && <span className="ml-1 text-sm font-medium text-gray-600">{suffix}</span>}
            </p>
            {description && <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>}
        </div>
    );

    return href ? (
        <Link href={href} className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DC2626]">
            {card}
        </Link>
    ) : (
        card
    );
}
