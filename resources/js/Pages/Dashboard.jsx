import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
    Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
    AlertCircle, AlertTriangle, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, CalendarClock,
    CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Factory, FileText, Info, Inbox,
    LayoutDashboard, MapPin, Receipt, RefreshCw, Truck, Users, Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardPetaProyek from '@/Components/DashboardPetaProyek';

/**
 * Dashboard Owner.
 * Props: ownerData dari OwnerDashboardAggregatorService (+ key `insights`).
 *
 * Peta titik: isi PETA_TITIK dengan komponen peta yang sudah Anda pakai
 * (menerima prop `titik`), mis. `import PetaTitik from '@/Components/PetaTitik'`.
 */
const PETA_TITIK = null;

// ── Format & konstanta ──────────────────────────────────────────────
const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
const angka = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const rp = (n) => `Rp ${compact.format(n || 0)}`;
const rpPenuh = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n || 0))}`;
const tgl = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '');
const href = (name, params, fallback = null) => {
    try { return route(name, params); } catch { return fallback; }
};

const C = { tinta: '#1E5A5C', amber: '#D99A1C', abu: '#94A3B8', merah: '#C0432F', hijau: '#2F8F6B', biru: '#3B6FA0' };
const PIE = [C.tinta, C.amber, C.merah, C.abu, C.biru, C.hijau];
const AGING_BG = ['bg-emerald-600', 'bg-amber-500', 'bg-red-500'];

const TONE = {
    merah: {
        dot: 'bg-red-500', bar: 'bg-red-500', icon: AlertCircle,
        text: 'text-red-700 dark:text-red-400',
        chip: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
        soft: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    },
    kuning: {
        dot: 'bg-amber-500', bar: 'bg-amber-500', icon: AlertTriangle,
        text: 'text-amber-800 dark:text-amber-300',
        chip: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
        soft: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    },
    sehat: {
        dot: 'bg-emerald-600', bar: 'bg-emerald-600', icon: CheckCircle2,
        text: 'text-emerald-700 dark:text-emerald-400',
        chip: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
        soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    netral: {
        dot: 'bg-slate-400', bar: 'bg-slate-400', icon: null,
        text: 'text-muted-foreground',
        chip: 'border-border bg-muted text-muted-foreground',
        soft: 'bg-muted text-muted-foreground',
    },
};
const KESEHATAN = {
    kritis: { label: 'Kritis', tone: 'merah' },
    waspada: { label: 'Waspada', tone: 'kuning' },
    sehat: { label: 'Sehat', tone: 'sehat' },
    tanpa_rab: { label: 'Belum ada RAB', tone: 'netral' },
};
const STATUS_TILE = { merah: 'Perlu tindakan', kuning: 'Waspada', sehat: 'Baik' };
const URGENSI = {
    merah: { label: 'Mendesak', urut: 0 },
    kuning: { label: 'Perlu perhatian', urut: 1 },
    netral: { label: 'Informasi', urut: 2 },
    sehat: { label: 'Informasi', urut: 3 },
};

// Identitas dan konteks tiap tab navigasi
const TAB_META = {
    ringkasan: {
        label: 'Ringkasan', icon: LayoutDashboard, judul: 'Ringkasan',
        deskripsi: 'Sorotan lintas bidang: kesehatan proyek, tren bulanan, antrean persetujuan, tenggat, dan aktivitas terbaru.',
        periode: 'Hari ini dan 6 bulan terakhir',
    },
    keuangan: {
        label: 'Keuangan', icon: Wallet, judul: 'Keuangan',
        deskripsi: 'Pantau posisi kas, arus uang masuk dan keluar, umur piutang, serta margin proyek.',
        periode: '30 hari terakhir',
    },
    proyek: {
        label: 'Proyek', icon: BriefcaseBusiness, judul: 'Proyek',
        deskripsi: 'Evaluasi penggunaan biaya dan waktu setiap proyek aktif, serta titik kerja di lapangan.',
        periode: 'Proyek aktif',
    },
    armada: {
        label: 'Armada', icon: Truck, judul: 'Armada',
        deskripsi: 'Pantau utilisasi unit, jadwal servis, downtime, pemakaian BBM, dan ritase.',
        periode: 'Hari ini dan bulan berjalan',
    },
    produksi: {
        label: 'Produksi', icon: Factory, judul: 'Produksi',
        deskripsi: 'Evaluasi output produksi, uji tekan kualitas, sesi yang berjalan, dan pengiriman.',
        periode: 'Hari ini dan bulan berjalan',
    },
    sdm: {
        label: 'SDM', icon: Users, judul: 'SDM',
        deskripsi: 'Pantau kehadiran, presensi di luar radius, cuti yang menunggu persetujuan, dan payroll.',
        periode: 'Hari ini',
    },
};

// ── Komponen kecil ──────────────────────────────────────────────────
function Pill({ tone = 'netral', icon = true, children }) {
    const T = TONE[tone] ?? TONE.netral;
    const Icon = icon ? T.icon : null;
    return (
        <Badge variant="outline" className={`gap-1 font-normal ${T.chip}`}>
            {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
            {children}
        </Badge>
    );
}

function Empty({ children, ok = false }) {
    const Icon = ok ? CheckCircle2 : Inbox;
    return (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 px-4 py-6 text-center">
            <Icon className={`h-5 w-5 ${ok ? 'text-emerald-600' : 'text-muted-foreground'}`} aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    );
}

function Panel({ title, description, periode, count, action, className = '', children }) {
    return (
        <Card className={`self-start gap-4 py-5 shadow-none ${className}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-5">
                <div className="min-w-0 space-y-1">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {title}
                        {count > 0 && <Badge variant="secondary" className="px-1.5 font-normal tabular-nums">{count}</Badge>}
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {periode && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                            {periode}
                        </span>
                    )}
                    {action}
                </div>
            </CardHeader>
            <CardContent className="px-5">{children}</CardContent>
        </Card>
    );
}

/**
 * Baris daftar: informasi utama, informasi sekunder, nilai (meta), badge, dan chevron bila bisa dibuka.
 */
function Row({ title, sub, meta, metaSub, badge, to }) {
    const inner = (
        <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">{title || '-'}</p>
                {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {(meta != null || metaSub || badge) && (
                    <div className="flex flex-col items-end gap-1 text-right">
                        {meta != null && <div className="text-sm font-medium tabular-nums">{meta}</div>}
                        {metaSub && <div className="text-xs text-muted-foreground">{metaSub}</div>}
                        {badge}
                    </div>
                )}
                {to && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
            </div>
        </div>
    );
    return to
        ? <Link href={to} className="-mx-2 block rounded-md px-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</Link>
        : inner;
}

function List({ items, empty, ok = false, children }) {
    if (!items || items.length === 0) return <Empty ok={ok}>{empty}</Empty>;
    return <div className="divide-y divide-border/60">{children}</div>;
}

function Delta({ now, before, naikBaik = true }) {
    if (!before) return <span className="text-xs text-muted-foreground">Belum ada pembanding kemarin</span>;
    const pct = ((now - before) / before) * 100;
    if (Math.abs(pct) < 0.5) return <span className="text-xs text-muted-foreground">Sama seperti kemarin</span>;
    const naik = pct > 0;
    const baik = naik === naikBaik;
    const Icon = naik ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${baik ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {naik ? 'Naik' : 'Turun'} {Math.abs(pct).toFixed(0)}% dari kemarin
        </span>
    );
}

function Spark({ data, color = C.tinta }) {
    if (!data) return null;
    return (
        <div className="h-9 w-24 shrink-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.map((v, i) => ({ i, v }))}>
                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function AgingBar({ aging }) {
    const total = (aging ?? []).reduce((a, x) => a + (x.total || 0), 0);
    if (!total) return null;
    return (
        <div
            className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Umur piutang: ${aging.map((a) => `${a.label} ${rp(a.total)}`).join(', ')}`}
        >
            {aging.map((x, i) => x.total > 0 && (
                <div key={i} className={AGING_BG[i] ?? 'bg-slate-400'} style={{ width: `${(x.total / total) * 100}%` }} />
            ))}
        </div>
    );
}

/**
 * KPI card: ikon + nama metrik + periode, nilai utama, perubahan, keterangan,
 * visual mini (spark atau extra), dan tautan detail bila tersedia.
 */
function Kpi({ label, icon: Icon, value, periode, sub, delta, spark, color, extra, to, onDetail, detailLabel = 'Lihat detail' }) {
    const footer = to
        ? <Link href={to} className="inline-flex items-center gap-0.5 rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{detailLabel}<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        : onDetail
            ? <button type="button" onClick={onDetail} className="inline-flex items-center gap-0.5 rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{detailLabel}<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
            : null;
    return (
        <Card className="h-full gap-0 py-4 shadow-none">
            <CardContent className="flex h-full flex-col gap-3 px-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        {Icon && (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    </div>
                    {periode && <span className="shrink-0 text-xs text-muted-foreground">{periode}</span>}
                </div>
                <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                        <p className="break-words text-2xl font-semibold tabular-nums leading-tight">{value}</p>
                        {delta}
                        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                    </div>
                    <Spark data={spark} color={color} />
                </div>
                {extra && <div className="space-y-2">{extra}</div>}
                {footer && <div className="mt-auto pt-1">{footer}</div>}
            </CardContent>
        </Card>
    );
}

function MiniProgress({ value, tone = 'sehat', label }) {
    const v = Math.min(100, Math.max(0, value ?? 0));
    return (
        <div
            className="mt-2 h-1.5 w-full rounded-full bg-muted"
            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label}
        >
            <div className={`h-full rounded-full ${TONE[tone].bar}`} style={{ width: `${v}%` }} />
        </div>
    );
}

function Tile({ label, icon: Icon, value, hint, tone, progress }) {
    return (
        <div className="flex h-full flex-col rounded-lg bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                    {label}
                </p>
                {tone && <Pill tone={tone}>{STATUS_TILE[tone]}</Pill>}
            </div>
            <p className="mt-2 break-words text-2xl font-semibold tabular-nums">{value}</p>
            {progress != null && <MiniProgress value={progress} tone={tone ?? 'sehat'} label={label} />}
            {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

function Chart({ children, tinggi = 'h-56' }) {
    return <div className={`${tinggi} w-full`}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

const axis = { tick: { fontSize: 12 }, tickLine: false, axisLine: false };
const tip = { contentStyle: { borderRadius: 8, fontSize: 12 }, cursor: { fill: 'rgba(148,163,184,0.12)' } };

// ── Kesehatan proyek ────────────────────────────────────────────────
function Bar2({ label, v, cls, kuat = false }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-10 shrink-0 text-muted-foreground">{label}</span>
            <div
                className="h-2 flex-1 rounded-full bg-muted"
                role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v == null ? undefined : Math.round(v)}
                aria-label={`${label} terpakai`}
            >
                <div className={`h-full rounded-full ${cls}`} style={{ width: `${Math.min(100, Math.max(0, v ?? 0))}%` }} />
            </div>
            <span className={`w-10 shrink-0 text-right tabular-nums ${kuat ? 'font-semibold' : ''}`}>{v == null ? '-' : `${Math.round(v)}%`}</span>
        </div>
    );
}

function GapBiaya({ p, tone }) {
    if (p.persen_biaya == null || p.persen_waktu == null) return null;
    const gap = Math.round(p.persen_biaya - p.persen_waktu);
    if (gap > 0) {
        const tegas = tone === 'merah' || tone === 'kuning';
        return <p className={`text-xs ${tegas ? `font-medium ${TONE[tone].text}` : 'text-muted-foreground'}`}>Biaya {gap} poin di atas waktu</p>;
    }
    return <p className="text-xs text-muted-foreground">{gap === 0 ? 'Biaya sejalan dengan waktu' : `Biaya ${Math.abs(gap)} poin di bawah waktu`}</p>;
}

function Tenggat({ p }) {
    if (p.sisa_hari == null) return <span className="text-muted-foreground">-</span>;
    if (p.terlambat) return <Pill tone="merah">Lewat {Math.abs(p.sisa_hari)} hari</Pill>;
    if (p.sisa_hari <= 7) {
        return (
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${TONE.kuning.text}`}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                {p.sisa_hari} hari lagi
            </span>
        );
    }
    return <span className="text-sm tabular-nums">{p.sisa_hari} hari lagi</span>;
}

function LegendKesehatan({ rows }) {
    return (
        <div className="mt-4 flex flex-col gap-1.5 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-1.5"><Pill tone="sehat">Sehat</Pill>Biaya sejalan dengan waktu</span>
            <span className="inline-flex items-center gap-1.5"><Pill tone="kuning">Waspada</Pill>Biaya mulai melaju lebih cepat dari waktu</span>
            <span className="inline-flex items-center gap-1.5"><Pill tone="merah">Kritis</Pill>Risiko tertinggi, perlu ditinjau segera</span>
            {rows.some((p) => p.kesehatan === 'tanpa_rab') && (
                <span className="inline-flex items-center gap-1.5"><Pill tone="netral">Belum ada RAB</Pill>Biaya belum bisa dinilai</span>
            )}
        </div>
    );
}

function TabelKesehatan({ daftar, batas }) {
    const rows = batas ? daftar.slice(0, batas) : daftar;
    if (rows.length === 0) return <Empty>Belum ada proyek aktif. Ubah status proyek menjadi aktif agar muncul di sini.</Empty>;
    return (
        <>
            {/* Tablet dan desktop */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proyek</TableHead>
                            <TableHead className="min-w-[200px]">Biaya dan waktu terpakai</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Tenggat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((p) => {
                            const k = KESEHATAN[p.kesehatan] ?? KESEHATAN.tanpa_rab;
                            return (
                                <TableRow key={p.id} className={p.kesehatan === 'kritis' ? 'bg-red-50/40 dark:bg-red-950/10' : ''}>
                                    <TableCell>
                                        <p className="font-medium">{p.nama}</p>
                                        <p className="text-xs text-muted-foreground">{p.client || 'Proyek internal'}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1.5">
                                            <Bar2 label="Biaya" v={p.persen_biaya} cls={TONE[k.tone].bar} kuat />
                                            <Bar2 label="Waktu" v={p.persen_waktu} cls="bg-slate-300 dark:bg-slate-600" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Pill tone={k.tone}>{k.label}</Pill>
                                            <GapBiaya p={p} tone={k.tone} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right"><Tenggat p={p} /></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile: kartu per proyek agar tidak perlu scroll horizontal */}
            <div className="space-y-3 md:hidden">
                {rows.map((p) => {
                    const k = KESEHATAN[p.kesehatan] ?? KESEHATAN.tanpa_rab;
                    return (
                        <div key={p.id} className="space-y-2.5 rounded-lg bg-muted/40 p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-medium">{p.nama}</p>
                                    <p className="text-xs text-muted-foreground">{p.client || 'Proyek internal'}</p>
                                </div>
                                <Pill tone={k.tone}>{k.label}</Pill>
                            </div>
                            <div className="space-y-1.5">
                                <Bar2 label="Biaya" v={p.persen_biaya} cls={TONE[k.tone].bar} kuat />
                                <Bar2 label="Waktu" v={p.persen_waktu} cls="bg-slate-300 dark:bg-slate-600" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <GapBiaya p={p} tone={k.tone} />
                                <Tenggat p={p} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <LegendKesehatan rows={rows} />
        </>
    );
}

// ── Perlu keputusan ─────────────────────────────────────────────────
function PerluTindakan({ items }) {
    if (!items || items.length === 0) {
        return (
            <section className="flex items-start gap-3 rounded-xl bg-emerald-50 px-5 py-4 text-emerald-900 ring-1 ring-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/60">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                    <p className="font-semibold">Tidak ada yang menunggu keputusan Anda</p>
                    <p className="text-sm opacity-80">Persetujuan, jadwal servis, dan antrean uji semuanya sudah tertangani.</p>
                    <p className="mt-1 text-xs opacity-70">Data diperbarui otomatis setiap 5 menit. Item baru akan muncul di sini.</p>
                </div>
            </section>
        );
    }
    const urut = [...items].sort((a, b) => (URGENSI[a.tone]?.urut ?? 2) - (URGENSI[b.tone]?.urut ?? 2));
    const nMerah = items.filter((i) => i.tone === 'merah').length;
    const nKuning = items.filter((i) => i.tone === 'kuning').length;
    return (
        <section className={`rounded-xl p-5 ring-1 ${nMerah > 0 ? 'bg-red-50/70 ring-red-200/70 dark:bg-red-950/20 dark:ring-red-900/60' : 'bg-amber-50/70 ring-amber-200/70 dark:bg-amber-950/20 dark:ring-amber-900/60'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold">{items.length} hal perlu perhatian Anda hari ini</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">Diurutkan dari yang paling mendesak. Pilih item untuk membuka halaman terkait.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {nMerah > 0 && <Pill tone="merah">{nMerah} mendesak</Pill>}
                    {nKuning > 0 && <Pill tone="kuning">{nKuning} perlu perhatian</Pill>}
                </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {urut.map((it) => {
                    const T = TONE[it.tone] ?? TONE.netral;
                    const U = URGENSI[it.tone] ?? URGENSI.netral;
                    const body = (
                        <div className="flex h-full items-start gap-3 rounded-lg bg-card p-3 shadow-sm">
                            <span className={`flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-lg font-semibold tabular-nums ${T.soft}`}>{it.count}</span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p className="text-sm font-medium">{it.label}</p>
                                    <Pill tone={it.tone}>{U.label}</Pill>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{it.hint}</p>
                            </div>
                            {it.href && <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                        </div>
                    );
                    return it.href
                        ? <Link key={it.key} href={it.href} className="block rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{body}</Link>
                        : <div key={it.key}>{body}</div>;
                })}
            </div>
        </section>
    );
}

// ── Heading konteks tab ─────────────────────────────────────────────
function TabHeading({ meta }) {
    const Icon = meta.icon;
    return (
        <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="text-lg font-semibold leading-tight">{meta.judul}</h3>
                    <p className="text-sm text-muted-foreground">{meta.deskripsi}</p>
                </div>
            </div>
            {meta.periode && (
                <Badge variant="secondary" className="gap-1 font-normal">
                    <CalendarClock className="h-3 w-3" aria-hidden="true" />
                    {meta.periode}
                </Badge>
            )}
        </div>
    );
}

// ── Halaman ─────────────────────────────────────────────────────────
export default function Dashboard({ auth, ownerData = {} }) {
    const s = ownerData.summary_today ?? {};
    const ins = ownerData.insights ?? {};
    const w = ownerData.widgets ?? {};
    const acc = ownerData.access ?? {};
    const permissions = auth?.permissions ?? [];
    const activeRole = auth?.active_role;
    const canViewProjectMap = (
        (permissions.includes('manage proyek') && auth?.portal !== 'kontraktor')
        || permissions.includes('view owner dashboard')
        || ['Owner', 'Superadmin', 'Admin', 'Mandor Proyek', 'Mandor Titik', 'Ketua Divisi Kontraktor', 'Admin Keuangan'].includes(activeRole)
    );
    const rab = ownerData.rab_summary;
    const kpi = ins.kpi ?? {};
    const kesehatan = ins.kesehatan_proyek;
    const [tab, setTab] = useState('ringkasan');
    const [filterProyek, setFilterProyek] = useState('semua');
    const [memuat, setMemuat] = useState(false);
    const [sekarang, setSekarang] = useState(() => new Date());
    const tabsRef = useRef(null);

    const muatUlang = () => router.reload({ only: ['ownerData'], onStart: () => setMemuat(true), onFinish: () => setMemuat(false) });
    useEffect(() => {
        const t = setInterval(() => router.reload({ only: ['ownerData'], preserveScroll: true }), 5 * 60 * 1000);
        return () => clearInterval(t);
    }, []);
    useEffect(() => {
        const t = setInterval(() => setSekarang(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Indikator antrean di tab hanya muncul bila datanya tersedia dan lebih dari nol.
    const tabs = useMemo(() => {
        const n = (v) => Number(v ?? 0);
        const antre = {
            proyek: n(kesehatan?.ringkasan?.kritis) > 0 ? { n: n(kesehatan.ringkasan.kritis), tone: 'merah', label: 'proyek kritis' } : null,
            armada: n(ins.armada?.servis_terlambat) > 0 ? { n: n(ins.armada.servis_terlambat), tone: 'merah', label: 'unit lewat jadwal servis' } : null,
            produksi: n(ins.produksi?.qc_menunggu) > 0 ? { n: n(ins.produksi.qc_menunggu), tone: 'kuning', label: 'uji tekan menunggu hasil' } : null,
            sdm: (n(ins.sdm?.cuti_pending) + n(ins.sdm?.presensi_luar_radius)) > 0
                ? { n: n(ins.sdm.cuti_pending) + n(ins.sdm.presensi_luar_radius), tone: 'kuning', label: 'menunggu tindak lanjut' }
                : null,
        };
        return [
            { id: 'ringkasan', ada: true },
            { id: 'keuangan', ada: !!ins.keuangan },
            { id: 'proyek', ada: (ownerData.proyek_list ?? []).length > 0 },
            { id: 'armada', ada: !!w.armada },
            { id: 'produksi', ada: !!w.produksi },
            { id: 'sdm', ada: !!ins.sdm },
        ].filter((t) => t.ada).map((t) => ({ ...t, ...TAB_META[t.id], badge: antre[t.id] ?? null }));
    }, [ins, w, kesehatan, ownerData.proyek_list]);

    const pindahTab = (id) => {
        setTab(id);
        requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    const bukaTab = (id) => (tabs.some((t) => t.id === id) ? () => pindahTab(id) : undefined);

    const hariIni = sekarang.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const waktuSekarang = sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const aging = ins.keuangan?.aging ?? [];
    const agingLama = ins.keuangan?.aging?.[2];
    const runway = ins.keuangan?.runway_hari;
    const runwayTone = runway == null ? 'netral' : runway < 30 ? 'merah' : runway < 60 ? 'kuning' : 'sehat';
    const jumlahInvoice = s.invoice_terbit ?? s.invoice_count;
    const titikTampil = (ownerData.peta_titik ?? []).filter((t) => filterProyek === 'semua' || String(t.proyek_id) === filterProyek);
    const daftarKesehatan = kesehatan?.daftar ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">Ringkasan hari ini</h2>
                        <p className="mt-1 text-sm text-gray-500">{hariIni}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {auth?.active_role && (
                            <span className="inline-flex border-2 border-black bg-surface-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ink-secondary">
                                {auth.active_role}
                            </span>
                        )}
                        <p className="flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground" aria-label={`Waktu saat ini ${waktuSekarang}`}>
                            <Clock3 className="h-4 w-4" aria-hidden="true" />
                            {waktuSekarang}
                        </p>
                        <Button variant="outline" size="sm" onClick={muatUlang} disabled={memuat}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${memuat ? 'animate-spin' : ''}`} aria-hidden="true" />
                            Muat ulang data
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />
            <div className={`mx-auto max-w-screen-2xl space-y-6 transition-opacity ${memuat ? 'opacity-70' : ''}`} aria-busy={memuat}>
                {ins.perlu_tindakan && <PerluTindakan items={ins.perlu_tindakan} />}

                {/* KPI utama: hanya yang boleh dilihat user */}
                <section aria-label="Indikator utama" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {s.saldo_kas !== undefined && (
                        <Kpi label="Saldo kas dan bank" icon={Wallet} periode="Saat ini" value={rp(s.saldo_kas)}
                            sub={runway != null ? 'Total semua akun aktif. Perkiraan berdasarkan pengeluaran 30 hari terakhir.' : 'Total semua akun aktif'}
                            extra={runway != null && <Pill tone={runwayTone}>Kas bertahan sekitar {runway} hari</Pill>}
                            onDetail={bukaTab('keuangan')} detailLabel="Lihat keuangan" />
                    )}
                    {s.piutang_outstanding !== undefined && (
                        <Kpi label="Piutang belum dibayar" icon={FileText} periode="Saat ini" value={rp(s.piutang_outstanding)}
                            sub={jumlahInvoice != null ? `${jumlahInvoice} invoice tercatat` : undefined}
                            extra={<>
                                <AgingBar aging={aging} />
                                {agingLama && (agingLama.total > 0
                                    ? <Pill tone="merah">{rp(agingLama.total)} sudah lewat 60 hari</Pill>
                                    : <Pill tone="sehat">Tidak ada yang lewat 60 hari</Pill>)}
                            </>}
                            onDetail={bukaTab('keuangan')} detailLabel="Lihat umur piutang" />
                    )}
                    {s.pengeluaran !== undefined && (
                        <Kpi label="Pengeluaran hari ini" icon={Receipt} periode="Hari ini" value={rp(s.pengeluaran)} spark={kpi.pengeluaran?.deret} color={C.merah}
                            delta={kpi.pengeluaran && <Delta now={kpi.pengeluaran.hari_ini} before={kpi.pengeluaran.kemarin} naikBaik={false} />}
                            sub={kpi.pengeluaran?.kemarin != null ? `Kemarin ${rp(kpi.pengeluaran.kemarin)}` : undefined} />
                    )}
                    {s.produksi_output !== undefined && (
                        <Kpi label="Output produksi hari ini" icon={Factory} periode="Hari ini" value={angka.format(s.produksi_output)} spark={kpi.produksi?.deret} color={C.tinta}
                            delta={kpi.produksi && <Delta now={kpi.produksi.hari_ini} before={kpi.produksi.kemarin} />}
                            sub={ins.produksi?.output_bulan_ini != null ? `Bulan ini ${angka.format(ins.produksi.output_bulan_ini)}` : (kpi.produksi?.kemarin != null ? `Kemarin ${angka.format(kpi.produksi.kemarin)}` : undefined)}
                            onDetail={bukaTab('produksi')} detailLabel="Lihat produksi" />
                    )}
                    {s.ritase_today !== undefined && (
                        <Kpi label="Ritase hari ini" icon={Truck} periode="Hari ini" value={angka.format(s.ritase_today)} spark={kpi.ritase?.deret} color={C.biru}
                            delta={kpi.ritase && <Delta now={kpi.ritase.hari_ini} before={kpi.ritase.kemarin} />}
                            sub={ins.armada ? `${ins.armada.beroperasi_hari_ini} dari ${ins.armada.aktif} unit aktif beroperasi` : (kpi.ritase?.kemarin != null ? `Kemarin ${angka.format(kpi.ritase.kemarin)}` : undefined)}
                            onDetail={bukaTab('armada')} detailLabel="Lihat armada" />
                    )}
                    {s.po_pending_approval !== undefined && (
                        <Kpi label="PO menunggu approval" icon={ClipboardCheck} periode="Saat ini" value={s.po_pending_approval}
                            sub="Antrean persetujuan finance dan owner"
                            extra={s.po_pending_approval > 0 ? <Pill tone="kuning">Ada antrean</Pill> : <Pill tone="sehat">Antrean kosong</Pill>}
                            to={href('purchase-orders.index')} detailLabel="Buka daftar PO" />
                    )}
                    {s.proyek_aktif !== undefined && <Kpi label="Proyek aktif" icon={BriefcaseBusiness} periode="Saat ini" value={s.proyek_aktif} sub="Kontrak klien Anda" onDetail={bukaTab('proyek')} detailLabel="Lihat proyek" />}
                    {s.total_proyek !== undefined && s.proyek_aktif === undefined && (
                        <Kpi label="Titik aktif" icon={MapPin} periode="Saat ini" value={s.total_titik_aktif} sub={`dari ${s.total_proyek} proyek`} />
                    )}
                </section>

                {canViewProjectMap && (
                    <DashboardPetaProyek
                        titiks={ownerData.peta_titik ?? []}
                        proyeks={ownerData.proyek_list ?? []}
                    />
                )}

                <Tabs value={tab} onValueChange={setTab} className="flex-col gap-4" ref={tabsRef}>
                    <div className="w-full overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                        <TabsList className="h-auto w-fit min-w-max gap-1 rounded-md border bg-muted p-1" aria-label="Kategori dashboard">
                            {tabs.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <TabsTrigger
                                        key={t.id}
                                        value={t.id}
                                        title={t.deskripsi}
                                        className="h-9 gap-2 rounded-md px-3.5 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-active:bg-gray-900 data-active:font-semibold data-active:text-white data-active:shadow-sm"
                                    >
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        {t.label}
                                        {t.badge && (
                                            <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${t.badge.tone === 'merah' ? 'bg-red-600 text-white' : 'bg-amber-200 text-amber-950'}`}>
                                                {t.badge.n}
                                                <span className="sr-only"> {t.badge.label}</span>
                                            </span>
                                        )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    {/* ── Ringkasan ── (heading dilewati: header halaman dan KPI di atas sudah memberi konteks) */}
                    <TabsContent value="ringkasan" className="space-y-4">
                        <p className="text-sm text-muted-foreground">{TAB_META.ringkasan.deskripsi}</p>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="space-y-4 lg:col-span-2">
                                {kesehatan && (
                                    <Panel title="Kesehatan proyek aktif"
                                        description="Biaya dibandingkan dengan waktu yang sudah berjalan. Waspada bila biaya melaju lebih cepat dari waktu."
                                        action={<div className="flex flex-wrap gap-1.5">
                                            {kesehatan.ringkasan.kritis > 0 && <Pill tone="merah">{kesehatan.ringkasan.kritis} kritis</Pill>}
                                            {kesehatan.ringkasan.waspada > 0 && <Pill tone="kuning">{kesehatan.ringkasan.waspada} waspada</Pill>}
                                            <Pill tone="sehat">{kesehatan.ringkasan.sehat} sehat</Pill>
                                        </div>}>
                                        <TabelKesehatan daftar={daftarKesehatan} batas={5} />
                                        {daftarKesehatan.length > 5 && (
                                            <Button variant="link" className="mt-2 px-0" onClick={() => pindahTab('proyek')}>Lihat semua {daftarKesehatan.length} proyek</Button>
                                        )}
                                    </Panel>
                                )}
                                <div className="grid gap-4 md:grid-cols-2">
                                    {ownerData.tren_bulanan?.[0]?.produksi !== undefined && (
                                        <Panel title="Output produksi per bulan" description="Total output semua produk" periode="6 bulan terakhir">
                                            {ownerData.tren_bulanan.every((x) => !x.produksi)
                                                ? <Empty>Belum ada output produksi pada 6 bulan terakhir.</Empty>
                                                : (
                                                    <Chart>
                                                        <BarChart data={ownerData.tren_bulanan}>
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                                            <XAxis dataKey="bulan" {...axis} /><YAxis width={44} tickFormatter={(v) => compact.format(v)} {...axis} />
                                                            <Tooltip formatter={(v) => angka.format(v)} {...tip} />
                                                            <Bar dataKey="produksi" name="Output" fill={C.tinta} radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </Chart>
                                                )}
                                        </Panel>
                                    )}
                                    {ownerData.tren_bulanan?.[0]?.pengeluaran !== undefined && (
                                        <Panel title="Pengeluaran per bulan" description="Pembayaran PO dalam rupiah" periode="6 bulan terakhir">
                                            {ownerData.tren_bulanan.every((x) => !x.pengeluaran)
                                                ? <Empty>Belum ada pembayaran PO pada 6 bulan terakhir.</Empty>
                                                : (
                                                    <Chart>
                                                        <AreaChart data={ownerData.tren_bulanan}>
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                                            <XAxis dataKey="bulan" {...axis} /><YAxis width={68} tickFormatter={(v) => rp(v)} {...axis} />
                                                            <Tooltip formatter={(v) => rpPenuh(v)} {...tip} />
                                                            <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke={C.merah} fill={C.merah} fillOpacity={0.12} strokeWidth={2} />
                                                        </AreaChart>
                                                    </Chart>
                                                )}
                                        </Panel>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {w.admin?.po_pending_list && (
                                    <Panel title="PO menunggu approval" description="Perlu persetujuan sebelum diproses" count={w.admin.po_pending_list.length}>
                                        <List items={w.admin.po_pending_list} empty="Tidak ada PO yang menunggu." ok>
                                            {w.admin.po_pending_list.map((po) => (
                                                <Row key={po.id} title={po.kode_po} sub={`${po.supplier ?? '-'} · ${po.proyek ?? '-'}`}
                                                    meta={rp(po.total)}
                                                    badge={po.status_label ? <Pill tone="netral">{po.status_label}</Pill> : null}
                                                    to={href('purchase-orders.show', po.id)} />
                                            ))}
                                        </List>
                                    </Panel>
                                )}
                                {w.admin?.deadline_list && (
                                    <Panel title="Tenggat proyek" description="Proyek yang jatuh tempo, urut dari yang terdekat" periode="30 hari ke depan" count={w.admin.deadline_list.length}>
                                        <List items={w.admin.deadline_list} empty="Tidak ada proyek yang jatuh tempo dalam 30 hari." ok>
                                            {w.admin.deadline_list.map((p) => (
                                                <Row key={p.id} title={p.nama} sub={[p.client, p.unit].filter(Boolean).join(' · ')}
                                                    meta={<span className={p.sisa_hari <= 7 ? TONE.kuning.text : ''}>{p.sisa_hari} hari lagi</span>}
                                                    badge={p.sisa_hari <= 7 ? <Pill tone="kuning">Segera</Pill> : null} />
                                            ))}
                                        </List>
                                    </Panel>
                                )}
                                {w.admin?.unit_summary?.length > 1 && (
                                    <Panel title="Per unit bisnis" description="Sebaran proyek, titik, armada, dan pengguna">
                                        <List items={w.admin.unit_summary} empty="Belum ada unit bisnis.">
                                            {w.admin.unit_summary.map((u) => (
                                                <Row key={u.unit} title={u.unit} sub={`${u.proyek_aktif} proyek · ${u.titik_aktif} titik · ${u.armada_aktif} armada`} meta={`${u.pengguna} pengguna`} />
                                            ))}
                                        </List>
                                    </Panel>
                                )}
                                {w.admin?.audit_list && (
                                    <Panel title="Aktivitas terbaru" description="Perubahan terakhir yang tercatat di sistem"
                                        action={acc.can_view_audit && href('audit.logs') ? <Button asChild variant="link" className="h-auto p-0"><Link href={href('audit.logs')}>Semua log</Link></Button> : null}>
                                        <List items={w.admin.audit_list} empty="Belum ada aktivitas tercatat.">
                                            {w.admin.audit_list.map((a) => (
                                                <Row key={a.id} title={a.description} sub={`${a.causer ?? 'Sistem'} · ${a.created_at}`} />
                                            ))}
                                        </List>
                                    </Panel>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Keuangan ── */}
                    {ins.keuangan && (
                        <TabsContent value="keuangan" className="space-y-4">
                            <TabHeading meta={TAB_META.keuangan} />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Tile icon={Wallet} label="Saldo kas dan bank" value={rpPenuh(s.saldo_kas)} hint="Total semua akun aktif" />
                                <Tile icon={Receipt} label="Pengeluaran rata-rata per hari" value={rpPenuh(ins.keuangan.rata_keluar_harian)} hint="Rata-rata 30 hari terakhir" />
                                <Tile icon={Clock3} label="Perkiraan kas bertahan" value={runway != null ? `${runway} hari` : '-'}
                                    tone={runway == null ? undefined : runwayTone}
                                    hint="Saldo dibagi pengeluaran harian, tanpa pemasukan baru" />
                            </div>
                            <Panel title="Arus kas harian" description="Uang masuk dan keluar per hari dari buku kas dan bank" periode="30 hari terakhir">
                                {!ins.keuangan.arus_kas_30?.length ? <Empty>Belum ada transaksi kas dan bank pada 30 hari terakhir.</Empty> : (
                                    <Chart tinggi="h-64">
                                        <BarChart data={ins.keuangan.arus_kas_30}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                            <XAxis dataKey="tanggal" tickFormatter={tgl} interval={4} {...axis} />
                                            <YAxis width={68} tickFormatter={(v) => rp(v)} {...axis} />
                                            <Tooltip formatter={(v) => rpPenuh(v)} labelFormatter={tgl} {...tip} />
                                            <Legend />
                                            <Bar dataKey="masuk" name="Masuk" fill={C.hijau} radius={[3, 3, 0, 0]} />
                                            <Bar dataKey="keluar" name="Keluar" fill={C.merah} radius={[3, 3, 0, 0]} />
                                        </BarChart>
                                    </Chart>
                                )}
                            </Panel>
                            <div className="grid gap-4 lg:grid-cols-2">
                                <Panel title="Umur piutang" description={`Total ${rpPenuh(ins.keuangan.piutang_total)} belum dibayar`} periode="Per hari ini">
                                    {aging.length === 0 ? <Empty>Belum ada piutang berjalan.</Empty> : (
                                        <>
                                            <Chart tinggi="h-48">
                                                <BarChart data={aging} layout="vertical" margin={{ left: 24 }}>
                                                    <XAxis type="number" tickFormatter={(v) => rp(v)} {...axis} />
                                                    <YAxis type="category" dataKey="label" width={110} {...axis} />
                                                    <Tooltip formatter={(v) => rpPenuh(v)} {...tip} />
                                                    <Bar dataKey="total" name="Piutang" radius={[0, 4, 4, 0]}>
                                                        {aging.map((_, i) => <Cell key={i} fill={[C.hijau, C.amber, C.merah][i]} />)}
                                                    </Bar>
                                                </BarChart>
                                            </Chart>
                                            <ul className="mt-3 space-y-1.5 text-sm">
                                                {aging.map((a, i) => (
                                                    <li key={i} className="flex items-center justify-between gap-3">
                                                        <span className="flex flex-wrap items-center gap-2">
                                                            <span className={`h-2.5 w-2.5 rounded-sm ${AGING_BG[i] ?? 'bg-slate-400'}`} aria-hidden="true" />
                                                            {a.label}
                                                            {i === 2 && a.total > 0 && <Pill tone="merah">Perlu ditagih</Pill>}
                                                        </span>
                                                        <span className="tabular-nums">{rpPenuh(a.total)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="mt-3 text-xs text-muted-foreground">Umur dihitung sejak invoice dibuat.</p>
                                        </>
                                    )}
                                </Panel>
                                <Panel title="Klien dengan piutang terbesar" description="Urut dari total piutang tertinggi">
                                    <List items={ins.keuangan.top_piutang} empty="Tidak ada piutang berjalan." ok>
                                        {(ins.keuangan.top_piutang ?? []).map((k) => (
                                            <Row key={k.klien} title={k.klien} meta={rpPenuh(k.total)}
                                                metaSub={ins.keuangan.piutang_total > 0 ? `${Math.round((k.total / ins.keuangan.piutang_total) * 100)}% dari total piutang` : undefined} />
                                        ))}
                                    </List>
                                </Panel>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-2">
                                <Panel title="Margin per proyek" description="Tagihan diterbitkan dikurangi realisasi biaya RAB">
                                    <List items={ins.keuangan.margin_proyek} empty="Belum ada invoice terbit. Margin muncul setelah invoice pertama diterbitkan.">
                                        {(ins.keuangan.margin_proyek ?? []).map((m) => (
                                            <Row key={m.proyek} title={m.proyek} sub={`Tagihan ${rp(m.pendapatan)} · biaya ${rp(m.biaya)}`}
                                                meta={m.margin_persen == null ? '-' : <Pill tone={m.margin_persen < 0 ? 'merah' : m.margin_persen < 10 ? 'kuning' : 'sehat'}>Margin {m.margin_persen}%</Pill>} />
                                        ))}
                                    </List>
                                </Panel>
                                {rab && (
                                    <Panel title="Serapan RAB semua proyek aktif" description={`${rab.total_proyek_aktif} proyek`} periode="Akumulasi">
                                        <div className="flex flex-wrap items-baseline gap-3">
                                            <p className="text-3xl font-semibold tabular-nums">{rab.persentase}%</p>
                                            <Pill tone={rab.persentase > 100 ? 'merah' : rab.persentase > 85 ? 'kuning' : 'sehat'}>
                                                {rab.persentase > 100 ? 'Melebihi rencana' : rab.persentase > 85 ? 'Mendekati batas' : 'Terkendali'}
                                            </Pill>
                                        </div>
                                        <MiniProgress value={rab.persentase} tone={rab.persentase > 100 ? 'merah' : rab.persentase > 85 ? 'kuning' : 'sehat'} label="Serapan RAB" />
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            Terpakai {rpPenuh(rab.total_realisasi)} dari rencana {rpPenuh(rab.total_rencana)}
                                        </p>
                                    </Panel>
                                )}
                            </div>
                        </TabsContent>
                    )}

                    {/* ── Proyek ── */}
                    <TabsContent value="proyek" className="space-y-4">
                        <TabHeading meta={TAB_META.proyek} />
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Tampilkan</span>
                            <Select value={filterProyek} onValueChange={setFilterProyek}>
                                <SelectTrigger className="w-64" aria-label="Filter proyek"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="semua">Semua proyek</SelectItem>
                                    {(ownerData.proyek_list ?? []).map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {kesehatan && (
                            <Panel title="Kesehatan proyek aktif" description="Bandingkan persentase biaya dengan persentase waktu untuk melihat proyek yang berisiko.">
                                <TabelKesehatan daftar={daftarKesehatan.filter((p) => filterProyek === 'semua' || String(p.id) === filterProyek)} />
                            </Panel>
                        )}
                        {PETA_TITIK && <PETA_TITIK titik={titikTampil} />}
                        <Panel title="Titik aktif" description="Lokasi kerja dengan tenaga dan armada yang ditugaskan" count={titikTampil.length}>
                            {titikTampil.length === 0 ? <Empty>Belum ada titik aktif pada proyek ini.</Empty> : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Titik</TableHead><TableHead>Proyek</TableHead><TableHead className="text-right">SDM</TableHead><TableHead className="text-right">Armada</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {titikTampil.map((t) => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="font-medium">{t.nama}</TableCell>
                                                    <TableCell className="text-muted-foreground">{t.proyek_nama}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{t.sdm_count}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{t.armada_count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </Panel>
                    </TabsContent>

                    {/* ── Armada ── */}
                    {w.armada && (
                        <TabsContent value="armada" className="space-y-4">
                            <TabHeading meta={TAB_META.armada} />
                            {ins.armada && (
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <Tile icon={Truck} label="Unit beroperasi hari ini" value={`${ins.armada.utilisasi_persen}%`} progress={ins.armada.utilisasi_persen}
                                        hint={`${ins.armada.beroperasi_hari_ini} dari ${ins.armada.aktif} unit aktif punya ritase`}
                                        tone={ins.armada.utilisasi_persen < 40 ? 'kuning' : 'sehat'} />
                                    <Tile icon={Receipt} label="Biaya BBM per rit" value={ins.armada.bbm_per_rit != null ? rpPenuh(ins.armada.bbm_per_rit) : '-'} hint="Bulan berjalan" />
                                    <Tile icon={AlertTriangle} label="Kejadian downtime bulan ini" value={ins.armada.kejadian_downtime_bulan_ini} tone={ins.armada.kejadian_downtime_bulan_ini > 0 ? 'kuning' : 'sehat'} hint="Bulan berjalan" />
                                    <Tile icon={CalendarClock} label="Lewat jadwal servis" value={ins.armada.servis_terlambat} hint="Lebih dari 90 hari sejak servis terakhir" tone={ins.armada.servis_terlambat > 0 ? 'merah' : 'sehat'} />
                                </div>
                            )}
                            <div className="grid gap-4 lg:grid-cols-2">
                                <Panel title="Komposisi status armada" description={`${w.armada.total_armada} unit terdaftar`} periode="Saat ini">
                                    {!w.armada.status_distribution?.length ? <Empty>Belum ada armada terdaftar.</Empty> : (
                                        <Chart tinggi="h-52">
                                            <PieChart>
                                                <Pie data={w.armada.status_distribution} dataKey="total" nameKey="status" innerRadius={45} outerRadius={80} paddingAngle={2}>
                                                    {w.armada.status_distribution.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(v) => `${angka.format(v)} unit`} {...tip} /><Legend />
                                            </PieChart>
                                        </Chart>
                                    )}
                                </Panel>
                                <Panel title="Pengisian BBM per unit" description="Liter terisi per unit" periode="Hari ini">
                                    {w.armada.bbm_today_chart.length === 0 ? <Empty>Belum ada pengisian BBM hari ini.</Empty> : (
                                        <Chart tinggi="h-52">
                                            <BarChart data={w.armada.bbm_today_chart}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                                <XAxis dataKey="armada" {...axis} /><YAxis width={36} {...axis} />
                                                <Tooltip formatter={(v, n) => (n === 'Biaya' ? rpPenuh(v) : `${angka.format(v)} liter`)} {...tip} />
                                                <Bar dataKey="liter" name="Liter" fill={C.amber} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </Chart>
                                    )}
                                </Panel>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-3">
                                <Panel title="Lewat jadwal servis" description="Unit yang perlu segera diservis" count={w.armada.servis_due_list?.length}>
                                    <List items={w.armada.servis_due_list} empty="Semua unit aktif masih dalam jadwal servis." ok>
                                        {w.armada.servis_due_list.map((a) => (
                                            <Row key={a.id} title={`${a.kode_unit} ${a.plat_nomor ?? ''}`} sub={`Servis terakhir ${a.tanggal_servis_terakhir}`}
                                                meta={`Lewat ${Math.abs(a.sisa_hari)} hari`} badge={<Pill tone="merah">Terlambat</Pill>} to={href('fleet.armada.show', a.id)} />
                                        ))}
                                    </List>
                                </Panel>
                                <Panel title="Sedang downtime" description="Unit yang saat ini tidak beroperasi" count={w.armada.downtime_list?.length}>
                                    <List items={w.armada.downtime_list} empty="Tidak ada unit yang sedang downtime." ok>
                                        {w.armada.downtime_list.map((d) => (
                                            <Row key={d.id} title={d.armada} sub={d.penyebab || d.kategori}
                                                meta={`${Math.floor(d.durasi_menit / 60)} jam ${d.durasi_menit % 60} mnt`}
                                                badge={d.penyebab && d.kategori ? <Pill tone="kuning">{d.kategori}</Pill> : null}
                                                to={href('fleet.armada.show', d.armada_id)} />
                                        ))}
                                    </List>
                                </Panel>
                                <Panel title="Unit paling sering downtime" description="Jumlah kejadian per unit" periode="Bulan ini">
                                    <List items={ins.armada?.sering_downtime} empty="Belum ada downtime bulan ini." ok>
                                        {(ins.armada?.sering_downtime ?? []).map((a) => <Row key={a.armada} title={a.armada} meta={`${a.kejadian}×`} metaSub="kejadian" />)}
                                    </List>
                                </Panel>
                            </div>
                            <Panel title="Ritase hari ini" description="Perjalanan tercatat per unit, rute, dan driver" periode="Hari ini" count={w.armada.ritase_today_list?.length}>
                                <List items={w.armada.ritase_today_list} empty="Belum ada ritase tercatat hari ini.">
                                    {w.armada.ritase_today_list.map((r) => (
                                        <Row key={r.id} title={r.armada} sub={`${r.rute ?? '-'} · ${r.driver ?? 'Tanpa driver'}`}
                                            meta={`${angka.format(r.jumlah_rit)} rit`} badge={r.status ? <Pill tone="netral">{r.status}</Pill> : null} />
                                    ))}
                                </List>
                            </Panel>
                        </TabsContent>
                    )}

                    {/* ── Produksi ── */}
                    {w.produksi && (
                        <TabsContent value="produksi" className="space-y-4">
                            <TabHeading meta={TAB_META.produksi} />
                            {ins.produksi && (
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <Tile icon={Factory} label="Output bulan ini" value={angka.format(ins.produksi.output_bulan_ini)}
                                        hint={`Bulan lalu ${angka.format(ins.produksi.output_bulan_lalu)}`} />
                                    <Tile icon={CheckCircle2} label="Uji tekan terselesaikan" value={ins.produksi.qc_selesai_persen != null ? `${ins.produksi.qc_selesai_persen}%` : '-'}
                                        progress={ins.produksi.qc_selesai_persen}
                                        hint="Sampel 30 hari terakhir yang sudah ada hasilnya"
                                        tone={ins.produksi.qc_selesai_persen == null ? undefined : ins.produksi.qc_selesai_persen < 70 ? 'kuning' : 'sehat'} />
                                    <Tile icon={Clock3} label="Uji tekan menunggu hasil" value={ins.produksi.qc_menunggu} tone={ins.produksi.qc_menunggu > 0 ? 'kuning' : 'sehat'} hint="Sampel yang belum ada hasilnya" />
                                    <Tile icon={Factory} label="Mesin aktif" value={s.mesin_aktif ?? '-'} />
                                </div>
                            )}
                            <div className="grid gap-4 lg:grid-cols-2">
                                <Panel title="Output harian" description="Total output semua produk per hari" periode="7 hari terakhir">
                                    {!w.produksi.tren_7_hari?.length ? <Empty>Belum ada output produksi pada 7 hari terakhir.</Empty> : (
                                        <Chart>
                                            <AreaChart data={w.produksi.tren_7_hari}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                                <XAxis dataKey="tanggal" tickFormatter={tgl} {...axis} /><YAxis width={40} {...axis} />
                                                <Tooltip formatter={(v) => angka.format(v)} labelFormatter={tgl} {...tip} />
                                                <Area type="monotone" dataKey="output" name="Output" stroke={C.tinta} fill={C.tinta} fillOpacity={0.14} strokeWidth={2} />
                                            </AreaChart>
                                        </Chart>
                                    )}
                                </Panel>
                                <Panel title="Output per produk" description="Jumlah output sesuai satuan masing-masing produk" periode="Hari ini">
                                    {w.produksi.output_per_produk.length === 0 ? <Empty>Belum ada sesi produksi hari ini.</Empty> : (
                                        <Chart>
                                            <BarChart data={w.produksi.output_per_produk} layout="vertical" margin={{ left: 16 }}>
                                                <XAxis type="number" {...axis} />
                                                <YAxis type="category" dataKey="produk" width={110} {...axis} />
                                                <Tooltip formatter={(v, _n, p) => `${angka.format(v)} ${p.payload.satuan ?? ''}`} {...tip} />
                                                <Bar dataKey="output" name="Output" fill={C.tinta} radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </Chart>
                                    )}
                                </Panel>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-3">
                                <Panel title="Sesi berjalan" description="Produksi yang sedang berlangsung" count={w.produksi.sesi_berjalan_list?.length}>
                                    <List items={w.produksi.sesi_berjalan_list} empty="Tidak ada sesi yang sedang berjalan.">
                                        {w.produksi.sesi_berjalan_list.map((x) => <Row key={x.id} title={x.produk} sub={`${x.mesin ?? '-'} · ${x.titik ?? '-'}`} badge={<Pill tone="sehat" icon={false}>Berjalan</Pill>} />)}
                                    </List>
                                </Panel>
                                <Panel title="Uji tekan menunggu hasil" description="Sampel yang masih perlu diuji" count={w.produksi.qc_pending_list?.length}>
                                    <List items={w.produksi.qc_pending_list} empty="Semua uji tekan sudah ada hasilnya." ok>
                                        {w.produksi.qc_pending_list.map((q) => <Row key={q.id} title={q.produk} sub={q.titik} meta={q.rencana_uji_tekan ?? '-'} metaSub="Rencana uji" />)}
                                    </List>
                                </Panel>
                                <Panel title="Pengiriman" description="Pengiriman produk yang tercatat" periode="Hari ini" count={w.produksi.pengiriman_today_list?.length}>
                                    <List items={w.produksi.pengiriman_today_list} empty="Belum ada pengiriman hari ini.">
                                        {w.produksi.pengiriman_today_list.map((p) => (
                                            <Row key={p.id} title={p.produk} sub={`${p.armada} · ${p.tujuan ?? '-'}`} badge={p.status ? <Pill tone="netral">{p.status}</Pill> : null} />
                                        ))}
                                    </List>
                                </Panel>
                            </div>
                        </TabsContent>
                    )}

                    {/* ── SDM ── */}
                    {ins.sdm && (
                        <TabsContent value="sdm" className="space-y-4">
                            <TabHeading meta={TAB_META.sdm} />
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <Tile icon={Users} label="Kehadiran hari ini" value={ins.sdm.hadir_persen != null ? `${ins.sdm.hadir_persen}%` : '-'}
                                    progress={ins.sdm.hadir_persen}
                                    hint={`${ins.sdm.presensi_hari_ini} presensi dari ${ins.sdm.karyawan_aktif} karyawan aktif`} />
                                <Tile icon={MapPin} label="Presensi di luar radius" value={ins.sdm.presensi_luar_radius} tone={ins.sdm.presensi_luar_radius > 0 ? 'kuning' : 'sehat'} hint="Menunggu validasi mandor" />
                                <Tile icon={CalendarClock} label="Cuti menunggu persetujuan" value={ins.sdm.cuti_pending} tone={ins.sdm.cuti_pending > 0 ? 'kuning' : 'sehat'} hint="Pengajuan yang belum diputuskan" />
                                <Tile icon={Wallet} label="Payroll bulan ini" value={s.payroll_periode ?? 0} hint="Periode gaji tercatat" />
                            </div>
                            <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                Kehadiran dihitung dari jumlah presensi masuk hari ini dibagi karyawan aktif, sehingga karyawan yang memang tidak dijadwalkan ikut masuk pembagi.
                            </p>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
