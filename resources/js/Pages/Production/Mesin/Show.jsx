import React, { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Wrench,
    Fuel,
    Clock,
    Factory,
    X,
    Plus,
    FileCheck,
    Edit,
} from "lucide-react";
import { formatTanggal, formatTanggalWaktu } from "@/utils/date";

const TABS = [
    { key: "info", label: "Informasi" },
    { key: "service", label: "Riwayat Servis" },
    { key: "checklist", label: "Checklist Harian" },
    { key: "bbm", label: "Log BBM" },
    { key: "downtime", label: "Downtime" },
    { key: "sessions", label: "Sesi Produksi" },
];

const STATUS_BADGE = {
    aktif: "bg-emerald-200 text-emerald-800",
    servis: "bg-yellow-200 text-yellow-800",
    nonaktif: "bg-red-200 text-red-800",
};

const SESSION_STATUS_BADGE = {
    berjalan: "bg-blue-50 text-blue-700",
    selesai: "bg-emerald-50 text-emerald-700",
    dibatalkan: "bg-gray-100 text-gray-600",
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "block text-sm font-medium text-gray-700";
const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50";

function todayStr() {
    const date = new Date();
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
    );
    return localDate.toISOString().slice(0, 10);
}

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

export default function Show({ mesin }) {
    const [activeTab, setActiveTab] = useState("info");
    const [activeModal, setActiveModal] = useState(null);
    const { delete: destroy } = useForm();

    const serviceForm = useForm({
        tanggal: todayStr(),
        jenis_servis: "",
        biaya: "0",
        notes: "",
    });

    const checklistForm = useForm({
        tanggal: todayStr(),
        kondisi_baik: true,
        item_bermasalah: "",
    });

    const bbmForm = useForm({
        tanggal: todayStr(),
        liter: "",
        biaya: "0",
    });

    const downtimeForm = useForm({
        mulai: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16),
        penyebab: "",
        kategori: "kerusakan_mesin",
        catatan: "",
    });

    const closeModal = () => {
        setActiveModal(null);
    };

    const handleDelete = () => {
        if (
            confirm(
                `Hapus mesin "${mesin.nama}"? Tindakan ini tidak dapat dibatalkan.`,
            )
        ) {
            destroy(route("production.mesin.destroy", mesin.id));
        }
    };

    const submitDowntime = (event) => {
        event.preventDefault();

        downtimeForm.transform((data) => ({
            ...data,
            mulai: data.mulai ? `${data.mulai.replace("T", " ")}:00` : "",
            penyebab: data.penyebab.trim(),
            catatan: data.catatan.trim(),
        }));

        downtimeForm.post(route("production.mesin.start-downtime", mesin.id), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                downtimeForm.reset();
                downtimeForm.setData({
                    mulai: new Date(
                        Date.now() - new Date().getTimezoneOffset() * 60000,
                    )
                        .toISOString()
                        .slice(0, 16),
                    penyebab: "",
                    kategori: "kerusakan_mesin",
                    catatan: "",
                });
            },
        });
    };

    const handleEndDowntime = (downtimeId) => {
        const selesai = prompt(
            "Waktu selesai (YYYY-MM-DD HH:mm:ss):",
            new Date().toISOString().slice(0, 19).replace("T", " "),
        );
        if (!selesai) return;

        router.post(
            route("production.mesin.end-downtime", {
                mesin: mesin.id,
                downtime: downtimeId,
            }),
            { selesai },
        );
    };

    const submitService = (event) => {
        event.preventDefault();
        serviceForm.post(route("production.mesin.record-service", mesin.id), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                serviceForm.reset();
                serviceForm.setData({
                    tanggal: todayStr(),
                    jenis_servis: "",
                    biaya: "0",
                    notes: "",
                });
            },
        });
    };

    const submitChecklist = (event) => {
        event.preventDefault();
        checklistForm.post(
            route("production.mesin.record-checklist", mesin.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    checklistForm.reset();
                    checklistForm.setData({
                        tanggal: todayStr(),
                        kondisi_baik: true,
                        item_bermasalah: "",
                    });
                },
            },
        );
    };

    const submitBbm = (event) => {
        event.preventDefault();
        bbmForm.post(route("production.mesin.record-bbm", mesin.id), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                bbmForm.reset();
                bbmForm.setData({
                    tanggal: todayStr(),
                    liter: "",
                    biaya: "0",
                });
            },
        });
    };

    const totalBbm = (mesin.bbm_logs || []).reduce(
        (total, item) => total + (Number(item.liter) || 0),
        0,
    );

    return (
        <Layout>
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                                    {mesin.nama}
                                </h1>
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                        STATUS_BADGE[mesin.status] ||
                                        STATUS_BADGE.nonaktif
                                    }`}
                                >
                                    {(mesin.status || "nonaktif").toUpperCase()}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                {mesin.jenis?.replace("_", " ").toUpperCase() ||
                                    "JENIS MESIN -"}
                                <span className="mx-2 text-gray-300">•</span>
                                {mesin.unit_bisnis?.nama || "Unit bisnis -"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Link
                            href={route("production.mesin.index")}
                            aria-label="Kembali ke daftar mesin"
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Kembali
                        </Link>
                        {mesin.status === "aktif" && (
                            <button
                                type="button"
                                onClick={() => setActiveModal("downtime")}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3.5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-600 hover:text-white"
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Start Downtime
                            </button>
                        )}
                        <Link
                            href={route("production.mesin.edit", mesin.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={<Wrench className="h-5 w-5 text-blue-600" />}
                        label="Total Servis"
                        value={mesin.service_histories?.length || 0}
                        unit="kali"
                        bg="bg-blue-50"
                    />
                    <StatCard
                        icon={<Fuel className="h-5 w-5 text-amber-600" />}
                        label="Total BBM"
                        value={totalBbm.toLocaleString("id-ID", {
                            maximumFractionDigits: 1,
                        })}
                        unit="liter"
                        bg="bg-amber-50"
                    />
                    <StatCard
                        icon={<Clock className="h-5 w-5 text-red-600" />}
                        label="Total Downtime"
                        value={mesin.downtimes?.length || 0}
                        unit="kejadian"
                        bg="bg-red-50"
                    />
                    <StatCard
                        icon={<Factory className="h-5 w-5 text-emerald-600" />}
                        label="Sesi Produksi"
                        value={mesin.production_sessions?.length || 0}
                        unit="sesi"
                        bg="bg-emerald-50"
                    />
                </section>

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto border-b border-gray-200">
                        <nav className="flex min-w-max gap-1 px-3 pt-2 sm:px-5">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                                        activeTab === tab.key
                                            ? "border-blue-600 text-blue-700"
                                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-4 sm:p-6">
                        {activeTab === "info" && (
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                <section>
                                    <SectionHeading>
                                        Detail Mesin
                                    </SectionHeading>
                                    <dl className="divide-y divide-gray-100">
                                        <DField
                                            label="Nama"
                                            value={mesin.nama}
                                        />
                                        <DField
                                            label="Jenis"
                                            value={mesin.jenis?.replace(
                                                "_",
                                                " ",
                                            )}
                                        />
                                        <DField
                                            label="Status"
                                            value={
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                                        STATUS_BADGE[
                                                            mesin.status
                                                        ] ||
                                                        STATUS_BADGE.nonaktif
                                                    }`}
                                                >
                                                    {(
                                                        mesin.status ||
                                                        "nonaktif"
                                                    ).toUpperCase()}
                                                </span>
                                            }
                                        />
                                        <DField
                                            label="Kapasitas"
                                            value={mesin.kapasitas || "-"}
                                        />
                                        <DField
                                            label="Biaya Per Jam"
                                            value={formatRupiah(
                                                mesin.biaya_per_jam,
                                            )}
                                        />
                                    </dl>
                                </section>
                                <section>
                                    <SectionHeading>
                                        Penempatan &amp; Output
                                    </SectionHeading>
                                    <dl className="divide-y divide-gray-100">
                                        <DField
                                            label="Unit Bisnis"
                                            value={
                                                mesin.unit_bisnis?.nama || "-"
                                            }
                                        />
                                        <DField
                                            label="Titik Lokasi"
                                            value={mesin.titik?.nama || "-"}
                                        />
                                        <DField
                                            label="Produk Output Default"
                                            value={
                                                mesin.produk_default?.nama ||
                                                "-"
                                            }
                                        />
                                    </dl>
                                </section>
                            </div>
                        )}

                        {activeTab === "service" && (
                            <TabSection
                                title="Riwayat Servis"
                                subtitle="Daftar pencatatan servis mesin."
                                actionLabel="Catat Servis"
                                actionIcon={<Plus className="h-4 w-4" />}
                                onAction={() => setActiveModal("service")}
                            >
                                <DataTable
                                    columns={[
                                        "Tanggal",
                                        "Jenis Servis",
                                        "Biaya",
                                        "Catatan",
                                    ]}
                                    rows={mesin.service_histories || []}
                                    emptyText="Belum ada riwayat servis."
                                    renderRow={(item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <Td>
                                                {formatTanggal(item.tanggal)}
                                            </Td>
                                            <Td className="font-medium text-gray-900">
                                                {item.jenis_servis}
                                            </Td>
                                            <Td>{formatRupiah(item.biaya)}</Td>
                                            <Td className="text-gray-500">
                                                {item.notes || "-"}
                                            </Td>
                                        </tr>
                                    )}
                                />
                            </TabSection>
                        )}

                        {activeTab === "checklist" && (
                            <TabSection
                                title="Checklist Harian"
                                subtitle="Riwayat pemeriksaan kondisi mesin."
                                actionLabel="Catat Checklist"
                                actionIcon={<Plus className="h-4 w-4" />}
                                onAction={() => setActiveModal("checklist")}
                            >
                                <DataTable
                                    columns={[
                                        "Tanggal",
                                        "Kondisi",
                                        "Item Bermasalah",
                                    ]}
                                    rows={mesin.checklists || []}
                                    emptyText="Belum ada data checklist."
                                    renderRow={(item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <Td>
                                                {formatTanggal(item.tanggal)}
                                            </Td>
                                            <Td>
                                                {item.kondisi_baik ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        BAIK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        BERMASALAH
                                                    </span>
                                                )}
                                            </Td>
                                            <Td className="text-gray-500">
                                                {item.item_bermasalah || "-"}
                                            </Td>
                                        </tr>
                                    )}
                                />
                            </TabSection>
                        )}

                        {activeTab === "bbm" && (
                            <TabSection
                                title="Log BBM"
                                subtitle="Riwayat pengisian bahan bakar mesin."
                                actionLabel="Catat BBM"
                                actionIcon={<Plus className="h-4 w-4" />}
                                onAction={() => setActiveModal("bbm")}
                            >
                                <DataTable
                                    columns={[
                                        "Tanggal",
                                        "Liter",
                                        "Total Biaya",
                                        "Harga/Liter",
                                    ]}
                                    rows={mesin.bbm_logs || []}
                                    emptyText="Belum ada log BBM."
                                    renderRow={(item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <Td>
                                                {formatTanggal(item.tanggal)}
                                            </Td>
                                            <Td className="font-medium text-gray-900">
                                                {Number(
                                                    item.liter || 0,
                                                ).toLocaleString("id-ID")}{" "}
                                                L
                                            </Td>
                                            <Td>{formatRupiah(item.biaya)}</Td>
                                            <Td className="text-gray-500">
                                                {Number(item.liter) > 0
                                                    ? `${formatRupiah(
                                                          Number(item.biaya) /
                                                              Number(
                                                                  item.liter,
                                                              ),
                                                      )}/L`
                                                    : "-"}
                                            </Td>
                                        </tr>
                                    )}
                                />
                            </TabSection>
                        )}

                        {activeTab === "downtime" && (
                            <TabSection
                                title="Riwayat Downtime"
                                subtitle="Waktu berhenti dan penyebab gangguan mesin."
                            >
                                <DataTable
                                    columns={[
                                        "Mulai",
                                        "Selesai",
                                        "Durasi",
                                        "Kategori",
                                        "Penyebab",
                                        "Aksi",
                                    ]}
                                    rows={mesin.downtimes || []}
                                    emptyText="Belum ada riwayat downtime."
                                    renderRow={(item) => {
                                        const mulai = new Date(item.mulai);
                                        const selesai = item.selesai
                                            ? new Date(item.selesai)
                                            : null;
                                        const durasi = selesai
                                            ? Math.round(
                                                  (selesai - mulai) / 60000,
                                              )
                                            : null;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-gray-50"
                                            >
                                                <Td>
                                                    {formatTanggalWaktu(
                                                        item.mulai,
                                                    )}
                                                </Td>
                                                <Td>
                                                    {item.selesai ? (
                                                        formatTanggalWaktu(
                                                            item.selesai,
                                                        )
                                                    ) : (
                                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                                            Sedang Berlangsung
                                                        </span>
                                                    )}
                                                </Td>
                                                <Td>
                                                    {durasi !== null
                                                        ? `${durasi} menit`
                                                        : "-"}
                                                </Td>
                                                <Td>
                                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                        {item.kategori?.replace(
                                                            "_",
                                                            " ",
                                                        ) || "-"}
                                                    </span>
                                                </Td>
                                                <Td className="text-gray-600">
                                                    {item.penyebab || "-"}
                                                </Td>
                                                <Td>
                                                    {!item.selesai && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEndDowntime(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                        >
                                                            Selesaikan
                                                        </button>
                                                    )}
                                                </Td>
                                            </tr>
                                        );
                                    }}
                                />
                            </TabSection>
                        )}

                        {activeTab === "sessions" && (
                            <TabSection
                                title="Sesi Produksi"
                                subtitle="Daftar sesi operasional mesin."
                            >
                                <DataTable
                                    columns={[
                                        "Mulai",
                                        "Selesai",
                                        "Produk",
                                        "Output",
                                        "Status",
                                        "Aksi",
                                    ]}
                                    rows={mesin.production_sessions || []}
                                    emptyText="Belum ada sesi produksi."
                                    renderRow={(item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <Td>
                                                {formatTanggalWaktu(item.mulai)}
                                            </Td>
                                            <Td>
                                                {item.selesai ? (
                                                    formatTanggalWaktu(
                                                        item.selesai,
                                                    )
                                                ) : (
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                        Berjalan
                                                    </span>
                                                )}
                                            </Td>
                                            <Td className="font-medium text-gray-900">
                                                {item.produk?.nama || "-"}
                                            </Td>
                                            <Td>
                                                {item.hasil_output
                                                    ? `${item.hasil_output} ${
                                                          item.produk
                                                              ?.satuan_output ||
                                                          ""
                                                      }`
                                                    : "-"}
                                            </Td>
                                            <Td>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        SESSION_STATUS_BADGE[
                                                            item.status
                                                        ] ||
                                                        SESSION_STATUS_BADGE.dibatalkan
                                                    }`}
                                                >
                                                    {(
                                                        item.status || "-"
                                                    ).toUpperCase()}
                                                </span>
                                            </Td>
                                            <Td>
                                                <Link
                                                    href={route(
                                                        "production.sessions.show",
                                                        item.id,
                                                    )}
                                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    Detail
                                                </Link>
                                            </Td>
                                        </tr>
                                    )}
                                />
                            </TabSection>
                        )}
                    </div>
                </section>
            </div>

            {activeModal === "downtime" && (
                <Modal
                    title="Start Downtime"
                    description="Catat waktu berhenti dan penyebab gangguan mesin."
                    icon={<AlertTriangle className="h-5 w-5" />}
                    onClose={closeModal}
                >
                    <form onSubmit={submitDowntime} className="space-y-4">
                        <FormField label="Waktu Mulai" required>
                            <input
                                type="datetime-local"
                                required
                                value={downtimeForm.data.mulai}
                                onChange={(event) =>
                                    downtimeForm.setData(
                                        "mulai",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={downtimeForm.errors.mulai} />
                        </FormField>
                        <FormField label="Penyebab Downtime" required>
                            <textarea
                                rows={3}
                                required
                                maxLength={2000}
                                placeholder="Jelaskan penyebab mesin berhenti..."
                                value={downtimeForm.data.penyebab}
                                onChange={(event) =>
                                    downtimeForm.setData(
                                        "penyebab",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={downtimeForm.errors.penyebab} />
                        </FormField>
                        <FormField label="Catatan Tambahan">
                            <textarea
                                rows={2}
                                maxLength={2000}
                                placeholder="Catatan tambahan (opsional)..."
                                value={downtimeForm.data.catatan}
                                onChange={(event) =>
                                    downtimeForm.setData(
                                        "catatan",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={downtimeForm.errors.catatan} />
                        </FormField>
                        <ModalActions
                            onCancel={closeModal}
                            processing={downtimeForm.processing}
                            submitLabel="Mulai Downtime"
                        />
                    </form>
                </Modal>
            )}

            {activeModal === "service" && (
                <Modal
                    title="Catat Servis"
                    description="Masukkan informasi servis yang dilakukan pada mesin ini."
                    icon={<Wrench className="h-5 w-5" />}
                    onClose={closeModal}
                >
                    <form onSubmit={submitService} className="space-y-4">
                        <FormField label="Tanggal Servis" required>
                            <input
                                type="date"
                                required
                                value={serviceForm.data.tanggal}
                                onChange={(event) =>
                                    serviceForm.setData(
                                        "tanggal",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={serviceForm.errors.tanggal} />
                        </FormField>
                        <FormField label="Jenis Servis" required>
                            <input
                                type="text"
                                required
                                maxLength={255}
                                placeholder="Contoh: Ganti oli, perbaikan mesin"
                                value={serviceForm.data.jenis_servis}
                                onChange={(event) =>
                                    serviceForm.setData(
                                        "jenis_servis",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError
                                message={serviceForm.errors.jenis_servis}
                            />
                        </FormField>
                        <FormField label="Biaya Servis (Rp)" required>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                required
                                value={serviceForm.data.biaya}
                                onChange={(event) =>
                                    serviceForm.setData(
                                        "biaya",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={serviceForm.errors.biaya} />
                        </FormField>
                        <FormField label="Catatan">
                            <textarea
                                rows={3}
                                maxLength={2000}
                                placeholder="Tambahkan catatan jika diperlukan..."
                                value={serviceForm.data.notes}
                                onChange={(event) =>
                                    serviceForm.setData(
                                        "notes",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={serviceForm.errors.notes} />
                        </FormField>
                        <ModalActions
                            onCancel={closeModal}
                            processing={serviceForm.processing}
                        />
                    </form>
                </Modal>
            )}

            {activeModal === "checklist" && (
                <Modal
                    title="Catat Checklist"
                    description="Periksa dan catat kondisi mesin."
                    icon={<FileCheck className="h-5 w-5" />}
                    onClose={closeModal}
                >
                    <form onSubmit={submitChecklist} className="space-y-4">
                        <FormField label="Tanggal Pemeriksaan" required>
                            <input
                                type="date"
                                required
                                value={checklistForm.data.tanggal}
                                onChange={(event) =>
                                    checklistForm.setData(
                                        "tanggal",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={checklistForm.errors.tanggal} />
                        </FormField>
                        <FormField label="Kondisi Mesin" required>
                            <div className="grid grid-cols-2 gap-3">
                                <label
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium transition ${
                                        checklistForm.data.kondisi_baik
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="kondisi_baik"
                                        checked={
                                            checklistForm.data.kondisi_baik ===
                                            true
                                        }
                                        onChange={() => {
                                            checklistForm.setData(
                                                "kondisi_baik",
                                                true,
                                            );
                                            checklistForm.setData(
                                                "item_bermasalah",
                                                "",
                                            );
                                        }}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <CheckCircle2 className="h-4 w-4" />
                                    Kondisi Baik
                                </label>
                                <label
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium transition ${
                                        !checklistForm.data.kondisi_baik
                                            ? "border-red-300 bg-red-50 text-red-700"
                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="kondisi_baik"
                                        checked={
                                            checklistForm.data.kondisi_baik ===
                                            false
                                        }
                                        onChange={() =>
                                            checklistForm.setData(
                                                "kondisi_baik",
                                                false,
                                            )
                                        }
                                        className="text-red-600 focus:ring-red-500"
                                    />
                                    <AlertTriangle className="h-4 w-4" />
                                    Bermasalah
                                </label>
                            </div>
                            <FormError
                                message={checklistForm.errors.kondisi_baik}
                            />
                        </FormField>
                        {!checklistForm.data.kondisi_baik && (
                            <FormField label="Item Bermasalah" required>
                                <textarea
                                    rows={3}
                                    required
                                    maxLength={2000}
                                    placeholder="Jelaskan bagian atau komponen yang bermasalah..."
                                    value={checklistForm.data.item_bermasalah}
                                    onChange={(event) =>
                                        checklistForm.setData(
                                            "item_bermasalah",
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                <FormError
                                    message={
                                        checklistForm.errors.item_bermasalah
                                    }
                                />
                            </FormField>
                        )}
                        <ModalActions
                            onCancel={closeModal}
                            processing={checklistForm.processing}
                        />
                    </form>
                </Modal>
            )}

            {activeModal === "bbm" && (
                <Modal
                    title="Catat BBM"
                    description="Masukkan jumlah dan biaya bahan bakar yang digunakan."
                    icon={<Fuel className="h-5 w-5" />}
                    onClose={closeModal}
                >
                    <form onSubmit={submitBbm} className="space-y-4">
                        <FormField label="Tanggal Pengisian" required>
                            <input
                                type="date"
                                required
                                value={bbmForm.data.tanggal}
                                onChange={(event) =>
                                    bbmForm.setData(
                                        "tanggal",
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                            <FormError message={bbmForm.errors.tanggal} />
                        </FormField>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label="Jumlah BBM (Liter)" required>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    placeholder="Contoh: 20"
                                    value={bbmForm.data.liter}
                                    onChange={(event) =>
                                        bbmForm.setData(
                                            "liter",
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                <FormError message={bbmForm.errors.liter} />
                            </FormField>
                            <FormField label="Total Biaya (Rp)" required>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={bbmForm.data.biaya}
                                    onChange={(event) =>
                                        bbmForm.setData(
                                            "biaya",
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                <FormError message={bbmForm.errors.biaya} />
                            </FormField>
                        </div>
                        <ModalActions
                            onCancel={closeModal}
                            processing={bbmForm.processing}
                        />
                    </form>
                </Modal>
            )}
        </Layout>
    );
}

function StatCard({ icon, label, value, unit, bg }) {
    return (
        <div className={`${bg} rounded-2xl border border-gray-100 p-4 sm:p-5`}>
            <div className="mb-3 flex items-center justify-between gap-2.5">
                <span className="text-sm font-medium text-gray-600">
                    {label}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    {icon}
                </span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
                {value}{" "}
                <span className="text-sm font-normal text-gray-500">
                    {unit}
                </span>
            </p>
        </div>
    );
}

function SectionHeading({ children }) {
    return (
        <h3 className="mb-3 border-b border-gray-100 pb-3 text-base font-semibold text-gray-800">
            {children}
        </h3>
    );
}

function DField({ label, value }) {
    return (
        <div className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
            <dt className="w-full shrink-0 text-sm text-gray-500 sm:w-44">
                {label}
            </dt>
            <dd className="min-w-0 text-sm font-medium text-gray-800">
                {value ?? "-"}
            </dd>
        </div>
    );
}

function Td({ children, className = "" }) {
    return (
        <td
            className={`whitespace-nowrap px-4 py-3.5 text-sm text-gray-700 ${className}`}
        >
            {children}
        </td>
    );
}

function TabSection({
    title,
    subtitle,
    actionLabel,
    actionIcon,
    onAction,
    children,
}) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                    )}
                </div>
                {actionLabel && (
                    <button
                        type="button"
                        onClick={onAction}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        {actionIcon}
                        {actionLabel}
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}

function DataTable({ columns, rows, emptyText, renderRow }) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column}
                                    scope="col"
                                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-12 text-center"
                                >
                                    <div className="mx-auto flex max-w-sm flex-col items-center">
                                        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                            <FileCheck className="h-5 w-5" />
                                        </span>
                                        <p className="text-sm font-medium text-gray-700">
                                            {emptyText}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map(renderRow)
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FormField({ label, required = false, children }) {
    return (
        <div>
            <label className={labelClass}>
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function FormError({ message }) {
    if (!message) return null;

    return <p className="mt-1.5 text-sm text-red-600">{message}</p>;
}

function Modal({ title, description, icon, onClose, children }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") onClose();
            }}
            role="presentation"
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="entry-modal-title"
                className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            {icon}
                        </span>
                        <div>
                            <h2
                                id="entry-modal-title"
                                className="text-lg font-semibold text-gray-900"
                            >
                                {title}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {description}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup modal"
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-5 py-5 sm:px-6">
                    {children}
                </div>
            </section>
        </div>
    );
}

function ModalActions({ onCancel, processing, submitLabel = "Simpan Data" }) {
    return (
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
                type="button"
                onClick={onCancel}
                disabled={processing}
                className={secondaryButtonClass}
            >
                Batal
            </button>
            <button
                type="submit"
                disabled={processing}
                className={primaryButtonClass}
            >
                {processing ? "Menyimpan..." : submitLabel}
            </button>
        </div>
    );
}
