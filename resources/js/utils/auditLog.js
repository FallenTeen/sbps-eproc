const ACTION_LABELS = {
    created: 'Data dibuat',
    updated: 'Data diubah',
    deleted: 'Data dihapus',
    restored: 'Data dipulihkan',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
};

const SUBJECT_LABELS = {
    AkunKasBank: 'Akun kas dan bank',
    Armada: 'Kendaraan',
    BbmLog: 'Catatan pengisian BBM',
    Cuti: 'Pengajuan cuti',
    DowntimeLog: 'Catatan kendaraan tidak beroperasi',
    GajiPeriode: 'Periode penggajian',
    Invoice: 'Invoice',
    Karyawan: 'Karyawan',
    Pengiriman: 'Pengiriman',
    Proyek: 'Proyek',
    PurchaseOrder: 'Pesanan pembelian',
    QCSample: 'Sampel pemeriksaan mutu',
    Ritase: 'Catatan perjalanan',
    Titik: 'Lokasi kerja',
    User: 'Pengguna',
};

const FIELD_LABELS = {
    alasan: 'Alasan',
    catatan: 'Catatan',
    client: 'Klien',
    created_at: 'Waktu dibuat',
    email: 'Alamat email',
    harga: 'Harga',
    jumlah: 'Jumlah',
    lokasi: 'Lokasi',
    nama: 'Nama',
    nama_lengkap: 'Nama lengkap',
    penyebab: 'Penyebab',
    status: 'Status',
    tanggal: 'Tanggal',
    updated_at: 'Terakhir diubah',
};

const STATUS_LABELS = {
    aktif: 'Aktif',
    draft: 'Draf',
    berjalan: 'Sedang berlangsung',
    dalam_perjalanan: 'Sedang dikirim',
    diajukan: 'Menunggu persetujuan',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
    selesai: 'Selesai',
    menunggu: 'Menunggu tindak lanjut',
    menunggu_approval_finance: 'Menunggu persetujuan Keuangan',
    menunggu_approval_owner: 'Menunggu persetujuan Owner',
    nonaktif: 'Tidak aktif',
    pending: 'Menunggu tindak lanjut',
    servis: 'Dalam perbaikan',
};

const TECHNICAL_PROPERTY_KEYS = new Set([
    'attributes',
    'attribute_changes',
    'ip',
    'old',
    'user_agent',
]);

function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value) {
    return isRecord(value) ? value : {};
}

function humanize(value) {
    return String(value)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getAuditActionLabel(action) {
    if (!action) return 'Aktivitas';

    const normalized = String(action).toLowerCase();
    return ACTION_LABELS[normalized] || humanize(normalized);
}

export function getAuditSubjectLabel(subjectType) {
    if (!subjectType) return 'Data umum';

    const className = String(subjectType).split('\\').pop();
    return SUBJECT_LABELS[className] || humanize(className);
}

export function getAuditFieldLabel(field) {
    if (!field) return 'Informasi';

    const normalized = String(field);
    return FIELD_LABELS[normalized] || humanize(normalized);
}

export function formatAuditValue(value, field) {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';

    if (field === 'status') {
        const normalized = String(value).toLowerCase();
        return STATUS_LABELS[normalized] || humanize(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => formatAuditValue(item)).join(', ') || '—';
    }

    if (isRecord(value)) {
        return Object.entries(value)
            .map(([key, item]) => `${getAuditFieldLabel(key)}: ${formatAuditValue(item, key)}`)
            .join('; ');
    }

    return String(value);
}

export function getAuditChanges(log) {
    const properties = asRecord(log?.properties);
    const attributeChanges = asRecord(log?.attribute_changes);
    const before = asRecord(properties.old ?? attributeChanges.old);
    const after = asRecord(properties.attributes ?? attributeChanges.attributes);
    const fields = new Set([...Object.keys(before), ...Object.keys(after)]);

    return [...fields]
        .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
        .map((field) => ({
            field,
            label: getAuditFieldLabel(field),
            before: Object.prototype.hasOwnProperty.call(before, field) ? before[field] : null,
            after: Object.prototype.hasOwnProperty.call(after, field) ? after[field] : null,
        }));
}

export function getAuditAdditionalDetails(log) {
    const properties = asRecord(log?.properties);

    return Object.entries(properties)
        .filter(([key]) => !TECHNICAL_PROPERTY_KEYS.has(key))
        .map(([field, value]) => ({
            field,
            label: getAuditFieldLabel(field),
            value: formatAuditValue(value, field),
        }));
}
