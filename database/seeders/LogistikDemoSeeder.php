<?php

namespace Database\Seeders;

use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\Ritase;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class LogistikDemoSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $catatan = 'DATA DEMO LOGISTIK - verifikasi timbang';
        if (Ritase::where('catatan', $catatan)->exists()) {
            return;
        }

        $assignment = ArmadaDriver::query()
            ->with('karyawan')
            ->where('status', 'aktif')
            ->whereHas('armada', fn ($query) => $query->where('tipe_unit', 'armada_jalan'))
            ->whereHas('karyawan')
            ->first();

        if (! $assignment) {
            $this->command?->warn('[LogistikDemoSeeder] Tidak ada armada dengan driver aktif; ritase demo dilewati.');

            return;
        }

        app(RecordRitaseAction::class)->execute([
            'armada_id' => $assignment->armada_id,
            'driver_karyawan_id' => $assignment->karyawan_id,
            'tanggal' => now()->toDateString(),
            'kategori' => 'DEMO',
            'material' => 'Material Demo',
            'jumlah_rit' => 1,
            'satuan_volume' => 'tonase',
            'jumlah_volume' => 24,
            'tarif_per_rit_snapshot' => 0,
            'nominal' => 0,
            'catatan' => $catatan,
        ]);

        $this->command?->info('[LogistikDemoSeeder] Ritase demo untuk antrean verifikasi dibuat.');
    }
}
