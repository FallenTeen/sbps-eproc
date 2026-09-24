import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

const badgeStyles = {
    default: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    teal: 'bg-teal-100 text-teal-800',
};

/**
 * Daftar baris clickable untuk widget dashboard.
 *
 * @property {Array} rows       Tiap baris: { id, primary, secondary, meta, badge, badgeClass }.
 * @property {Function} [getHref]  (row) => string route; bila ada, baris menjadi tautan.
 * @property {string} [empty]   Pesan kosong.
 * @property {number} [max]     Maks baris yang ditampilkan.
 */
export default function DashboardRowList({ rows = [], getHref, empty = 'Belum ada data', max = 6 }) {
    if (!rows.length) {
        return <p className="text-xs text-gray-400 py-4 text-center">{empty}</p>;
    }

    return (
        <ul className="divide-y divide-gray-100">
            {rows.slice(0, max).map((row) => {
                const content = (
                    <div className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{row.primary}</p>
                            {row.secondary && <p className="text-xs text-gray-500 truncate">{row.secondary}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {row.badge != null && row.badge !== '' && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.badgeClass || badgeStyles.default}`}>
                                    {row.badge}
                                </span>
                            )}
                            {row.meta && <span className="text-xs text-gray-400">{row.meta}</span>}
                            {getHref && <ChevronRight className="w-4 h-4 text-gray-300" />}
                        </div>
                    </div>
                );

                const href = getHref ? getHref(row) : null;

                return (
                    <li key={row.id}>
                        {href ? (
                            <Link href={href} className="block hover:bg-gray-50 px-1 -mx-1 rounded-lg">
                                {content}
                            </Link>
                        ) : (
                            content
                        )}
                    </li>
                );
            })}
        </ul>
    );
}