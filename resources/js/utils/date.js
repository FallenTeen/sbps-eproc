export function formatTanggal(value, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
    if (value === null || value === undefined || value === '') return '-';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    
    return date.toLocaleDateString('id-ID', options);
}

export function formatTanggalWaktu(value, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
    if (value === null || value === undefined || value === '') return '-';

    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);

    const dateText = date.toLocaleDateString('id-ID', options);
    const timeParts = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);
    const hour = timeParts.find(part => part.type === 'hour').value;
    const minute = timeParts.find(part => part.type === 'minute').value;

    return `${dateText}, ${hour}:${minute}`;
}
