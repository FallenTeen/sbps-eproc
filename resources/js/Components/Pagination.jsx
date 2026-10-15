import React from "react";

const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100];

/**
 * Pagination bersama + pemilih jumlah baris per halaman.
 *
 * @param {object}   props.paginator       Objek paginator Laravel (data/links/from/to/total/current_page/per_page).
 * @param {Function} props.onPageUrl       Dipanggil dengan URL link halaman saat diklik.
 * @param {Function} props.onPerPageChange Dipanggil dengan jumlah per halaman baru.
 */
export default function Pagination({ paginator, onPageUrl, onPerPageChange }) {
    if (!paginator) {
        return null;
    }

    const {
        from = 0,
        to = 0,
        total = 0,
        per_page = 15,
        links = [],
    } = paginator;

    return (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                    Menampilkan {from} - {to} dari {total} data
                </span>
                <select
                    value={per_page}
                    onChange={(e) => onPerPageChange?.(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    {PER_PAGE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                            {n} / halaman
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-wrap gap-1">
                {links.map((link, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => link.url && onPageUrl?.(link.url)}
                        disabled={!link.url}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`px-3 py-1 border rounded text-sm ${
                            link.active
                                ? "bg-blue-600 text-white border-blue-600"
                                : "hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
