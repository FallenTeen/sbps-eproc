import React from "react";
import { Link } from "@inertiajs/react";

function safeRoute(name, params = {}, fallback = "/dashboard") {
    try {
        if (typeof route === "function") {
            return route(name, params);
        }
    } catch (e) {
        return fallback;
    }
    return fallback;
}

export default function RelatedLinks({ items = [], params = {}, className = "" }) {
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) return null;

    return (
        <section className={`bg-white border border-slate-200 rounded-xl p-4 ${className}`.trim()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Terkait</h3>
            <div className="flex flex-wrap gap-2">
                {list.map((item, index) => {
                    const itemParams = item?.params ?? params ?? {};
                    const href = safeRoute(item?.href, itemParams, "/dashboard");
                    return (
                        <Link
                            key={`${item?.label || "link"}-${index}`}
                            href={href}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                            {item?.label || "Tautan"}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
