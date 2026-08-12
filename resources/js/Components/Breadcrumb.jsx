import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Automatic breadcrumb from Inertia page props.
 * Each page can set breadcrumbs via Inertia::share() or component prop.
 *
 * Expected format from backend:
 * breadcrumbs: [
 *   { label: 'Dashboard', href: '/dashboard' },
 *   { label: 'Proyek', href: '/core/proyek' },
 *   { label: 'Quarry A', href: null }, // null = current page (no link)
 * ]
 */
export default function Breadcrumb({ items = [] }) {
    const { breadcrumbs: pageBreadcrumbs } = usePage().props;
    const crumbs = items.length > 0 ? items : (pageBreadcrumbs || []);

    if (crumbs.length === 0) return null;

    return (
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 px-1 py-1 flex-wrap">
            <Link
                href="/dashboard"
                className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
                <Home className="w-3.5 h-3.5" />
            </Link>

            {crumbs.map((crumb, idx) => {
                const isLast = idx === crumbs.length - 1;
                return (
                    <React.Fragment key={idx}>
                        <ChevronRight className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        {crumb.href && !isLast ? (
                            <Link
                                href={crumb.href}
                                className="hover:text-slate-800 dark:hover:text-slate-200 transition truncate max-w-[180px]"
                                title={crumb.label}
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span
                                className={`truncate max-w-[200px] ${isLast ? 'font-semibold text-slate-700 dark:text-slate-200' : ''}`}
                                title={crumb.label}
                            >
                                {crumb.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
