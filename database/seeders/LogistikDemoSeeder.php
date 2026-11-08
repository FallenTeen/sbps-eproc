<?php

namespace Database\Seeders;

use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseTimbang;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class LogistikDemoSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

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

        $examples = [
            ['catatan' => 'DATA DEMO LOGISTIK - menunggu verifikasi.', 'days_ago' => 0, 'state' => 'menunggu_logistik'],
            ['catatan' => 'DATA DEMO LOGISTIK - menunggu security.', 'days_ago' => 1, 'state' => 'menunggu_security'],
            ['catatan' => 'DATA DEMO LOGISTIK - verifikasi selesai.', 'days_ago' => 2, 'state' => 'selesai'],
            ['catatan' => 'DATA DEMO LOGISTIK - verifikasi ditolak.', 'days_ago' => 3, 'state' => 'ditolak'],
        ];

        foreach ($examples as $example) {
            $ritase = Ritase::where('catatan', $example['catatan'])->first()
                ?? app(RecordRitaseAction::class)->execute([
                    'armada_id' => $assignment->armada_id,
                    'driver_karyawan_id' => $assignment->karyawan_id,
                    'tanggal' => now()->subDays($example['days_ago'])->toDateString(),
                    'kategori' => 'DEMO',
                    'material' => 'Material Demo',
                    'jumlah_rit' => 1,
                    'satuan_volume' => 'tonase',
                    'jumlah_volume' => 24,
                    'tarif_per_rit_snapshot' => 0,
                    'nominal' => 0,
                    'catatan' => $example['catatan'],
                ]);

            if ($example['state'] === 'menunggu_logistik') {
                continue;
            }

            $this->upsertVerifikasi($ritase, 'logistik', 'terverifikasi', 23.8, 'DATA DEMO - hasil timbang diverifikasi.');

            if ($example['state'] === 'menunggu_security') {
                $this->upsertVerifikasi($ritase, 'security', 'menunggu', null, 'DATA DEMO - menunggu pemeriksaan keamanan.');

                continue;
            }

            $securityStatus = $example['state'] === 'ditolak' ? 'ditolak' : 'terverifikasi';
            $securityNote = $securityStatus === 'ditolak'
                ? 'DATA DEMO - simulasi penolakan security.'
                : 'DATA DEMO - pemeriksaan keamanan selesai.';
            $this->upsertVerifikasi($ritase, 'security', $securityStatus, null, $securityNote);

            RitaseTimbang::updateOrCreate(
                ['ritase_id' => $ritase->id],
                [
                    'berat_kosong_kg' => 8_500,
                    'berat_isi_kg' => 32_300,
                    'berat_netto_kg' => 23_800,
                    'tara_sumber' => 'master',
                    'nomor_tiket' => 'DEMO-TIKET-'.str_pad((string) $example['days_ago'], 3, '0', STR_PAD_LEFT),
                    'ditimbang_pada' => now()->subDays($example['days_ago']),
                ]
            );
        }

        $this->command?->info('[LogistikDemoSeeder] Data demo ritase dan riwayat verifikasi disiapkan.');
    }

    private function upsertVerifikasi(Ritase $ritase, string $tahap, string $status, ?float $jumlah, string $catatan): void
    {
        RitaseVerifikasi::updateOrCreate(
            ['ritase_id' => $ritase->id, 'tahap' => $tahap],
            [
                'status' => $status,
                'jumlah_verifikasi' => $jumlah,
                'catatan' => $catatan,
                'checklist' => ['dokumen' => true, 'muatan' => true],
                'diverifikasi_pada' => $status === 'menunggu' ? null : now(),
            ]
        );
    }
}
