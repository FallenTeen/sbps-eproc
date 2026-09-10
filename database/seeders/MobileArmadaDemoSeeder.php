<?php

namespace Database\Seeders;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Data demo armada untuk pengujian aplikasi mobile di staging.
 *
 * Seeder ini MENAMBAH data armada transaksional (checklist harian, ODO awal,
 * pengajuan servis, workshop todo) untuk user test yang sudah dibuat oleh
 * MobileTestUserSeeder, sehingga modul Armada di mobile langsung terlihat
 * terisi saat demo:
 *
 *   - Checklist Harian  : checklist hari ini + riwayat beberapa hari untuk
 *                         armada driver (kondisi baik & bermasalah).
 *   - ODO Awal Proyek   : catatan ODO awal untuk armada di titik uji coba.
 *   - Pengajuan Servis  : beberapa pengajuan dengan status berbeda (diajukan,
 *                         disetujui, dikerjakan, selesai, ditolak).
 *   - Workshop Todo     : tugas perbaikan harian untuk teknisi workshop.
 *
 * Idempotent (menggunakan firstOrCreate/cek keberadaan), aman dijalankan
 * berulang, dan tidak menghapus/menimpa data lain.
 *
 * Prasyarat: jalankan MobileTestUserSeeder + MobileDemoDataSeeder dulu.
 */
class MobileArmadaDemoSeeder extends Seeder
{
    public function run(): void
    {
        $armada = Armada::where('plat_nomor', 'B 9999 TEST')->first();
        $driver = $this->karyawan('Eko Driver Armada');
        $owner = User::where('email', 'test.owner@example.com')->first();
        $workshop = User::where('email', 'workshop@example.com')->first();
        $kepala = User::where('email', 'ketua.armada@example.com')->first();

        if (! $armada) {
            $this->command?->warn('[MobileArmadaDemo] Armada B 9999 TEST tidak ditemukan. Jalankan MobileTestUserSeeder dulu.');

            return;
        }

        // ─────────────────────── CHECKLIST HARIAN ─────────────────────
        $this->seedChecklist($armada, $driver);

        // ─────────────────────── ODO AWAL PROYEK ─────────────────────
        $this->seedOdoAwal($armada, $driver);

        // ─────────────────────── PENGAJUAN SERVIS ────────────────────
        $this->seedServis($armada, $driver, $owner, $kepala);

        // ─────────────────────── WORKSHOP TODO ───────────────────────
        $this->seedWorkshopTodo($armada, $workshop, $kepala);

        $this->command?->info('[MobileArmadaDemo] Data armada demo berhasil ditambahkan.');
    }

    // ─────────────────────────── CHECKLIST HARIAN ─────────────────────────

    private function seedChecklist(Armada $armada, ?Karyawan $driver): void
    {
        $today = now()->toDateString();

        // Checklist hari ini (kondisi baik)
        ArmadaChecklistHarian::firstOrCreate(
            [
                'checkable_type' => Armada::class,
                'checkable_id' => $armada->id,
                'tanggal' => $today,
            ],
            [
                'kondisi_baik' => true,
                'item_bermasalah' => null,
                'dicatat_oleh_karyawan_id' => $driver?->id,
                'status' => 'aktif',
                'solar_liter' => 45.5,
                'odo_pagi' => 12450.0,
                'jam_mulai_operasi' => '07:00',
                'jam_selesai_operasi' => '16:00',
            ]
        );

        // Riwayat checklist 3 hari terakhir
        for ($i = 1; $i <= 3; $i++) {
            $date = now()->subDays($i)->toDateString();

            ArmadaChecklistHarian::firstOrCreate(
                [
                    'checkable_type' => Armada::class,
                    'checkable_id' => $armada->id,
                    'tanggal' => $date,
                ],
                [
                    'kondisi_baik' => $i !== 2, // Hari ke-2 ada masalah
                    'item_bermasalah' => $i === 2 ? 'Radiator bocor, mesin cepat panas.' : null,
                    'dicatat_oleh_karyawan_id' => $driver?->id,
                    'status' => 'aktif',
                    'solar_liter' => 40 + $i * 2,
                    'odo_pagi' => 12400 + $i * 15,
                    'jam_mulai_operasi' => '06:'.str_pad((string) (45 + $i), 2, '0', STR_PAD_LEFT),
                    'jam_selesai_operasi' => '16:10',
                ]
            );
        }
    }

    // ────────────────────────── ODO AWAL PROYEK ──────────────────────────

    private function seedOdoAwal(Armada $armada, ?Karyawan $driver): void
    {
        $proyek = \App\Domain\Core\Models\Proyek::where('kode_proyek', 'PRJ-TEST-MOBILE')->first();

        if (! $proyek) {
            return;
        }

        ArmadaOdoAwalProyek::firstOrCreate(
            [
                'armada_id' => $armada->id,
                'proyek_id' => $proyek->id,
            ],
            [
                'odo_awal' => 12350.0,
                'jarak_ke_pusat_km' => 12.5,
                'dicatat_oleh_karyawan_id' => $driver?->id,
                'tanggal' => now()->toDateString(),
            ]
        );
    }

    // ────────────────────────── PENGAJUAN SERVIS ─────────────────────────

    private function seedServis(
        Armada $armada,
        ?Karyawan $driver,
        ?User $owner,
        ?User $kepala
    ): void {
        $user = $driver?->user ?? $owner;

        // Servis 1: Menunggu persetujuan
        $this->createServis($armada, $user, [
            'kode_pengajuan' => 'SRV-DEMO-001',
            'tanggal_ajuan' => now()->subDays(1)->toDateString(),
            'catatan_ajuan' => 'Mesin mengeluarkan asap putih saat dipercepat. Perlu pengecekan radiator dan ganti oli.',
            'status' => 'diajukan',
            'butuh_sparepart' => true,
        ]);

        // Servis 2: Disetujui, menunggu pengerjaan
        $this->createServis($armada, $user, [
            'kode_pengajuan' => 'SRV-DEMO-002',
            'tanggal_ajuan' => now()->subDays(3)->toDateString(),
            'catatan_ajuan' => 'Ganti oli mesin + filter udara. Sudah 5.000 km sejak servis terakhir.',
            'status' => 'disetujui',
            'disetujui_oleh' => $kepala?->id,
            'tanggal_acc' => now()->subDays(2)->toDateString(),
            'catatan_acc' => 'Disetujui, silakan dikerjakan.',
            'butuh_sparepart' => false,
        ]);

        // Servis 3: Sedang dikerjakan
        $this->createServis($armada, $user, [
            'kode_pengajuan' => 'SRV-DEMO-003',
            'tanggal_ajuan' => now()->subDays(5)->toDateString(),
            'catatan_ajuan' => 'Ban belakang kiri bocor, perlu ganti ban.',
            'status' => 'dikerjakan',
            'disetujui_oleh' => $kepala?->id,
            'tanggal_acc' => now()->subDays(4)->toDateString(),
            'tanggal_mulai_kerja' => now()->subDays(2)->toDateString(),
            'catatan_pengerjaan' => 'Sedang proses penggantian ban.',
            'butuh_sparepart' => true,
        ]);

        // Servis 4: Selesai
        $servis4 = $this->createServis($armada, $user, [
            'kode_pengajuan' => 'SRV-DEMO-004',
            'tanggal_ajuan' => now()->subDays(10)->toDateString(),
            'catatan_ajuan' => 'Servis berkala 10.000 km. Ganti oli, filter, dan cek rem.',
            'status' => 'selesai',
            'disetujui_oleh' => $kepala?->id,
            'tanggal_acc' => now()->subDays(9)->toDateString(),
            'tanggal_mulai_kerja' => now()->subDays(8)->toDateString(),
            'tanggal_selesai_kerja' => now()->subDays(7)->toDateString(),
            'catatan_pengerjaan' => 'Servis selesai. Oli + filter diganti, rem dalam kondisi baik.',
            'butuh_sparepart' => false,
            'total_biaya' => 2_500_000,
        ]);

        // Sparepart untuk servis yang selesai
        if ($servis4) {
            PengajuanServisSparepart::firstOrCreate(
                [
                    'pengajuan_servis_armada_id' => $servis4->id,
                    'nama_item' => 'Oli Mesin 10W-40',
                ],
                [
                    'jumlah' => 4,
                    'satuan' => 'liter',
                    'nominal' => 450_000,
                    'status' => 'terpakai',
                ]
            );
            PengajuanServisSparepart::firstOrCreate(
                [
                    'pengajuan_servis_armada_id' => $servis4->id,
                    'nama_item' => 'Filter Udara',
                ],
                [
                    'jumlah' => 1,
                    'satuan' => 'pcs',
                    'nominal' => 350_000,
                    'status' => 'terpakai',
                ]
            );
        }

        // Servis 5: Ditolak
        $this->createServis($armada, $user, [
            'kode_pengajuan' => 'SRV-DEMO-005',
            'tanggal_ajuan' => now()->subDays(7)->toDateString(),
            'catatan_ajuan' => 'Ganti kaca spion yang retak.',
            'status' => 'ditolak',
            'disetujui_oleh' => $kepala?->id,
            'tanggal_acc' => now()->subDays(6)->toDateString(),
            'catatan_acc' => 'Ditolak: kaca spion retak masih bisa digunakan, ajukan lagi jika sudah parah.',
        ]);
    }

    private function createServis(Armada $armada, ?User $user, array $data): ?PengajuanServisArmada
    {
        return PengajuanServisArmada::firstOrCreate(
            ['kode_pengajuan' => $data['kode_pengajuan']],
            array_merge($data, [
                'armada_id' => $armada->id,
                'diajukan_oleh' => $user?->id,
            ])
        );
    }

    // ─────────────────────────── WORKSHOP TODO ────────────────────────────

    private function seedWorkshopTodo(Armada $armada, ?User $workshop, ?User $kepala): void
    {
        $todos = [
            [
                'judul' => 'Ganti Oli Mesin Unit B 9999 TEST',
                'deskripsi' => 'Oli mesin sudah mencapai 5.000 km. Ganti dengan oli 10W-40.',
                'jadwal_tipe' => 'harian',
                'jadwal_detail' => now()->toDateString(),
                'status' => 'belum_selesai',
            ],
            [
                'judul' => 'Cek Rem Belakang',
                'deskripsi' => 'Pengecekan ketebalan kampas rem belakang. Jika tipis, ganti.',
                'jadwal_tipe' => 'harian',
                'jadwal_detail' => now()->toDateString(),
                'status' => 'belum_selesai',
            ],
            [
                'judul' => 'Servis Radiator',
                'deskripsi' => 'Bersihkan radiator dan ganti coolant. Mesin sering overheat.',
                'jadwal_tipe' => 'harian',
                'jadwal_detail' => now()->subDay()->toDateString(),
                'status' => 'selesai',
            ],
            [
                'judul' => 'Pengecekan Ban Rutin',
                'deskripsi' => 'Cek tekanan ban dan kedalaman alur. Rotasi ban jika perlu.',
                'jadwal_tipe' => 'mingguan',
                'jadwal_detail' => 'Senin',
                'status' => 'belum_selesai',
            ],
            [
                'judul' => 'Servis Berkala 10.000 km',
                'deskripsi' => 'Servis lengkap: oli, filter, rem, dan cek umum.',
                'jadwal_tipe' => 'harian',
                'jadwal_detail' => now()->addDays(2)->toDateString(),
                'status' => 'belum_selesai',
            ],
        ];

        foreach ($todos as $todo) {
            WorkshopTodo::firstOrCreate(
                [
                    'armada_id' => $armada->id,
                    'judul' => $todo['judul'],
                ],
                array_merge($todo, [
                    'armada_id' => $armada->id,
                    'assigned_to' => $workshop?->id,
                    'created_by' => $kepala?->id,
                ])
            );
        }
    }

    private function karyawan(string $nama): ?Karyawan
    {
        return Karyawan::where('nama', $nama)->first();
    }
}
