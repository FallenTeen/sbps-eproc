<?php

namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class GetRekapKasAction
{
    /**
     * Bangun rekap pemasukan & pengeluaran dari buku kas
     * (mutasi_kas_banks) - sumber kebenaran tunggal, termasuk
     * penyesuaian manual yang ditulis ke sana.
     *
     * @param  string|null  $unitBisnisId
     * @param  int|null     $bulan        null = semua bulan
     * @param  int|null     $tahun        null = semua tahun
     * @return array{transaksi: Collection, total_masuk: float, total_keluar: float, selisih: float, per_bulan: Collection}
     */
    public function execute(?string $unitBisnisId = null, ?int $bulan = null, ?int $tahun = null): array
    {
        $query = MutasiKasBank::query()
            ->with(['akunKasBank.unitBisnis'])
            ->join('akun_kas_banks', 'akun_kas_banks.id', '=', 'mutasi_kas_banks.akun_kas_bank_id')
            ->when($unitBisnisId, fn ($q) => $q->where('akun_kas_banks.unit_bisnis_id', $unitBisnisId))
            ->when($tahun, fn ($q) => $q->whereYear('mutasi_kas_banks.tanggal', $tahun))
            ->when($bulan, fn ($q) => $q->whereMonth('mutasi_kas_banks.tanggal', $bulan))
            ->select('mutasi_kas_banks.*')
            ->orderByDesc('mutasi_kas_banks.tanggal')
            ->orderByDesc('mutasi_kas_banks.created_at');

        $mutasis = $query->get();

        $totalMasuk = 0.0;
        $totalKeluar = 0.0;

        $rows = $mutasis->map(function (MutasiKasBank $m) use (&$totalMasuk, &$totalKeluar) {
            $akun = $m->akunKasBank;
            $unit = $akun?->unitBisnis;

            if ($m->tipe === 'masuk') {
                $totalMasuk += (float) $m->jumlah;
            } else {
                $totalKeluar += (float) $m->jumlah;
            }

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

        // Ringkasan per bulan (untuk halaman publik - kombinasi)
        $perBulan = $rows
            ->groupBy(fn ($row) => substr((string) $row['tanggal'], 0, 7))
            ->map(function (Collection $group, $ym) {
                $masuk = (float) $group->where('tipe', 'masuk')->sum('jumlah');
                $keluar = (float) $group->where('tipe', 'keluar')->sum('jumlah');

                return [
                    'periode' => $ym,
                    'pemasukan' => $masuk,
                    'pengeluaran' => $keluar,
                    'saldo' => $masuk - $keluar,
                ];
            })
            ->sortKeysDesc()
            ->values();

        return [
            'transaksi' => $rows,
            'total_masuk' => (float) round($totalMasuk, 2),
            'total_keluar' => (float) round($totalKeluar, 2),
            'selisih' => (float) round($totalMasuk - $totalKeluar, 2),
            'per_bulan' => $perBulan,
            'periode_label' => $this->periodeLabel($bulan, $tahun),
        ];
    }

    protected function periodeLabel(?int $bulan, ?int $tahun): string
    {
        if ($bulan && $tahun) {
            return Carbon::create($tahun, $bulan, 1)->translatedFormat('F Y');
        }
        if ($tahun) {
            return (string) $tahun;
        }

        return 'Seluruh Periode';
    }
}
