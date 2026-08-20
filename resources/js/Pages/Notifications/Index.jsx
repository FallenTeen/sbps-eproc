import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    Bell, ShoppingCart, Wrench, FileText, AlertTriangle,
    CheckCheck, Clock, Search
} from 'lucide-react';

const ICON_MAP = {
    po_approval: <ShoppingCart className="w-5 h-5 text-ink.DEFAULT" />,
    servis_jatuh_tempo: <Wrench className="w-5 h-5 text-ink.DEFAULT" />,
    invoice_jatuh_tempo: <FileText className="w-5 h-5 text-ink.DEFAULT" />,
    checklist_kondisi_buruk: <AlertTriangle className="w-5 h-5 text-ink.DEFAULT" />,
    stok_minus: <AlertTriangle className="w-5 h-5 text-ink.DEFAULT" />,
    formulir_belum_isi: <Clock className="w-5 h-5 text-ink.DEFAULT" />,
};

const COLOR_MAP = {
    po_approval: 'bg-status-success.light border-2 border-status-success.DEFAULT',
    servis_jatuh_tempo: 'bg-status-progress.light border-2 border-status-progress.DEFAULT',
    invoice_jatuh_tempo: 'bg-status-success.light border-2 border-status-success.DEFAULT',
    checklist_kondisi_buruk: 'bg-status-warning.light border-2 border-status-warning.DEFAULT',
    stok_minus: 'bg-status-progress.light border-2 border-status-progress.DEFAULT',
    formulir_belum_isi: 'bg-white border-2 border-black',
};

const TYPE_LABEL = {
    po_approval: 'Pengadaan',
    servis_jatuh_tempo: 'Armada',
    invoice_jatuh_tempo: 'Keuangan',
    checklist_kondisi_buruk: 'Checklist',
    stok_minus: 'Stok',
    formulir_belum_isi: 'Formulir',
};

export default function NotificationIndex({ notifications = [], unread_count = 0 }) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = notifications.filter((n) => {
        const matchFilter =
            filter === 'all' ||
            (filter === 'unread' && !n.is_read) ||
            (filter === 'read' && n.is_read);
        const matchSearch =
            !search ||
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.body.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const markAllRead = () => {
        fetch(route('notifications.mark-all-read'), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(() => {
            router.reload({ only: ['notifications', 'unread_count'] });
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
            router.reload({ only: ['notifications', 'unread_count'] });
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notifikasi" />

            <div className="py-6">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-ink.DEFAULT flex items-center gap-2">
                                <Bell className="w-6 h-6" /> Semua Notifikasi
                            </h1>
                            <p className="text-sm text-ink.secondary mt-1">
                                {unread_count > 0
                                    ? `${unread_count} notifikasi belum dibaca`
                                    : 'Semua notifikasi sudah dibaca'}
                            </p>
                        </div>
                        {unread_count > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-black bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all shadow-bw-sm"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Tandai Semua Dibaca
                            </button>
                        )}
                    </div>

                    {/* Stats Ringkas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border-2 border-black p-4 shadow-bw-sm">
                            <div className="text-xs font-bold text-ink.secondary uppercase">Total</div>
                            <div className="text-2xl font-black text-ink.DEFAULT mt-1">{notifications.length}</div>
                        </div>
                        <div className="bg-white border-2 border-status-warning.DEFAULT p-4 shadow-bw-sm">
                            <div className="text-xs font-bold text-ink.secondary uppercase">Belum Dibaca</div>
                            <div className="text-2xl font-black text-status-warning.DEFAULT mt-1">{unread_count}</div>
                        </div>
                        <div className="bg-white border-2 border-status-success.DEFAULT p-4 shadow-bw-sm">
                            <div className="text-xs font-bold text-ink.secondary uppercase">Pengadaan</div>
                            <div className="text-2xl font-black text-status-success.DEFAULT mt-1">
                                {notifications.filter(n => n.type === 'po_approval').length}
                            </div>
                        </div>
                        <div className="bg-white border-2 border-status-progress.DEFAULT p-4 shadow-bw-sm">
                            <div className="text-xs font-bold text-ink.secondary uppercase">Armada</div>
                            <div className="text-2xl font-black text-status-progress.DEFAULT mt-1">
                                {notifications.filter(n => n.type === 'servis_jatuh_tempo').length}
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex gap-2">
                            {[
                                { key: 'all', label: 'Semua' },
                                { key: 'unread', label: 'Belum Dibaca' },
                                { key: 'read', label: 'Sudah Dibaca' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-3 py-1.5 text-xs font-black border-2 transition-all ${
                                        filter === key
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-ink.DEFAULT border-black hover:bg-surface.muted'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink.tertiary" />
                            <input
                                type="text"
                                placeholder="Cari notifikasi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-sm border-2 border-black bg-white focus:outline-none focus:ring-0 font-medium placeholder:text-ink.tertiary"
                            />
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="bg-white border-2 border-black shadow-bw-sm">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center">
                                <Bell className="w-12 h-12 mx-auto mb-3 text-ink.tertiary opacity-50" />
                                <p className="text-sm font-bold text-ink.secondary">
                                    {notifications.length === 0
                                        ? 'Tidak ada notifikasi'
                                        : 'Tidak ada notifikasi yang cocok'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface.border">
                                {filtered.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`flex gap-4 px-5 py-4 cursor-pointer transition-all border-l-4 ${
                                            !notif.is_read
                                                ? 'bg-surface.muted border-l-status-warning.DEFAULT hover:bg-surface.subtle'
                                                : 'bg-white border-l-transparent hover:bg-surface.muted'
                                        }`}
                                        onClick={() => {
                                            markRead(notif.id);
                                            if (notif.action_url) {
                                                router.visit(notif.action_url);
                                            }
                                        }}
                                    >
                                        <div className={`flex-shrink-0 mt-0.5 w-10 h-10 flex items-center justify-center ${COLOR_MAP[notif.type] || 'bg-white border-2 border-black'}`}>
                                            {ICON_MAP[notif.type] || <Bell className="w-5 h-5 text-ink.secondary" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm leading-tight ${!notif.is_read ? 'font-black text-ink.DEFAULT' : 'font-bold text-ink.secondary'}`}>
                                                    {notif.title}
                                                </span>
                                                <span className="px-1.5 py-0.5 text-[10px] font-black bg-surface.subtle text-ink.secondary border border-surface.border uppercase">
                                                    {TYPE_LABEL[notif.type] || notif.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-ink.secondary mt-1 font-medium">{notif.body}</p>
                                            <p className="text-[10px] text-ink.tertiary mt-1.5 font-bold">{notif.time_ago}</p>
                                        </div>
                                        {!notif.is_read && (
                                            <div className="flex-shrink-0 mt-1.5">
                                                <span className="w-2.5 h-2.5 bg-status-warning.DEFAULT border-2 border-black block"></span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
