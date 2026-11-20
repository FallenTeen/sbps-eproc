<?php

namespace Database\Seeders;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\ServisEksternalDetail;
use App\Domain\Fleet\Models\ServisEksternalNota;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ServisEksternalDemoSeeder extends Seeder
{
    use StagingOnly;

    private const NOTA_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#f3f4f6"/><rect x="150" y="45" width="340" height="330" rx="8" fill="#fff" stroke="#9ca3af" stroke-width="4"/><text x="320" y="150" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#374151">CONTOH DEMO</text><text x="320" y="205" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#6b7280">BUKAN NOTA ASLI</text><text x="320" y="260" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b7280">DATA STAGING</text></svg>';

    public function run(): void
    {
        $this->assertNotProduction();

        $armada = Armada::query()
            ->where('kode_unit', 'GCS-TEST-DT-01')
            ->first()
            ?? Armada::query()->where('tipe_unit', 'armada_jalan')->orderBy('kode_unit')->first();
        $pemohon = User::where('email', 'test.owner@dummy.com')->first()
            ?? User::where('email', 'owner@real.com')->first();

        if (! $armada || ! $pemohon) {
            $this->command?->warn('[ServisEksternalDemoSeeder] Armada atau user pemohon belum tersedia; data demo dilewati.');

            return;
        }

        $workshop = User::where('email', 'test.workshop@dummy.com')->first()
            ?? User::where('email', 'workshop@real.com')->first();

        foreach ([
            [
                'kode_pengajuan' => 'SRV-EKS-DEMO-001',
                'tanggal_ajuan' => now()->subDays(2)->toDateString(),
                'status' => 'dikerjakan',
                'verifikasi' => 'belum',
                'estimasi' => 850_000,
                'biaya' => null,
            ],
            [
                'kode_pengajuan' => 'SRV-EKS-DEMO-002',
                'tanggal_ajuan' => now()->subDays(5)->toDateString(),
                'status' => 'selesai',
                'verifikasi' => 'terverifikasi',
                'estimasi' => 1_250_000,
                'biaya' => 1_200_000,
            ],
            [
                'kode_pengajuan' => 'SRV-EKS-DEMO-003',
                'tanggal_ajuan' => now()->subDays(8)->toDateString(),
                'status' => 'selesai',
                'verifikasi' => 'bermasalah',
                'estimasi' => 2_000_000,
                'biaya' => 2_300_000,
            ],
        ] as $index => $data) {
            $selesai = $data['status'] === 'selesai';
            $pengajuan = PengajuanServisArmada::updateOrCreate(
                ['kode_pengajuan' => $data['kode_pengajuan']],
                [
                    'armada_id' => $armada->id,
                    'tipe_servis' => 'eksternal',
                    'diajukan_oleh' => $pemohon->id,
                    'tanggal_ajuan' => $data['tanggal_ajuan'],
                    'catatan_ajuan' => 'DATA DEMO SERVIS EKSTERNAL - bukan pengajuan servis sebenarnya.',
                    'status' => $data['status'],
                    'disetujui_oleh' => $pemohon->id,
                    'tanggal_acc' => $data['tanggal_ajuan'],
                    'tanggal_mulai_kerja' => $data['tanggal_ajuan'],
                    'tanggal_selesai_kerja' => $selesai ? $data['tanggal_ajuan'] : null,
                    'tanggal_selesai' => $selesai ? $data['tanggal_ajuan'] : null,
                    'catatan_pengerjaan' => $selesai ? 'Pekerjaan demo selesai; data bukan catatan servis nyata.' : null,
                    'total_biaya' => $data['biaya'] ?? 0,
                ]
            );

            ServisEksternalDetail::updateOrCreate(
                ['pengajuan_id' => $pengajuan->id],
                [
                    'nama_bengkel' => 'Bengkel Demo Staging',
                    'alamat_bengkel' => 'Alamat contoh - bukan lokasi bengkel nyata.',
                    'rincian_pekerjaan' => 'Pemeriksaan dan perawatan kendaraan (data demo).',
                    'total_biaya_estimasi' => $data['estimasi'],
                    'verifikasi_workshop' => $data['verifikasi'],
                    'verifikasi_workshop_oleh' => $data['verifikasi'] === 'belum' ? null : $workshop?->id,
                    'verifikasi_workshop_pada' => $data['verifikasi'] === 'belum' ? null : now()->subDays(8 - ($index * 3)),
                    'verifikasi_workshop_catatan' => match ($data['verifikasi']) {
                        'terverifikasi' => 'Data demo terverifikasi; bukan pemeriksaan nyata.',
                        'bermasalah' => 'Data demo: nilai nota berbeda dari estimasi.',
                        default => null,
                    },
                ]
            );

            if ($data['biaya'] !== null) {
                $path = "demo/servis-eksternal/{$data['kode_pengajuan']}.svg";
                if (! Storage::disk('public')->exists($path) && ! Storage::disk('public')->put($path, self::NOTA_SVG)) {
                    throw new RuntimeException("Tidak dapat menyimpan file nota demo: {$path}");
                }

                ServisEksternalNota::updateOrCreate(
                    ['pengajuan_id' => $pengajuan->id, 'foto_nota' => $path],
                    [
                        'nominal_rp' => $data['biaya'],
                        'tanggal_nota' => $data['tanggal_ajuan'],
                        'diinput_oleh' => $pemohon->id,
                        'catatan' => 'BUKTI DEMO - bukan nota transaksi nyata.',
                    ]
                );
            }
        }

        $this->command?->info('[ServisEksternalDemoSeeder] Riwayat servis eksternal demo disiapkan.');
    }
}
