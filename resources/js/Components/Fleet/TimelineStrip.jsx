import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";

const badgeStyles = {
    done: "bg-emerald-50 border-emerald-200 text-emerald-700",
    current: "bg-blue-50 border-blue-300 text-blue-700",
    pending: "bg-slate-50 border-slate-200 text-slate-500",
    skipped: "bg-amber-50 border-amber-200 text-amber-700",
};

const dotStyles = {
    done: "bg-emerald-500",
    current: "bg-blue-500 ring-4 ring-blue-100",
    pending: "bg-slate-300",
    skipped: "bg-amber-400",
};

const lineStyles = {
    done: "bg-emerald-300",
    current: "bg-slate-200",
    pending: "bg-slate-200",
    skipped: "bg-amber-200",
};

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function DetailItem({ detail }) {
    if (!detail?.value && !detail?.url) return null;

    return (
        <div className="min-w-0">
            <dt className="text-[10px] uppercase tracking-wide text-slate-400 leading-tight">
                {detail.label}
            </dt>
            <dd className="text-xs leading-snug">
                {detail.url ? (
                    <a
                        href={detail.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline break-all"
                    >
                        {detail.value || "Lihat lampiran"}
                    </a>
                ) : (
                    <span className="text-slate-700 break-words">{detail.value}</span>
                )}
            </dd>
        </div>
    );
}

function Chevron({ open }) {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
        >
            <path d="M7 4l6 6-6 6" />
        </svg>
    );
}

function TimelineItem({ event, isLast, busy, onAction }) {
    const state = event.state in dotStyles ? event.state : "pending";
    const details = (event.details ?? []).filter((d) => d?.value || d?.url);
    const hasDetails = details.length > 0;
    const isCurrent = state === "current";
    const [open, setOpen] = useState(isCurrent);

    const heading = (
        <>
            <span className="flex items-center gap-x-2 gap-y-0.5 flex-wrap min-w-0">
                <span
                    className={`text-sm text-slate-800 ${isCurrent ? "font-semibold" : "font-medium"}`}
                >
                    {event.label}
                </span>
                {event.badge && (
                    <span
                        className={`px-1.5 py-px rounded-full border text-[10px] font-medium leading-4 ${badgeStyles[state]}`}
                    >
                        {event.badge}
                    </span>
                )}
            </span>
            {event.actor && (
                <span className="block text-[11px] text-slate-500 leading-tight mt-0.5 break-words">
                    {event.actor}
                    {event.at ? ` · ${formatDate(event.at)}` : ""}
                </span>
            )}
        </>
    );

    return (
        <li className="flex gap-3">
            <div className="flex flex-col items-center w-3 shrink-0">
                <span className={`mt-[5px] h-2.5 w-2.5 rounded-full shrink-0 ${dotStyles[state]}`} />
                {!isLast && <span className={`mt-1 w-0.5 flex-1 rounded ${lineStyles[state]}`} />}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <div className="flex items-start gap-2">
                    {/* Klik timeline = expand / collapse saja */}
                    {hasDetails ? (
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            className="flex-1 min-w-0 flex items-start justify-between gap-3 text-left rounded-lg -mx-2 -my-1.5 px-2 py-1.5 min-h-[44px] cursor-pointer hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition"
                        >
                            <span className="min-w-0 flex-1">{heading}</span>
                            <span className="mt-1 ml-auto pr-1">
                                <Chevron open={open} />
                            </span>
                        </button>
                    ) : (
                        <div className="flex-1 min-w-0">{heading}</div>
                    )}

                    {/* Tombol terpisah untuk membuka halaman detail */}
                    {event.can_open && event.detail_route && (
                        <Link
                            href={event.detail_route}
                            className="shrink-0 px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                        >
                            Detail
                        </Link>
                    )}
                </div>

                {hasDetails && open && (
                    <dl className="mt-2 grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-1.5 rounded-md bg-slate-50 px-3 py-2">
                        {details.map((detail, i) => (
                            <DetailItem key={`${event.key}-${detail.label}-${i}`} detail={detail} />
                        ))}
                    </dl>
                )}

                {event.action?.route && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onAction(event)}
                        className="mt-2 w-full sm:w-auto inline-flex justify-center items-center px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {busy ? "Memproses..." : event.action.label}
                    </button>
                )}
            </div>
        </li>
    );
}

export default function TimelineStrip({ events = [], title = "Timeline" }) {
    const [busyKey, setBusyKey] = useState(null);

    const runAction = (event) => {
        if (busyKey) return;
        router.post(
            event.action.route,
            {},
            {
                preserveScroll: true,
                onStart: () => setBusyKey(event.key),
                onFinish: () => setBusyKey(null),
            }
        );
    };

    return (
        <section className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">{title}</h2>
            <ol>
                {events.map((event, index) => (
                    <TimelineItem
                        key={event.key ?? index}
                        event={event}
                        isLast={index === events.length - 1}
                        busy={busyKey === event.key}
                        onAction={runAction}
                    />
                ))}
            </ol>
        </section>
    );
}
