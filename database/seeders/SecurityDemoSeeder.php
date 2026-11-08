<?php

namespace Database\Seeders;

use App\Domain\Security\Models\BukuTamu;
use App\Domain\Security\Models\SecurityChecklistTemplate;
use App\Domain\Security\Models\SecurityLaporanDarurat;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class SecurityDemoSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $templates = [
            [
                'nama' => 'Demo - Checklist Keamanan Siang',
                'periode' => 'harian',
                'jam_mulai' => '07:00',
                'jam_selesai' => '19:00',
                'hari' => ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'],
                'items' => [
                    'Periksa akses masuk dan pagar',
                    'Periksa area parkir dan kendaraan',
                    'Periksa alat pemadam kebakaran',
                ],
            ],
            [
                'nama' => 'Demo - Checklist Keamanan Malam',
                'periode' => 'malam',
                'jam_mulai' => '19:00',
                'jam_selesai' => '07:00',
                'hari' => ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'],
                'items' => [
                    'Periksa seluruh pintu dan jendela',
                    'Periksa penerangan area luar',
                    'Catat kondisi tidak normal pada buku jaga',
                ],
            ],
        ];

        foreach ($templates as $data) {
            $items = $data['items'];
            unset($data['items']);

            $template = SecurityChecklistTemplate::updateOrCreate(
                ['nama' => $data['nama']],
                $data + ['aktif' => true]
            );

            foreach ($items as $index => $teks) {
                $template->items()->updateOrCreate(
                    ['urutan' => $index + 1],
                    ['teks' => $teks]
                );
            }
        }

        BukuTamu::firstOrCreate(
            ['nama' => '[DEMO] Budi Santoso', 'catatan' => 'DATA DEMO SECURITY'],
            [
                'jumlah_orang' => 2,
                'asal' => 'PT Contoh Demo',
                'nomor_telepon' => '080000000000',
                'kendaraan' => 'mobil',
                'plat_nomor' => 'B 0000 DEMO',
                'waktu_masuk' => now()->subHours(2),
                'waktu_keluar' => now()->subHour(),
            ]
        );

        SecurityLaporanDarurat::firstOrCreate(
            ['judul' => '[DEMO] Simulasi laporan keadaan darurat'],
            [
                'kategori' => 'simulasi',
                'deskripsi' => 'DATA DEMO SECURITY - bukan laporan kejadian sebenarnya.',
                'lokasi_ruangan' => 'Area simulasi',
                'tingkat' => 'rendah',
                'status' => 'baru',
            ]
        );

        $this->command?->info('[SecurityDemoSeeder] Template checklist dan data contoh Security disiapkan.');
    }
}
