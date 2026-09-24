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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                    <span className={`p-2 rounded-lg ${accentMap[accent]?.badge || accentMap.indigo.badge}`}>
                        <Icon className="w-5 h-5" />
                    </span>
                    <div>
                        <h4 className={`font-semibold text-gray-900 leading-tight ${color.header}`}>{title}</h4>
                        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {badge != null && badge !== 0 && badge !== '' && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color.badge}`}>{badge}</span>
                    )}
                    {href && (
                        <Link
                            href={href}
                            className={`text-xs font-semibold inline-flex items-center gap-1 hover:underline ${color.header}`}
                        >
                            {hrefLabel} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>
            </div>
            <div className="flex-1 min-h-0">{children}</div>
        </div>
    );
}
