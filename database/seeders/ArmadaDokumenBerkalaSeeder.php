<?php

namespace Database\Seeders;

use App\Domain\Fleet\Models\Armada;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class ArmadaDokumenBerkalaSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $armadas = Armada::query()
            ->where('kode_unit', 'not like', '%-TEST-%')
            ->orderBy('kode_unit')
            ->limit(5)
            ->get();

        foreach ($armadas as $index => $armada) {
            $jenis = ['pajak_tahunan', 'stnk_5_tahunan', 'kir'][$index % 3];
            $jatuhTempo = now()->addMonths(6 + $index)->toDateString();

            $armada->dokumenBerkalas()->firstOrCreate(
                ['jenis' => $jenis],
                [
                    'nomor_dokumen' => 'DEMO-'.$armada->kode_unit.'-'.strtoupper($jenis),
                    'tanggal_terbit' => now()->subYear()->toDateString(),
                    'tanggal_jatuh_tempo' => $jatuhTempo,
                    'nominal_biaya' => match ($jenis) {
                        'pajak_tahunan' => 2_500_000,
                        'stnk_5_tahunan' => 5_000_000,
                        default => 750_000,
                    },
                    'reminder_hari_sebelum' => [30, 14, 7],
                    'catatan' => 'DATA DEMO - silakan ganti dengan dokumen asli.',
                ]
            );
        }

        $this->command?->info("[ArmadaDokumenBerkalaSeeder] Dokumen demo disiapkan untuk {$armadas->count()} armada.");
    }
}
