<?php

namespace Database\Seeders;

use App\Domain\Security\Models\BukuTamu;
use App\Domain\Security\Models\SecurityChecklistRun;
use App\Domain\Security\Models\SecurityChecklistRunItem;
use App\Domain\Security\Models\SecurityChecklistTemplate;
use App\Domain\Security\Models\SecurityLaporanDarurat;
use App\Models\User;
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

        $security = User::where('email', 'test.security@dummy.com')->first();
        $checklistExamples = [
            [
                'template' => 'Demo - Checklist Keamanan Siang',
                'tanggal' => today(),
                'jam_pantau' => '10:00',
                'catatan' => 'DATA DEMO SECURITY - checklist siang.',
                'done_count' => 3,
            ],
            [
                'template' => 'Demo - Checklist Keamanan Malam',
                'tanggal' => today()->subDay(),
                'jam_pantau' => '21:00',
                'catatan' => 'DATA DEMO SECURITY - checklist malam.',
                'done_count' => 2,
            ],
        ];

        foreach ($checklistExamples as $example) {
            $template = SecurityChecklistTemplate::where('nama', $example['template'])->firstOrFail();
            $templateItems = $template->items()->orderBy('urutan')->get();
            $run = SecurityChecklistRun::updateOrCreate(
                ['catatan' => $example['catatan']],
                [
                    'tanggal' => $example['tanggal']->toDateString(),
                    'periode' => $template->periode,
                    'jam_pantau' => $example['jam_pantau'],
                    'security_id' => $security?->id,
                    'items' => $templateItems->map(fn ($item) => $item->teks)->all(),
                ]
            );

            foreach ($templateItems as $index => $item) {
                SecurityChecklistRunItem::updateOrCreate(
                    ['run_id' => $run->id, 'template_item_id' => $item->id],
                    [
                        'done' => $index < $example['done_count'],
                        'catatan' => 'DATA DEMO SECURITY.',
                        'waktu' => $run->tanggal->copy()->setTimeFromTimeString($example['jam_pantau']),
                    ]
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
                'dicatat_oleh' => $security?->id,
            ]
        );

        SecurityLaporanDarurat::updateOrCreate(
            ['judul' => '[DEMO] Simulasi laporan keadaan darurat'],
            [
                'kategori' => 'simulasi',
                'deskripsi' => 'DATA DEMO SECURITY - bukan laporan kejadian sebenarnya.',
                'lokasi_ruangan' => 'Area simulasi',
                'tingkat' => 'rendah',
                'status' => 'baru',
                'pelapor_id' => $security?->id,
            ]
        );

        $this->command?->info('[SecurityDemoSeeder] Template, riwayat checklist, dan data contoh Security disiapkan.');
    }
}
