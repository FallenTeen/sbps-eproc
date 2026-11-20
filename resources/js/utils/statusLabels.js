const STATUS_LABELS = {
    aktif: 'Aktif',
    berjalan: 'Sedang berlangsung',
    dalam_perjalanan: 'Sedang dikirim',
    diajukan: 'Menunggu persetujuan',
    ditolak: 'Ditolak',
    disetujui: 'Disetujui',
    selesai: 'Selesai',
    menunggu: 'Menunggu tindak lanjut',
    menunggu_approval_finance: 'Menunggu persetujuan Keuangan',
    menunggu_approval_owner: 'Menunggu persetujuan Owner',
    nonaktif: 'Tidak aktif',
    pending: 'Menunggu tindak lanjut',
    servis: 'Dalam perbaikan',
};

export function formatStatusLabel(status) {
    if (!status) return 'Belum ada status';

    const normalized = String(status).toLowerCase();
    if (STATUS_LABELS[normalized]) return STATUS_LABELS[normalized];

    return normalized
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
