import React from "react";

const STATUS_META = {
    valid: { label: "Valid", classes: "bg-green-200 text-green-800" },
    tidak_valid: { label: "Tidak Valid", classes: "bg-red-200 text-red-800" },
    luar_radius: { label: "Luar Radius", classes: "bg-yellow-200 text-yellow-800" },
};

/**
 * Badge status validasi presensi — dipakai di Index, RekapDetail, dan Show
 * supaya warna & label selalu konsisten di satu tempat (sebelumnya fungsi
 * `getStatusBadge` diduplikasi identik di 3 file berbeda).
 *
 * `status` boleh null/undefined (mis. presensi yang belum direview) — tetap
 * menampilkan pill abu-abu dengan label yang jelas, bukan pill kosong tanpa
 * teks seperti sebelumnya.
 */
export default function StatusBadge({ status, className = "" }) {
    const meta = STATUS_META[status];

    return (
        <span
            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                meta ? meta.classes : "bg-gray-200 text-gray-600"
            } ${className}`}
        >
            {meta ? meta.label : status ? status.replace(/_/g, " ") : "Belum direview"}
        </span>
    );
}
