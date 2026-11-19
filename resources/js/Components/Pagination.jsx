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

/**
 * Pagination untuk data yang sudah tersedia di client.
 */
export function ClientPagination({ total = 0, page = 1, perPage = 15, onPageChange, onPerPageChange }) {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, page), pages);
    const from = total === 0 ? 0 : (current - 1) * perPage + 1;
    const to = Math.min(current * perPage, total);

    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                    Menampilkan {from} - {to} dari {total} data
                </span>
                <select
                    value={perPage}
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

            <div className="flex flex-wrap items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange?.(current - 1)}
                    disabled={current <= 1}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                >
                    Sebelumnya
                </button>
                {pageNumbers.map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onPageChange?.(n)}
                        className={`px-3 py-1 border rounded text-sm ${
                            n === current
                                ? "bg-blue-600 text-white border-blue-600"
                                : "hover:bg-gray-100"
                        }`}
                    >
                        {n}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => onPageChange?.(current + 1)}
                    disabled={current >= pages}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                >
                    Berikutnya
                </button>
            </div>
        </div>
    );
}
