<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Checklist Serah Terima — {{ $sewa->armada->kode_unit }} / {{ \Carbon\Carbon::parse($sewa->tanggal)->translatedFormat('d F Y') }}</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #222; padding: 20px; }
        h1 { margin: 0 0 20px; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        .container { page-break-inside: avoid; }
        h2 { margin: 10px 0 15px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table th, table td { padding: 4px 6px; vertical-align: top; text-align: left; }
        table th { width: 40%; color: #555; font-weight: bold; border-bottom: 1px solid #ddd; }
        table td { border-bottom: 1px solid #eee; }
        .total-row { font-weight: bold; margin-top: 10px; }
        .signature { margin-top: 30px; text-align: center; }
        .signature .line { border-top: 1px solid #333; display: block; padding-top: 4px; margin: 10px 0; }
        .cols { display: flex; gap: 20px; }
        .col { flex: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Checklist Serah Terima — Sewa Alat Berat</h1>

        <div class="cols">
            <div class="col">
                <h2>Berangkat</h2>
                <table>
                    <tr><th>Arma</th><td>{{$berangkat->armada->kode_unit . ' / ' . ($berangkat->armada->plat_nomor ?? 'belum ada plat')}}</td></tr>
                    <tr><th>Tanggal</th><td>{{$berangkat->tanggal->format('d F Y')}}</td></tr>
                    <tr><th>Penyewa</th><td>{{ ($berangkat->data_penyewa['nama'] ?? '-') . ' / ' . ($berangkat->data_penyewa['pt'] ?? '') }}</td></tr>
                    <tr><th>Odo / HM</th><td>{{$berangkat->odo_atau_hm ?? '–' }} HM</td></tr>
                    <tr><th>Catatan</th><td>{{$berangkat->catatan ?? '-'}}</td></tr>
                    <tr><th>Ditandatangani Oleh</th><td>{{$berangkat->dicatatOleh?->name ?? '-'}}</td></tr>
                </table>
            </div>
            <div class="col">
                <h2>Kembali</h2>
                <table>
                    <tr><th>Arma</th><td>{{$kembali->armada->kode_unit . ' / ' . ($kembali->armada->plat_nomor ?? 'belum ada plat')}}</td></tr>
                    <tr><th>Tanggal</th><td>{{$kembali->tanggal->format('d F Y')}}</td></tr>
                    <tr><th>Penyewa</th><td>{{ ($kembali->data_penyewa['nama'] ?? '-') . ' / ' . ($kembali->data_penyewa['pt'] ?? '') }}</td></tr>
                    <tr><th>Odo / HM</th><td>{{$kembali->odo_atau_hm ?? '–' }} HM</td></tr>
                    <tr><th>Pemakaian (selisih)</th><td>{{$pemakaian > 0 ? number_format($pemakaian, 1, ',', '.') . ' HM' : '–'}}</td></tr>
                    <tr><th>Catatan</th><td>{{$kembali->catatan ?? '-'}}</td></tr>
                    <tr><th>Ditandatangani Oleh</th><td>{{$kembali->dicatatOleh?->name ?? '-'}}</td></tr>
                </table>
            </div>
        </div>

        {{-- Item checklist --}}
        <div style="margin-top: 20px;">
            <h3>Item Kondisi (Berangkat)</h3>
            <table style="width:100%;border-collapse:collapse;">
                <tr><th style="width:60%">Item</th><th style="width:20%">Kondisi</th><th style="width:20%">Catatan</th></tr>
                @foreach($berangkat->details as $d)
                    <tr>
                        <td>{{$d->item}}</td>
                        <td style="text-align:center">{{ $d->kondisi }}</td>
                        <td>{{$d->catatan ?? ''}}</td>
                    </tr>
                @endforeach
                @if($berangkat->details->isEmpty())
                    <tr><td colspan="3" style="text-align:center">Belum ada item</td></tr>
                @endif
            </table>

            <h3>Item Kondisi (Kembali)</h3>
            <table style="width:100%;border-collapse:collapse;margin-top:15px;">
                <tr><th style="width:60%">Item</th><th style="width:20%">Kondisi</th><th style="width:20%">Catatan</th></tr>
                @foreach($kembali->details as $d)
                    <tr>
                        <td>{{$d->item}}</td>
                        <td style="text-align:center">{{ $d->kondisi }}</td>
                        <td>{{$d->catatan ?? ''}}</td>
                    </tr>
                @endforeach
                @if($kembali->details->isEmpty())
                    <tr><td colspan="3" style="text-align:center">Belum ada item</td></tr>
                @endif
            </table>
        </div>

        {{-- Foto kondisi --}}
        <div style="margin-top: 20px;">
            <h3>Foto Kondisi (Berangkat)</h3>
            <p style="font-size:9px;max-height:60px;overflow:auto;">
                {{$berangkat->foto_kondisi?->map(fn ($f) => '• ' . basename($f))->implode('<br>') ?? '—'}}
            </p>
            <h3>Foto Kondisi (Kembali)</h3>
            <p style="font-size:9px;max-height:60px;overflow:auto;">
                {{$kembali->foto_kondisi?->map(fn ($f) => '• ' . basename($f))->implode('<br>') ?? '—'}}
            </p>
        </div>

        {{-- Pemakaian & Tanda tangan --}}
        <div style="margin-top: 30px; page-break-inside: avoid;">
            <p class="total-row">Pemakaian HM: {{$pemakaian > 0 ? number_format($pemakaian, 1, ',', '.') . ' HM' : '—'}} (kembali - berangkat)</p>
            <div class="signature">
                <div>Dicatat Oleh:</div>
                <div class="line">{{ $berangkat->dicatatOleh?->name ?? '-' }}</div>
                <div>Kembali Oleh:</div>
                <div class="line">{{ $kembali->dicatatOleh?->name ?? '-' }}</div>
            </div>
        </div>
    </div>
</body>
</html>
