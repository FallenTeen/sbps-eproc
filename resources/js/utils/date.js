export function formatTanggal(value, options = undefined) {
    if (value === null || value === undefined || value === '') return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('id-ID', options);
}

export function formatTanggalWaktu(value, options = undefined) {
    if (value === null || value === undefined || value === '') return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString('id-ID', options);
}
