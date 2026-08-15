import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    Bell, ShoppingCart, Wrench, FileText, AlertTriangle,
    X, CheckCheck, Clock, ChevronRight
} from 'lucide-react';

const ICON_MAP = {
    po_approval: <ShoppingCart className="w-4 h-4 text-black" />,
    servis_jatuh_tempo: <Wrench className="w-4 h-4 text-black" />,
    invoice_jatuh_tempo: <FileText className="w-4 h-4 text-black" />,
    stok_minus: <AlertTriangle className="w-4 h-4 text-black" />,
    formulir_belum_isi: <Clock className="w-4 h-4 text-black" />,
};

const COLOR_MAP = {
    po_approval: 'bg-status-success.light border-2 border-status-success.DEFAULT',
    servis_jatuh_tempo: 'bg-status-progress.light border-2 border-status-progress.DEFAULT',
    invoice_jatuh_tempo: 'bg-status-success.light border-2 border-status-success.DEFAULT',
    stok_minus: 'bg-status-progress.light border-2 border-status-progress.DEFAULT',
    formulir_belum_isi: 'bg-white border-2 border-black',
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
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

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
                className="relative flex items-center justify-center w-9 h-9 rounded-md bg-white text-black hover:bg-black hover:text-white transition-all shadow-bw-sm"
                aria-label="Notifikasi"
            >
                <Bell className="w-4.5 h-4.5" />
                {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 border-2 border-white bg-status-warning.DEFAULT text-white text-[10px] font-black leading-none">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 border-2 border-black bg-white shadow-bw-lg">
                    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-black text-white">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-white" />
                            <span className="font-black text-sm">
                                Notifikasi
                            </span>
                            {unread > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-black bg-white text-black border-2 border-white">
                                    {unread} BARU
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unread > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 text-[10px] font-bold text-white/80 hover:text-white border border-white/40 px-2 py-0.5"
                                >
                                    <CheckCheck className="w-3 h-3" /> Tandai semua
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-surface.border custom-scrollbar">
                        {loading && (
                            <div className="py-8 text-center text-sm font-bold text-ink-secondary">Memuat...</div>
                        )}
                        {!loading && notifications.length === 0 && (
                            <div className="py-8 text-center text-sm font-bold text-ink-secondary">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                Tidak ada notifikasi
                            </div>
                        )}
                        {!loading && notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`flex gap-3 px-4 py-3 cursor-pointer transition-all border-l-4 ${!notif.is_read ? 'bg-surface.muted border-l-status-warning.DEFAULT hover:bg-surface.subtle' : 'bg-white border-l-transparent hover:bg-surface.muted'}`}
                                onClick={() => {
                                    markRead(notif.id);
                                    if (notif.action_url) {
                                        setOpen(false);
                                        router.visit(notif.action_url);
                                    }
                                }}
                            >
                                <div className={`flex-shrink-0 mt-0.5 w-9 h-9 flex items-center justify-center ${COLOR_MAP[notif.type] || 'bg-white border-2 border-black'}`}>
                                    {ICON_MAP[notif.type] || <Bell className="w-4 h-4 text-ink.secondary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-tight ${!notif.is_read ? 'font-black text-ink.DEFAULT' : 'font-bold text-ink.secondary'}`}>
                                        {notif.title}
                                    </p>
                                    <p className="text-xs text-ink.secondary mt-0.5 line-clamp-2 font-medium">{notif.body}</p>
                                    <p className="text-[10px] text-ink.tertiary mt-1 font-bold">{notif.time_ago}</p>
                                </div>
                                {!notif.is_read && (
                                    <div className="flex-shrink-0 mt-1.5">
                                        <span className="w-2.5 h-2.5 bg-status-warning.DEFAULT border-2 border-black block"></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-black px-4 py-2 bg-black">
                        <Link
                            href="/notifications"
                            className="flex items-center justify-center gap-1 text-xs font-black text-white hover:bg-white hover:text-black transition-all px-3 py-2 border-2 border-white"
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
