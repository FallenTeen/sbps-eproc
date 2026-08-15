<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use Illuminate\Database\Seeder;

class AkunKasBankSeeder extends Seeder
{
    public function run(): void
    {
        $gcs = UnitBisnis::where('kode', 'GCS')->firstOrFail();
        $cbp = UnitBisnis::where('kode', 'CBP')->firstOrFail();
        $amp = UnitBisnis::where('kode', 'AMP')->firstOrFail();

        $akuns = [
            [$gcs->id, 'Kas Kecil GCS', 'kas_kecil', 5_000_000],
            [$gcs->id, 'Kas Besar GCS', 'kas_besar', 150_000_000],
            [$gcs->id, 'Kas Operasional Armada', 'kas_operasional', 25_000_000],
            [$gcs->id, 'Bank BCA GCS', 'bank', 500_000_000],
            [$cbp->id, 'Kas Kecil CBP', 'kas_kecil', 8_000_000],
            [$cbp->id, 'Bank Mandiri CBP', 'bank', 750_000_000],
            [$amp->id, 'Bank BRI AMP', 'bank', 300_000_000],
        ];

        foreach ($akuns as [$unitBisnisId, $nama, $jenisKas, $saldo]) {
            AkunKasBank::updateOrCreate(
                ['unit_bisnis_id' => $unitBisnisId, 'nama' => $nama],
                [
                    'jenis_kas' => $jenisKas,
                    'akun_coa_id' => null,
                    'saldo_awal' => $saldo,
                    'aktif' => true,
                ]
            );
        }
    }
}
