import React, { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import Pagination from "@/Components/Pagination";
import useDebouncedValue from "@/hooks/useDebouncedValue";

const isEmpty = (v) => v === null || v === undefined || v === "";

function cleanFilters(filters = {}) {
    const out = {};

    Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === "object") {
            const sub = {};
            if (!isEmpty(value.from)) sub.from = value.from;
            if (!isEmpty(value.to)) sub.to = value.to;
            if (Object.keys(sub).length) out[key] = sub;
        } else if (!isEmpty(value)) {
            out[key] = value;
        }
    });

    return out;
}

/**
 * Tabel bersama: sorting per kolom + input pencarian per kolom (server-side).
 *
 * @param {string}  props.routeName Nama route index (Laravel/Ziggy).
 * @param {Array}   props.columns   Definisi kolom.
 * @param {object}  props.rows      Objek paginator Laravel.
 * @param {object}  props.filters   Filter aktif dari server.
 * @param {object}  props.baseParams Parameter query tambahan (mis. unit_bisnis_id) yang selalu dipertahankan.
 * @param {?string} props.sort      Kolom sort aktif dari server.
 * @param {string}  props.direction Arah sort dari server.
 *
 * Definisi kolom:
 *  { key, label, type: 'text'|'select'|'dateRange', options, sortable, search, render, align }
 */
export default function DataTable({
    routeName,
    routeParams = {},
    baseParams = {},
    columns,
    rows,
    filters = {},
    sort = null,
    direction = "asc",
    emptyMessage = "Tidak ada data",
}) {
    const filtersRef = useRef(cleanFilters(filters));
    const sortRef = useRef({ sort, direction });

    useEffect(() => {
        filtersRef.current = cleanFilters(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        sortRef.current = { sort, direction };
    }, [sort, direction]);

    const navigate = (filterObj, sortKey, sortDir, page, perPage) => {
        const params = {};
        const cleaned = cleanFilters(filterObj);

        Object.entries(baseParams).forEach(([k, v]) => {
            if (!isEmpty(v)) params[k] = v;
        });
        if (Object.keys(cleaned).length) params.filters = cleaned;
        if (sortKey) {
            params.sort = sortKey;
            params.direction = sortDir;
        }
        if (perPage) params.per_page = perPage;
        if (page && page > 1) params.page = page;

        router.get(route(routeName, routeParams), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyFilter = (key, value) => {
        const next = { ...filtersRef.current };

        if (value && typeof value === "object") {
            if (isEmpty(value.from) && isEmpty(value.to)) {
                delete next[key];
            } else {
                next[key] = value;
            }
        } else if (isEmpty(value)) {
            delete next[key];
        } else {
            next[key] = value;
        }

        filtersRef.current = next;
        navigate(next, sortRef.current.sort, sortRef.current.direction, 1);
    };

    const applySort = (key) => {
        const { sort: current, direction: dir } = sortRef.current;
        let nextSort;
        let nextDir;

        if (current !== key) {
            nextSort = key;
            nextDir = "asc";
        } else if (dir === "asc") {
            nextSort = key;
            nextDir = "desc";
        } else {
            nextSort = null;
            nextDir = "asc";
        }

        sortRef.current = { sort: nextSort, direction: nextDir };
        navigate(filtersRef.current, nextSort, nextDir, 1);
    };

    const goToPageUrl = (url) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const changePerPage = (perPage) => {
        navigate(filtersRef.current, sortRef.current.sort, sortRef.current.direction, 1, perPage);
    };

    const renderSortIcon = (key) => {
        if (sort !== key) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
        return direction === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
        ) : (
            <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
        );
    };

    return (
        <div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider ${
                                        col.align === "right" ? "text-right" : "text-left"
                                    }`}
                                >
                                    {col.sortable === false ? (
                                        <span>{col.label}</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => applySort(col.key)}
                                            className={`inline-flex items-center gap-1 hover:text-gray-900 ${
                                                col.align === "right" ? "flex-row-reverse" : ""
                                            }`}
                                        >
                                            {col.label}
                                            {renderSortIcon(col.key)}
                                        </button>
                                    )}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-2 py-2 align-top ${
                                        col.align === "right" ? "text-right" : "text-left"
                                    }`}
                                >
                                    {col.search === false ? null : (
                                        <ColumnFilter
                                            column={col}
                                            value={filters[col.key]}
                                            onApply={(v) => applyFilter(col.key, v)}
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.data.map((row, index) => (
                                <tr key={row.id ?? index} className="hover:bg-gray-50">
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={
                                                col.cellClassName ??
                                                `px-4 py-3 text-sm text-gray-700 ${
                                                    col.align === "right" ? "text-right" : ""
                                                }`
                                            }
                                        >
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination paginator={rows} onPageUrl={goToPageUrl} onPerPageChange={changePerPage} />
        </div>
    );
}

function ColumnFilter({ column, value, onApply }) {
    const type = column.type ?? "text";

    if (type === "select") {
        return (
            <select
                value={value ?? ""}
                onChange={(e) => onApply(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">Semua</option>
                {(column.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }

    if (type === "dateRange") {
        const range = value ?? {};
        return (
            <div className="flex gap-1">
                <input
                    type="date"
                    value={range.from ?? ""}
                    onChange={(e) => onApply({ from: e.target.value, to: range.to ?? "" })}
                    className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                    type="date"
                    value={range.to ?? ""}
                    onChange={(e) => onApply({ from: range.from ?? "", to: e.target.value })}
                    className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        );
    }

    return (
        <TextFilter value={value ?? ""} onApply={onApply} placeholder={column.placeholder ?? "Cari..."} />
    );
}

function TextFilter({ value, onApply, placeholder }) {
    const [local, setLocal] = useState(value);
    const debounced = useDebouncedValue(local, 450);
    const isFirst = useRef(true);

    useEffect(() => {
        setLocal(value);
    }, [value]);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        // Kirim saat dikosongkan atau minimal 3 huruf.
        if (debounced.length === 0 || debounced.length >= 3) {
            onApply(debounced);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    return (
        <input
            type="text"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
    );
}
