<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <title>Checklist Serah Terima — {{ $sewa->armada->kode_unit }} / {{ \Carbon\Carbon::parse($sewa->tanggal)->translatedFormat('d F Y') }}</title>
    <style>
        @page {
            margin: 18mm 15mm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        /* Header Dokumen */
        .doc-header {
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }

        .doc-title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }

        .doc-subtitle {
            font-size: 10px;
            color: #64748b;
            margin: 2px 0 0;
        }

        /* Ringkasan Utama */
        .summary-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 8px 10px;
            margin-bottom: 14px;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 2px 4px;
            vertical-align: top;
        }

        .summary-label {
            color: #64748b;
            font-size: 8.5px;
            text-transform: uppercase;
            font-weight: bold;
        }

        .summary-val {
            font-size: 10.5px;
            font-weight: bold;
            color: #0f172a;
        }

        /* Grid 2 Kolom (Kompatibel DomPDF) */
        .two-col-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 14px;
        }

        .two-col-cell {
            width: 49%;
            vertical-align: top;
        }

        .two-col-spacer {
            width: 2%;
        }

        /* Kartu Detail Berangkat & Kembali */
        .section-card {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            overflow: hidden;
        }

        .section-header {
            background-color: #1e3a8a;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 10px;
            letter-spacing: 0.4px;
        }

        .section-header.kembali {
            background-color: #0f766e;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta-table th,
        .meta-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            vertical-align: top;
            font-size: 9.5px;
        }

        .meta-table tr:last-child th,
        .meta-table tr:last-child td {
            border-bottom: none;
        }

        .meta-table th {
            width: 38%;
            color: #475569;
            font-weight: bold;
            background-color: #f8fafc;
        }

        /* Judul Sub-bagian */
        .block-title {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            border-left: 3px solid #1e3a8a;
            padding-left: 7px;
            margin: 14px 0 8px;
        }

        /* Tabel Item Checklist */
        .checklist-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .checklist-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }

        .checklist-table td {
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            font-size: 9.5px;
            vertical-align: middle;
        }

        .checklist-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        .text-center {
            text-align: center !important;
        }

        /* Badge Status */
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            border-radius: 3px;
        }

        .badge-baik {
            background-color: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
        }

        .badge-rusak {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }

        .badge-empty {
            color: #94a3b8;
        }

        /* Lampiran Foto */
        .photo-box {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 7px 10px;
            border-radius: 4px;
            font-size: 8.5px;
            color: #334155;
            min-height: 36px;
        }

        .photo-item {
            display: inline-block;
            margin: 4px 4px 0 0;
            vertical-align: top;
        }

        .photo-item img {
            width: 140px;
            height: 100px;
            object-fit: cover;
            border: 1px solid #cbd5e1;
        }

        /* Tanda Tangan */
        .signature-wrapper {
            margin-top: 22px;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .signature-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 25px;
        }

        .sig-role {
            font-size: 9.5px;
            color: #475569;
            margin-bottom: 45px;
        }

        .sig-name {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            border-top: 1px solid #334155;
            padding-top: 4px;
            display: inline-block;
            min-width: 160px;
        }
    </style>
</head>

<body>
    {{-- Header Dokumen --}}
    <div class="doc-header">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: bottom;">
                    <h1 class="doc-title">Berita Acara & Checklist Serah Terima</h1>
                    <p class="doc-subtitle">Pemeriksaan Kondisi Unit Sewa Alat Berat (Berangkat & Kembali)</p>
                </td>
                <td style="text-align: right; vertical-align: bottom; font-size: 9px; color: #64748b;">
                    Dicetak: {{ now()->translatedFormat('d F Y, H:i') }} WIB
                </td>
            </tr>
        </table>
    </div>

    {{-- Ringkasan Unit & Pemakaian --}}
    <div class="summary-box">
        <table class="summary-table">
            <tr>
                <td style="width: 28%;">
                    <div class="summary-label">Unit Armada</div>
                    <div class="summary-val">{{ $sewa->armada->kode_unit }} ({{ $sewa->armada->plat_nomor ?? 'Tanpa Plat' }})</div>
                </td>
                <td style="width: 32%;">
                    <div class="summary-label">Penyewa / Perusahaan</div>
                    <div class="summary-val">
                        {{ $berangkat->data_penyewa['nama'] ?? $kembali->data_penyewa['nama'] ?? $sewa->penyewa_nama ?? '-' }}
                        @if(!empty($berangkat->data_penyewa['pt'] ?? $kembali->data_penyewa['pt']))
                            ({{ $berangkat->data_penyewa['pt'] ?? $kembali->data_penyewa['pt'] }})
                        @endif
                    </div>
                </td>
                <td style="width: 20%;">
                    <div class="summary-label">HM Awal / Akhir</div>
                    <div class="summary-val">{{ $berangkat->odo_atau_hm ?? '–' }} / {{ $kembali->odo_atau_hm ?? '–' }} HM</div>
                </td>
                <td style="width: 20%; text-align: right;">
                    <div class="summary-label">Total Pemakaian</div>
                    <div class="summary-val" style="color: #0f766e;">
                        {{ $pemakaian > 0 ? number_format($pemakaian, 1, ',', '.') . ' HM' : '–' }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- Informasi Serah Terima Berangkat vs Kembali (2 Kolom) --}}
    <table class="two-col-table">
        <tr>
            <td class="two-col-cell">
                <div class="section-card">
                    <div class="section-header">01. Data Keberangkatan (Awal Sewa)</div>
                    <table class="meta-table">
                        <tr>
                            <th>Tanggal</th>
                            <td>{{ $berangkat?->tanggal ? $berangkat->tanggal->translatedFormat('d F Y') : '-' }}</td>
                        </tr>
                        <tr>
                            <th>Odo / HM Awal</th>
                            <td><strong>{{ $berangkat->odo_atau_hm ?? '–' }} HM</strong></td>
                        </tr>
                        <tr>
                            <th>Penanggung Jawab</th>
                            <td>{{ $berangkat->dicatatOleh?->name ?? '-' }}</td>
                        </tr>
                        <tr>
                            <th>Catatan</th>
                            <td>{{ $berangkat->catatan ?? '-' }}</td>
                        </tr>
                    </table>
                </div>
            </td>
            <td class="two-col-spacer"></td>
            <td class="two-col-cell">
                <div class="section-card">
                    <div class="section-header kembali">02. Data Pengembalian (Akhir Sewa)</div>
                    <table class="meta-table">
                        <tr>
                            <th>Tanggal</th>
                            <td>{{ $kembali?->tanggal ? $kembali->tanggal->translatedFormat('d F Y') : '-' }}</td>
                        </tr>
                        <tr>
                            <th>Odo / HM Akhir</th>
                            <td><strong>{{ $kembali->odo_atau_hm ?? '–' }} HM</strong></td>
                        </tr>
                        <tr>
                            <th>Penanggung Jawab</th>
                            <td>{{ $kembali->dicatatOleh?->name ?? '-' }}</td>
                        </tr>
                        <tr>
                            <th>Catatan</th>
                            <td>{{ $kembali->catatan ?? '-' }}</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    {{-- Tabel Perbandingan Checklist Kondisi Fisik --}}
    @php
        $berangkatDetails = collect($berangkat?->details ?? [])->keyBy('item');
        $kembaliDetails = collect($kembali?->details ?? [])->keyBy('item');
        $allItems = $berangkatDetails->keys()->merge($kembaliDetails->keys())->unique()->values();
    @endphp

    <div class="block-title">Rincian Pengecekan Komponen Unit</div>
    <table class="checklist-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">No</th>
                <th style="width: 37%;">Item / Komponen</th>
                <th style="width: 14%;" class="text-center">Berangkat</th>
                <th style="width: 14%;" class="text-center">Kembali</th>
                <th style="width: 30%;">Keterangan / Catatan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($allItems as $index => $itemName)
                @php
                    $bItem = $berangkatDetails->get($itemName);
                    $kItem = $kembaliDetails->get($itemName);
                    $bKondisi = strtolower($bItem->kondisi ?? '');
                    $kKondisi = strtolower($kItem->kondisi ?? '');

                    $notes = collect([
                        $bItem?->catatan ? 'Berangkat: ' . $bItem->catatan : null,
                        $kItem?->catatan ? 'Kembali: ' . $kItem->catatan : null,
                    ])->filter()->implode(' | ');
                @endphp
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td><strong>{{ $itemName }}</strong></td>
                    <td class="text-center">
                        @if($bKondisi)
                            <span class="badge {{ $bKondisi === 'baik' ? 'badge-baik' : 'badge-rusak' }}">
                                {{ $bKondisi }}
                            </span>
                        @else
                            <span class="badge-empty">—</span>
                        @endif
                    </td>
                    <td class="text-center">
                        @if($kKondisi)
                            <span class="badge {{ $kKondisi === 'baik' ? 'badge-baik' : 'badge-rusak' }}">
                                {{ $kKondisi }}
                            </span>
                        @else
                            <span class="badge-empty">—</span>
                        @endif
                    </td>
                    <td>{{ $notes ?: '—' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" class="text-center" style="padding: 12px; color: #64748b;">
                        Belum ada rincian item checklist yang dicatat.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Lampiran Foto Kondisi (2 Kolom) --}}
    <div class="block-title">Lampiran Dokumentasi Foto</div>
    <table class="two-col-table">
        <tr>
            <td class="two-col-cell">
                <div class="photo-box">
                    <strong style="display: block; margin-bottom: 3px; color: #0f172a;">Foto Kondisi Berangkat:</strong>
                    @forelse(collect($berangkat?->foto_kondisi ?? []) as $foto)
                        @php
                            $fotoPath = public_path('storage/' . ltrim(str_replace('storage/', '', $foto), '/'));
                        @endphp
                        @if(file_exists($fotoPath))
                            <span class="photo-item"><img src="{{ $fotoPath }}" alt="Foto kondisi berangkat"></span>
                        @else
                            <div>{{ basename($foto) }}</div>
                        @endif
                    @empty
                        Tidak ada lampiran foto
                    @endforelse
                </div>
            </td>
            <td class="two-col-spacer"></td>
            <td class="two-col-cell">
                <div class="photo-box">
                    <strong style="display: block; margin-bottom: 3px; color: #0f172a;">Foto Kondisi Kembali:</strong>
                    @forelse(collect($kembali?->foto_kondisi ?? []) as $foto)
                        @php
                            $fotoPath = public_path('storage/' . ltrim(str_replace('storage/', '', $foto), '/'));
                        @endphp
                        @if(file_exists($fotoPath))
                            <span class="photo-item"><img src="{{ $fotoPath }}" alt="Foto kondisi kembali"></span>
                        @else
                            <div>{{ basename($foto) }}</div>
                        @endif
                    @empty
                        Tidak ada lampiran foto
                    @endforelse
                </div>
            </td>
        </tr>
    </table>

    {{-- Tanda Tangan --}}
    <div class="signature-wrapper">
        <table class="signature-table">
            <tr>
                <td>
                    <div class="sig-role">Serah Terima Berangkat,</div>
                    <div class="sig-name">{{ $berangkat->dicatatOleh?->name ?? '........................................' }}</div>
                </td>
                <td>
                    <div class="sig-role">Serah Terima Kembali,</div>
                    <div class="sig-name">{{ $kembali->dicatatOleh?->name ?? '........................................' }}</div>
                </td>
            </tr>
        </table>
    </div>
</body>

</html>