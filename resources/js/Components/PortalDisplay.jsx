import {
    Shield,
    Truck,
    Factory,
    Wallet,
    Users,
    ClipboardList,
} from 'lucide-react';

/**
 * Satu-satunya tempat untuk ikon, warna, dan nama tampilan portal.
 * Dipakai oleh Index, Login, dan Select.
 *
 * - Slug, route, dan role tetap berasal dari backend (config/portals.php).
 * - Semua class Tailwind ditulis literal agar terdeteksi saat build.
 */

export const iconMap = {
    Shield,
    Truck,
    Factory,
    Wallet,
    Users,
    ClipboardList,
};

export const colorStyles = {
    red: {
        solid: 'bg-red-600',
        solidDark: 'bg-red-700',
        text: 'text-red-700',
        border: 'border-red-600',
        soft: 'bg-red-50',
        hoverSoft: 'hover:bg-red-50',
        button: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
        ring: 'ring-red-600',
        link: 'text-red-700 hover:text-red-800',
    },
    blue: {
        solid: 'bg-blue-600',
        solidDark: 'bg-blue-700',
        text: 'text-blue-700',
        border: 'border-blue-600',
        soft: 'bg-blue-50',
        hoverSoft: 'hover:bg-blue-50',
        button: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
        ring: 'ring-blue-600',
        link: 'text-blue-700 hover:text-blue-800',
    },
    green: {
        solid: 'bg-green-600',
        solidDark: 'bg-green-700',
        text: 'text-green-700',
        border: 'border-green-600',
        soft: 'bg-green-50',
        hoverSoft: 'hover:bg-green-50',
        button: 'bg-green-700 hover:bg-green-800 active:bg-green-900',
        ring: 'ring-green-600',
        link: 'text-green-700 hover:text-green-800',
    },
    amber: {
        solid: 'bg-amber-500',
        solidDark: 'bg-amber-600',
        text: 'text-amber-800',
        border: 'border-amber-500',
        soft: 'bg-amber-50',
        hoverSoft: 'hover:bg-amber-50',
        button: 'bg-amber-500 text-black hover:bg-amber-600 active:bg-amber-700',
        ring: 'ring-amber-500',
        link: 'text-amber-800 hover:text-amber-900',
    },
    purple: {
        solid: 'bg-purple-600',
        solidDark: 'bg-purple-700',
        text: 'text-purple-700',
        border: 'border-purple-600',
        soft: 'bg-purple-50',
        hoverSoft: 'hover:bg-purple-50',
        button: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800',
        ring: 'ring-purple-600',
        link: 'text-purple-700 hover:text-purple-800',
    },
    teal: {
        solid: 'bg-teal-600',
        solidDark: 'bg-teal-700',
        text: 'text-teal-700',
        border: 'border-teal-600',
        soft: 'bg-teal-50',
        hoverSoft: 'hover:bg-teal-50',
        button: 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900',
        ring: 'ring-teal-600',
        link: 'text-teal-700 hover:text-teal-800',
    },
};

/**
 * Nama tampilan, nomor, dan kelompok per slug.
 * Hanya mempengaruhi teks di layar, bukan slug/role/route.
 */
const displayBySlug = {
    admin: {
        number: '01',
        group: 'internal',
        title: 'Administrasi & Operasional',
        summary:
            'Pengelolaan pengguna, pengadaan barang, persediaan gudang, logistik, workshop, dan keamanan perusahaan.',
    },
    armada: {
        number: '02',
        group: 'internal',
        title: 'Armada & Kendaraan',
        summary:
            'Pengelolaan kendaraan perusahaan, kegiatan ritase, BBM, sewa alat, dokumen kendaraan, dan perawatan armada.',
    },
    produksi: {
        number: '03',
        group: 'internal',
        title: 'Proyek & Produksi',
        summary:
            'Pengelolaan proyek, RAB, kegiatan produksi CBP/AMP, pengiriman, pemeriksaan kualitas, dan progres pekerjaan.',
    },
    keuangan: {
        number: '04',
        group: 'internal',
        title: 'Keuangan',
        summary:
            'Pengelolaan keuangan perusahaan, kas, bank, invoice, piutang, pembayaran, dan persetujuan pengadaan.',
    },
    sdm: {
        number: '05',
        group: 'internal',
        title: 'SDM & Karyawan',
        summary:
            'Pengelolaan data karyawan, presensi, cuti, penggajian, dan administrasi sumber daya manusia.',
    },
    kontraktor: {
        number: '06',
        group: 'external',
        title: 'Kontraktor / Mitra Proyek',
        summary:
            'Akses khusus mitra proyek untuk melihat proyek yang ditugaskan, perkembangan pekerjaan, komunikasi, dan invoice miliknya.',
    },
};

export const groups = [
    {
        key: 'internal',
        number: '1',
        title: 'Portal Internal',
        caption: 'Untuk karyawan, pengelola, koordinator, dan pimpinan perusahaan.',
    },
    {
        key: 'external',
        number: '2',
        title: 'Mitra Eksternal',
        caption: 'Khusus pengguna di luar pengelola internal perusahaan.',
    },
];

/** Gabungkan data backend dengan tampilan. Slug tak dikenal tetap aman. */
export function getPortalView(portal) {
    const d = displayBySlug[portal.slug] || {};

    return {
        Icon: iconMap[portal.icon] || Shield,
        styles: colorStyles[portal.color] || colorStyles.red,
        number: d.number || '',
        group: d.group || 'internal',
        title: d.title || portal.name,
        summary: d.summary || portal.description,
    };
}

/** Normalisasi untuk pencarian: huruf kecil, spasi rapi. */
export const normalize = (s) =>
    String(s || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Cari jabatan pada daftar role yang dikirim backend.
 * Mengembalikan { slug: [role yang cocok] } untuk semua portal yang valid.
 */
export function searchRoles(portals, query) {
    const q = normalize(query);
    const result = {};

    if (!q) return result;

    portals.forEach((portal) => {
        const hits = (portal.roles || []).filter((r) => normalize(r).includes(q));
        if (hits.length) result[portal.slug] = hits;
    });

    return result;
}

/** Animasi masuk ringan. Otomatis mati jika pengguna memilih reduced motion. */
export function PortalMotionStyles() {
    return (
        <style>{`
            @keyframes portal-rise {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: none; }
            }
            .portal-rise { animation: portal-rise .4s ease-out both; }
            @media (prefers-reduced-motion: reduce) {
                .portal-rise { animation: none; }
            }
        `}</style>
    );
}

export const focusRing =
    'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-neutral-900';
