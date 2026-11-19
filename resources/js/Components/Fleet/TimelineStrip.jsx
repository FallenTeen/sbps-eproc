import React from "react";
import { Link } from "@inertiajs/react";

const stateStyles = {
    done: "bg-emerald-50 border-emerald-300 text-emerald-700",
    current: "bg-blue-50 border-blue-400 text-blue-700",
    pending: "bg-slate-50 border-slate-200 text-slate-500",
    skipped: "bg-amber-50 border-amber-200 text-amber-700",
};

const dotStyles = {
    done: "bg-emerald-500",
    current: "bg-blue-500 ring-4 ring-blue-100",
    pending: "bg-slate-300",
    skipped: "bg-amber-400",
};

export default function TimelineStrip({ events = [], title = "Timeline" }) {
    return (
        <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">{title}</h2>
            <ol className="space-y-0">
                {events.map((event, index) => {
                    const content = (
                        <div className="flex items-start gap-3">
                            <span
                                className={`mt-1 h-3 w-3 rounded-full shrink-0 ${dotStyles[event.state] || dotStyles.pending}`}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-slate-800">
                                        {event.label}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${stateStyles[event.state] || stateStyles.pending}`}
                                    >
                                        {event.badge}
                                    </span>
                                </div>
                                {event.actor && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {event.actor}
                                                                           {event.at ? ` · ${new Date(event.at).toLocaleString("id-ID")}` : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                    );

                    return (
                        <li key={event.key} className="relative pb-5 last:pb-0">
                            {index < events.length - 1 && (
                                <span className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-200" />
                            )}
                            {event.can_open && event.detail_route ? (
                                <Link
                                    href={event.detail_route}
                                    className="block rounded-lg hover:bg-slate-50 transition px-1 py-1 -mx-1 -my-1"
                                >
                                    {content}
                                </Link>
                            ) : (
                                content
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
