import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    Bell, ShoppingCart, Wrench, FileText, AlertTriangle,
    X, CheckCheck, Clock, ChevronRight
} from 'lucide-react';

const ICON_MAP = {
    po_approval: <ShoppingCart className="w-4 h-4 text-orange-500" />,
    servis_jatuh_tempo: <Wrench className="w-4 h-4 text-red-500" />,
    invoice_jatuh_tempo: <FileText className="w-4 h-4 text-purple-500" />,
    stok_minus: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    formulir_belum_isi: <Clock className="w-4 h-4 text-blue-500" />,
};

const COLOR_MAP = {
    po_approval: 'bg-orange-50 border-orange-200',
    servis_jatuh_tempo: 'bg-red-50 border-red-200',
    invoice_jatuh_tempo: 'bg-purple-50 border-purple-200',
    stok_minus: 'bg-yellow-50 border-yellow-200',
    formulir_belum_isi: 'bg-blue-50 border-blue-200',
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    const unread = notifications.filter((n) => !n.is_read).length;

    const fetchNotifications = () => {
        setLoading(true);
        fetch(route('notifications.index'), {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((data) => {
                setNotifications(data.notifications || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = () => {
        fetch(route('notifications.mark-all-read'), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        });
    };

    const markRead = (id) => {
        fetch(route('notifications.mark-read', id), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                'Accept': 'application/json',
            },
        }).then(() => {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        });
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Notifikasi"
            >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                Notifikasi
                            </span>
                            {unread > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">
                                    {unread} baru
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unread > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                >
                                    <CheckCheck className="w-3 h-3" /> Tandai semua dibaca
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                        {loading && (
                            <div className="py-8 text-center text-sm text-slate-400">Memuat...</div>
                        )}
                        {!loading && notifications.length === 0 && (
                            <div className="py-8 text-center text-sm text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                Tidak ada notifikasi
                            </div>
                        )}
                        {!loading && notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                onClick={() => {
                                    markRead(notif.id);
                                    if (notif.action_url) {
                                        setOpen(false);
                                        router.visit(notif.action_url);
                                    }
                                }}
                            >
                                <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center ${COLOR_MAP[notif.type] || 'bg-slate-50 border-slate-200'}`}>
                                    {ICON_MAP[notif.type] || <Bell className="w-4 h-4 text-slate-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {notif.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{notif.time_ago}</p>
                                </div>
                                {!notif.is_read && (
                                    <div className="flex-shrink-0 mt-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2">
                        <Link
                            href="/notifications"
                            className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 py-1"
                            onClick={() => setOpen(false)}
                        >
                            Lihat semua notifikasi <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
