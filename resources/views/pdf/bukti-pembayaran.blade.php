<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bukti Pembayaran {{ $pembayaran->purchaseOrder->kode_po }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #222; }
        h2 { margin-bottom: 0; }
        .muted { color: #666; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table td, table th { padding: 6px 8px; text-align: left; vertical-align: top; }
        table th { width: 220px; color: #555; }
        .total-row td { border-top: 1px solid #333; font-weight: bold; padding-top: 10px; }
        .footer { margin-top: 60px; display: flex; justify-content: flex-end; }
        .signature { text-align: center; width: 220px; }
        .signature .line { margin-top: 60px; border-top: 1px solid #333; padding-top: 4px; }
    </style>
</head>
<body>
    <h2>Bukti Pembayaran</h2>
    <div class="muted">PO: {{ $pembayaran->purchaseOrder->kode_po }} — Supplier: {{ $pembayaran->purchaseOrder->supplier->nama ?? '-' }}</div>

    <table>
        <tr>
            <th>Tanggal Pembayaran</th>
            <td>{{ \Carbon\Carbon::parse($pembayaran->tanggal)->translatedFormat('d F Y') }}</td>
        </tr>
        <tr>
            <th>Proyek</th>
            <td>{{ $pembayaran->purchaseOrder->proyek->nama ?? '-' }}</td>
        </tr>
        <tr>
            <th>Metode Pembayaran</th>
            <td>{{ ucfirst($pembayaran->metode) }}</td>
        </tr>
        <tr>
            <th>Akun Kas/Bank</th>
            <td>{{ $pembayaran->akunKasBank->nama ?? '-' }}</td>
        </tr>
        <tr>
            <th>Dicatat Oleh</th>
            <td>{{ $pembayaran->dicatatOleh->name ?? '-' }}</td>
        </tr>
        <tr>
            <th>Catatan</th>
            <td>{{ $pembayaran->catatan ?? '-' }}</td>
        </tr>
        <tr class="total-row">
            <td>Jumlah Dibayar</td>
            <td>Rp {{ number_format($pembayaran->jumlah, 0, ',', '.') }}</td>
        </tr>
    </table>

    <div class="footer">
        <div class="signature">
            <div>Dicatat oleh,</div>
            <div class="line">{{ $pembayaran->dicatatOleh->name ?? '-' }}</div>
        </div>
    </div>
</body>
</html>
