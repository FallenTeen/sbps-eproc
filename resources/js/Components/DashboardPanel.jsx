import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

const accentMap = {
    blue: { header: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    green: { header: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    amber: { header: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    red: { header: 'text-red-700', badge: 'bg-red-100 text-red-800' },
    purple: { header: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
    teal: { header: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
    indigo: { header: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
    slate: { header: 'text-slate-700', badge: 'bg-slate-100 text-slate-800' },
};

/**
 * Panel widget dashboard: header (ikon + judul + badge opsional + tautan
 * "Lihat Semua") dan body bebas (daftar baris / grafik).
 *
 * @property {LucideIcon}  icon          Ikon modul.
 * @property {string}       title         Judul panel.
 * @property {string}       [subtitle]    Keterangan singkat.
 * @property {string|number} [badge]      Angka/label kecil di pojok header.
 * @property {string}       [accent]      Warna aksen (blue/green/amber/red/purple/teal/indigo/slate).
 * @property {string}       [href]        Route "Lihat Semua".
 * @property {string}       [hrefLabel]   Label tautan (default "Lihat Semua").
 */
export default function DashboardPanel({
    icon: Icon,
    title,
    subtitle,
    badge,
    accent = 'indigo',
    href,
    hrefLabel = 'Lihat Semua',
    children,
}) {
    const color = accentMap[accent] || accentMap.indigo;

    return (
        <section className="flex flex-col self-start border border-gray-300 bg-white p-5">
            <div className="flex items-start justify-between mb-3">
                <div className="flex min-w-0 items-start gap-3">
                    {Icon && <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />}
                    <div>
                        <h2 className="font-semibold leading-tight text-gray-900">{title}</h2>
                        {subtitle && <p className="mt-1 text-sm leading-5 text-gray-600">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {badge != null && badge !== '' && (
                        <span className={`px-2.5 py-1 text-sm font-semibold ${color.badge}`}>{badge}</span>
                    )}
                    {href && (
                        <Link
                            href={href}
                            className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        >
                            {hrefLabel} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            </div>
            <div className="flex-1 min-h-0">{children}</div>
        </section>
    );
}
