<?php

namespace Database\Seeders;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDokumenBerkalaRiwayat;
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

            $dokumen = $armada->dokumenBerkalas()->firstOrCreate(
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

            $tanggalBaru = $dokumen->tanggal_jatuh_tempo->toDateString();
            $tanggalLama = $dokumen->tanggal_jatuh_tempo->copy()->subYear()->toDateString();
            $riwayat = ArmadaDokumenBerkalaRiwayat::query()
                ->where('dokumen_berkala_id', $dokumen->id)
                ->whereDate('tanggal_jatuh_tempo_lama', $tanggalLama)
                ->whereDate('tanggal_jatuh_tempo_baru', $tanggalBaru)
                ->first();

            if (! $riwayat) {
                ArmadaDokumenBerkalaRiwayat::create([
                    'dokumen_berkala_id' => $dokumen->id,
                    'tanggal_jatuh_tempo_lama' => $tanggalLama,
                    'tanggal_jatuh_tempo_baru' => $tanggalBaru,
                    'nominal_biaya' => $dokumen->nominal_biaya,
                    'nomor_dokumen_baru' => $dokumen->nomor_dokumen,
                    'catatan' => 'DATA DEMO - riwayat perpanjangan simulasi.',
                ]);
            }
        }

        $this->command?->info("[ArmadaDokumenBerkalaSeeder] Dokumen demo disiapkan untuk {$armadas->count()} armada.");
    }
}
