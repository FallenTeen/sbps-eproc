import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

const badgeStyles = {
    default: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-900',
    green: 'bg-green-100 text-green-900',
    amber: 'bg-amber-100 text-amber-900',
    red: 'bg-red-100 text-red-900',
    purple: 'bg-purple-100 text-purple-900',
    teal: 'bg-teal-100 text-teal-900',
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
        return (
            <p className="border-t border-gray-100 py-4 text-sm text-gray-600" role="status">
                {empty}
            </p>
        );
    }

    return (
        <ul className="divide-y divide-gray-100">
            {rows.slice(0, max).map((row) => {
                const content = (
                    <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{row.primary}</p>
                            {row.secondary && <p className="break-words text-sm leading-5 text-gray-600">{row.secondary}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:max-w-[55%] sm:justify-end">
                            {row.badge != null && row.badge !== '' && (
                                <span className={`px-2 py-1 text-xs font-semibold ${row.badgeClass || badgeStyles.default}`}>
                                    {row.badge}
                                </span>
                            )}
                            {row.meta && <span className="text-sm text-gray-600">{row.meta}</span>}
                            {getHref && <ChevronRight aria-hidden="true" className="h-4 w-4 text-gray-500" />}
                        </div>
                    </div>
                );

                const href = getHref ? getHref(row) : null;

                return (
                    <li key={row.id}>
                        {href ? (
                            <Link href={href} className="block px-1 -mx-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black">
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
