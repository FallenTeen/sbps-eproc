import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
    const { breadcrumbs: pageBreadcrumbs } = usePage().props;
    const crumbs = items.length > 0 ? items : (pageBreadcrumbs || []);

    if (crumbs.length === 0) return null;

    return (
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-secondary px-1 py-1 flex-wrap">
            <Link
                href="/dashboard"
                className="flex items-center gap-1 hover:text-ink.DEFAULT transition-colors font-medium"
            >
                <Home className="w-3.5 h-3.5" />
            </Link>

            {crumbs.map((crumb, idx) => {
                const isLast = idx === crumbs.length - 1;
                return (
                    <React.Fragment key={idx}>
                        <ChevronRight className="w-3 h-3 flex-shrink-0 text-ink-tertiary" />
                        {crumb.href && !isLast ? (
                            <Link
                                href={crumb.href}
                                className="hover:text-ink.DEFAULT transition-colors truncate max-w-[200px] font-medium"
                                title={crumb.label}
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span
                                className={`truncate max-w-[240px] ${isLast ? 'font-bold text-ink.DEFAULT' : ''}`}
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
