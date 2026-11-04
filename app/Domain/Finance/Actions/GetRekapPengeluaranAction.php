<?php

namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class GetRekapPengeluaranAction
{
    /**
     * Rekap khusus pengeluaran (TD-D) - sumber sama dengan
     * GetRekapKasAction (mutasi_kas_banks, tipe = keluar).
     *
     * @param  string|null  $unitBisnisId
     * @param  string|null  $kategori
     * @param  string|null  $akunKasId
     * @param  Carbon|null  $mulai
     * @param  Carbon|null  $sampai
     * @return array{transaksi: Collection, total_pengeluaran: float, per_bulan: Collection, periode_label: string}
     */
    public function execute(?string $unitBisnisId = null, ?string $kategori = null, ?string $akunKasId = null, ?Carbon $mulai = null, ?Carbon $sampai = null): array
    {
        $mutasis = MutasiKasBank::query()
            ->keluar()
            ->with(['akunKasBank.unitBisnis'])
            ->join('akun_kas_banks', 'akun_kas_banks.id', '=', 'mutasi_kas_banks.akun_kas_bank_id')
            ->when($unitBisnisId, fn ($q) => $q->where('akun_kas_banks.unit_bisnis_id', $unitBisnisId))
            ->when($akunKasId, fn ($q) => $q->where('mutasi_kas_banks.akun_kas_bank_id', $akunKasId))
            ->when($kategori, fn ($q) => $q->where('mutasi_kas_banks.kategori', $kategori))
            ->when($mulai, fn ($q) => $q->whereDate('mutasi_kas_banks.tanggal', '>=', $mulai->toDateString()))
            ->when($sampai, fn ($q) => $q->whereDate('mutasi_kas_banks.tanggal', '<=', $sampai->toDateString()))
            ->select('mutasi_kas_banks.*')
            ->orderByDesc('mutasi_kas_banks.tanggal')
            ->orderByDesc('mutasi_kas_banks.created_at')
            ->get();

        $total = 0.0;

        $rows = $mutasis->map(function (MutasiKasBank $m) use (&$total) {
            $akun = $m->akunKasBank;
            $unit = $akun?->unitBisnis;
            $total += (float) $m->jumlah;

            return [
                'id' => $m->id,
                'akun_kas_bank_id' => $m->akun_kas_bank_id,
                'tanggal' => $m->tanggal ? $m->tanggal->format('Y-m-d') : null,
                'unit_bisnis' => $unit?->nama ?? '-',
                'akun_kas' => $akun?->nama ?? '-',
                'kategori' => $m->kategori,
                'tipe' => $m->tipe,
                'jumlah' => (float) $m->jumlah,
                'catatan' => $m->catatan,
                'is_manual' => $m->referensi_type === RekapManual::class,
            ];
        });

        $perBulan = $rows
            ->groupBy(fn ($row) => substr((string) $row['tanggal'], 0, 7))
            ->map(fn (Collection $group, $ym) => [
                'periode' => $ym,
                'pengeluaran' => (float) $group->sum('jumlah'),
            ])
            ->sortKeysDesc()
            ->values();

        return [
            'transaksi' => $rows,
            'total_pengeluaran' => (float) round($total, 2),
            'per_bulan' => $perBulan,
            'periode_label' => $this->periodeLabel($mulai, $sampai),
        ];
    }

    protected function periodeLabel(?Carbon $mulai, ?Carbon $sampai): string
    {
        if ($mulai && $sampai) {
            return $mulai->translatedFormat('d M Y').' - '.$sampai->translatedFormat('d M Y');
        }

        return 'Seluruh Periode';
    }
}
