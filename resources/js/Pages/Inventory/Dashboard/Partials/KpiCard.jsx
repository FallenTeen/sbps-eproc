import React from "react";
import { Link } from "@inertiajs/react";

const toneClasses = {
    red: "border-red-100 bg-red-50 text-red-950",
    amber: "border-amber-100 bg-amber-50 text-amber-950",
    slate: "border-gray-200 bg-white text-gray-900",
    green: "border-emerald-100 bg-emerald-50 text-emerald-950",
};

export default function KpiCard({ title, value, icon, href, tone = "slate" }) {
    const card = (
        <div className={`flex h-full flex-col justify-between rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${toneClasses[tone] ?? toneClasses.slate}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <span className="text-sm font-semibold opacity-90">{title}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold tabular-nums">{value}</div>
        </div>
    );

    return href ? (
        <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            {card}
        </Link>
    ) : (
        card
    );
}
