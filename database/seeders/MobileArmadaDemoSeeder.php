<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use App\Domain\Fleet\Models\ChecklistSerahTerima;
use App\Domain\Fleet\Models\ChecklistSerahTerimaDetail;
use App\Domain\Fleet\Models\HelperArmada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\Models\PresensiHelper;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Data demo armada untuk pengujian aplikasi mobile di staging.
 *
 * Seeder ini MENAMBAH data armada transaksional (checklist harian, ODO awal,
 * pengajuan servis, workshop todo, helper presensi, checklist serah terima)
 * untuk user test yang sudah dibuat oleh MobileTestUserSeeder:
 *
 *   - Master Armada     : Dump truck, mixer beton, excavator uji coba.
 *   - Helper Presensi   : Helper aktif + riwayat presensi helper.
 *   - Checklist Harian  : Checklist hari ini (terisi & belum) + riwayat.
 *   - ODO Awal Proyek   : Catatan ODO awal untuk armada di titik uji coba.
 *   - Pengajuan Servis  : Lengkap semua status (diajukan, disetujui, dikerjakan,
 *                         selesai, ditolak) untuk pengujian alur approval.
 *   - Workshop Todo     : Antrian tugas perbaikan untuk teknisi workshop.
 *   - Checklist Major   : Serah terima sewa alat (berangkat & kembali).
 *
 * Idempotent (menggunakan firstOrCreate/updateOrCreate), aman dijalankan berulang.
 */
class MobileArmadaDemoSeeder extends Seeder
{
    public function run(): void
    {
        $gcs = UnitBisnis::where('kode', 'GCS')->first();
        $cbp = UnitBisnis::where('kode', 'CBP')->first();
        $titik = Titik::where('nama', 'Titik Kerja Uji Coba')->first();
        $proyek = Proyek::where('kode_proyek', 'PRJ-TEST-MOBILE')->first();

        $driver = $this->karyawan('Eko Driver Armada');
        $driverUser = User::where('email', 'test.driver.armada@example.com')->first() ?? $driver?->user;
        $owner = User::where('email', 'test.owner@example.com')->first() ?? User::where('email', 'owner@example.com')->first();
        $workshop = User::where('email', 'test.workshop@example.com')->first() ?? User::where('email', 'workshop@example.com')->first();
        $kepala = User::where('email', 'test.ketua.armada@example.com')->first() ?? User::where('email', 'ketua.armada@example.com')->first();

        // ──────────────────────── MASTER ARMADA TAMBAHAN ────────────────────────
        $armada1 = Armada::updateOrCreate(
            ['plat_nomor' => 'B 9999 TEST'],
            [
                'unit_bisnis_id' => $gcs?->id,
                'kode_unit' => 'GCS-TEST-DT-01',
                'jenis' => 'dump_truck',
                'tipe_unit' => 'armada_jalan',
                'model_tarif' => 'ritase',
                'tahun' => 2021,
                'kapasitas' => '8 m³',
                'titik_id' => $titik?->id,
                'status' => 'aktif',
                'tanggal_mulai_pakai' => now()->subMonths(3)->toDateString(),
            ]
        );

        $armada2 = Armada::updateOrCreate(
            ['plat_nomor' => 'B 9998 TEST'],
            [
                'unit_bisnis_id' => $cbp?->id,
                'kode_unit' => 'CBP-TEST-TM-01',
                'jenis' => 'truck_molen',
                'tipe_unit' => 'armada_jalan',
                'model_tarif' => 'sewa_jam',
                'tahun' => 2022,
                'kapasitas' => '7 m³',
                'titik_id' => $titik?->id,
                'status' => 'aktif',
                'tanggal_mulai_pakai' => now()->subMonths(2)->toDateString(),
            ]
        );

        $armada3 = Armada::updateOrCreate(
            ['plat_nomor' => 'B 9997 TEST'],
            [
                'unit_bisnis_id' => $gcs?->id,
                'kode_unit' => 'GCS-TEST-EX-01',
                'jenis' => 'alat_berat',
                'tipe_unit' => 'alat_berat',
                'model_tarif' => 'sewa_jam',
                'tahun' => 2020,
                'kapasitas' => 'Excavator PC200',
                'titik_id' => $titik?->id,
                'status' => 'aktif',
                'tanggal_mulai_pakai' => now()->subMonths(6)->toDateString(),
            ]
        );

        // Assign driver ke B 9999 TEST
        if ($driver) {
            ArmadaDriver::updateOrCreate(
                ['armada_id' => $armada1->id, 'karyawan_id' => $driver->id],
                [
                    'tipe' => 'standby',
                    'tanggal_mulai' => now()->subDays(30)->toDateString(),
                    'tanggal_selesai' => null,
                    'status' => 'aktif',
                ]
            );
        }

        // ──────────────────────── HELPER ARMADA & PRESENSI ───────────────────────
        $this->seedHelperArmada($armada1, $driverUser);

        // ──────────────────────── CHECKLIST HARIAN ──────────────────────────────
        $this->seedChecklist($armada1, $driver);

        // ──────────────────────── ODO AWAL PROYEK ───────────────────────────────
        $this->seedOdoAwal($armada1, $proyek, $driver);

        // ──────────────────────── PENGAJUAN SERVIS ──────────────────────────────
        $this->seedServis($armada1, $driverUser ?? $owner, $owner, $kepala);

        // ──────────────────────── WORKSHOP TODO ─────────────────────────────────
        $this->seedWorkshopTodo($armada1, $workshop, $kepala);

        // ──────────────────────── CHECKLIST MAJOR (SERAH TERIMA) ─────────────────
        $this->seedChecklistSerahTerima($armada3, $proyek, $kepala ?? $owner);

        $this->command?->info('[MobileArmadaDemo] Data armada demo mobile berhasil ditambahkan.');
    }

    // ─────────────────────────── HELPER ARMADA ─────────────────────────────

    private function seedHelperArmada(Armada $armada, ?User $driverUser): void
    {
        $helper = HelperArmada::firstOrCreate(
            ['armada_id' => $armada->id, 'nama' => 'Agus Helper'],
            [
                'no_hp' => '081234567890',
                'honor' => 100_000,
                'durasi_mulai' => now()->subDays(14)->toDateString(),
                'durasi_selesai' => null,
                'status' => 'aktif',
                'created_by' => $driverUser?->id,
            ]
        );

        $helper2 = HelperArmada::firstOrCreate(
            ['armada_id' => $armada->id, 'nama' => 'Joko Helper'],
            [
                'no_hp' => '081234567891',
                'honor' => 100_000,
                'durasi_mulai' => now()->subDays(7)->toDateString(),
                'durasi_selesai' => null,
                'status' => 'aktif',
                'created_by' => $driverUser?->id,
            ]
        );

        // Presensi helper hari ini
        PresensiHelper::firstOrCreate(
            [
                'helper_armada_id' => $helper->id,
                'tanggal' => now()->toDateString(),
            ],
            [
                'check_in' => now()->startOfDay()->addHours(7)->addMinutes(15),
                'check_out' => null,
                'dicatat_oleh' => $driverUser?->id,
            ]
        );

        // Presensi helper riwayat kemarin
        PresensiHelper::firstOrCreate(
            [
                'helper_armada_id' => $helper->id,
                'tanggal' => now()->subDay()->toDateString(),
            ],
            [
                'check_in' => now()->subDay()->startOfDay()->addHours(7)->addMinutes(10),
                'check_out' => now()->subDay()->startOfDay()->addHours(16)->addMinutes(30),
                'dicatat_oleh' => $driverUser?->id,
            ]
        );
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
                'status' => 'selesai',
                'solar_liter' => 45.5,
                'solar_harga_rp' => 309_400,
                'odo_pagi' => 12450.0,
                'odo_sore' => 12530.0,
                'jam_mulai_operasi' => '07:00',
                'jam_selesai_operasi' => '16:00',
                'hm_odo' => 8.0,
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
                    'status' => 'selesai',
                    'solar_liter' => 40 + $i * 2,
                    'solar_harga_rp' => (40 + $i * 2) * 6800,
                    'odo_pagi' => 12400 + $i * 15,
                    'odo_sore' => 12400 + $i * 15 + 85,
                    'jam_mulai_operasi' => '06:'.str_pad((string) (45 + $i), 2, '0', STR_PAD_LEFT),
                    'jam_selesai_operasi' => '16:10',
                    'hm_odo' => 8.5,
                ]
            );
        }
    }

    // ────────────────────────── ODO AWAL PROYEK ──────────────────────────

    private function seedOdoAwal(Armada $armada, ?Proyek $proyek, ?Karyawan $driver): void
    {
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
        User $submitter,
        ?User $owner,
        ?User $kepala
    ): void {
        // Servis 1: Menunggu persetujuan (diajukan oleh driver) -> UNTUK PENGUJIAN APPROVAL KETUA ARMADA
        $this->createServis($armada, $submitter, [
            'kode_pengajuan' => 'SRV-DEMO-001',
            'tanggal_ajuan' => now()->toDateString(),
            'catatan_ajuan' => 'Mesin mengeluarkan asap putih saat akselerasi. Perlu pengecekan radiator dan ganti oli mesin.',
            'status' => 'diajukan',
            'butuh_sparepart' => true,
        ]);

        // Servis 2: Disetujui, menunggu pengerjaan
        $this->createServis($armada, $submitter, [
            'kode_pengajuan' => 'SRV-DEMO-002',
            'tanggal_ajuan' => now()->subDays(3)->toDateString(),
            'catatan_ajuan' => 'Ganti oli mesin + filter udara. Sudah 5.000 km sejak servis terakhir.',
            'status' => 'disetujui',
            'disetujui_oleh' => $kepala?->id ?? $owner?->id,
            'tanggal_acc' => now()->subDays(2)->toDateString(),
            'catatan_acc' => 'Disetujui. Silakan dijadwalkan pengerjaan oleh tim workshop.',
            'butuh_sparepart' => false,
        ]);

        // Servis 3: Sedang dikerjakan oleh workshop
        $this->createServis($armada, $submitter, [
            'kode_pengajuan' => 'SRV-DEMO-003',
            'tanggal_ajuan' => now()->subDays(5)->toDateString(),
            'catatan_ajuan' => 'Ban belakang kiri bocor & aus parah, perlu penggantian ban baru.',
            'status' => 'dikerjakan',
            'disetujui_oleh' => $kepala?->id ?? $owner?->id,
            'tanggal_acc' => now()->subDays(4)->toDateString(),
            'tanggal_mulai_kerja' => now()->subDays(2)->toDateString(),
            'catatan_pengerjaan' => 'Sedang proses penggantian ban dan balancing.',
            'butuh_sparepart' => true,
        ]);

        // Servis 4: Selesai (dengan rincian sparepart & biaya)
        $servis4 = $this->createServis($armada, $submitter, [
            'kode_pengajuan' => 'SRV-DEMO-004',
            'tanggal_ajuan' => now()->subDays(10)->toDateString(),
            'catatan_ajuan' => 'Servis berkala 10.000 km. Ganti oli, filter oli, filter solar, dan cek kampas rem.',
            'status' => 'selesai',
            'disetujui_oleh' => $kepala?->id ?? $owner?->id,
            'tanggal_acc' => now()->subDays(9)->toDateString(),
            'tanggal_mulai_kerja' => now()->subDays(8)->toDateString(),
            'tanggal_selesai_kerja' => now()->subDays(7)->toDateString(),
            'catatan_pengerjaan' => 'Servis selesai dilakukan. Seluruh komponen dicek dalam kondisi prima.',
            'butuh_sparepart' => true,
            'total_biaya' => 2_500_000,
        ]);

        if ($servis4) {
            PengajuanServisSparepart::firstOrCreate(
                [
                    'pengajuan_servis_armada_id' => $servis4->id,
                    'nama_item' => 'Oli Mesin Heavy Duty 15W-40',
                ],
                [
                    'jumlah' => 8,
                    'satuan' => 'liter',
                    'nominal' => 720_000,
                    'status' => 'terpakai',
                ]
            );
            PengajuanServisSparepart::firstOrCreate(
                [
                    'pengajuan_servis_armada_id' => $servis4->id,
                    'nama_item' => 'Filter Oli',
                ],
                [
                    'jumlah' => 1,
                    'satuan' => 'pcs',
                    'nominal' => 250_000,
                    'status' => 'terpakai',
                ]
            );
            PengajuanServisSparepart::firstOrCreate(
                [
                    'pengajuan_servis_armada_id' => $servis4->id,
                    'nama_item' => 'Filter Solar',
                ],
                [
                    'jumlah' => 1,
                    'satuan' => 'pcs',
                    'nominal' => 180_000,
                    'status' => 'terpakai',
                ]
            );
        }

        // Servis 5: Ditolak (dengan catatan penolakan)
        $this->createServis($armada, $submitter, [
            'kode_pengajuan' => 'SRV-DEMO-005',
            'tanggal_ajuan' => now()->subDays(7)->toDateString(),
            'catatan_ajuan' => 'Ganti kaca spion kanan yang sedikit retak.',
            'status' => 'ditolak',
            'disetujui_oleh' => $kepala?->id ?? $owner?->id,
            'tanggal_acc' => now()->subDays(6)->toDateString(),
            'catatan_acc' => 'Ditolak: Retak minor tidak mengganggu pandangan operasional. Ajukan kembali saat jadwal servis berkala.',
        ]);
    }

    private function createServis(Armada $armada, User $user, array $data): ?PengajuanServisArmada
    {
        return PengajuanServisArmada::firstOrCreate(
            ['kode_pengajuan' => $data['kode_pengajuan']],
            array_merge($data, [
                'armada_id' => $armada->id,
                'diajukan_oleh' => $user->id,
            ])
        );
    }

    // ─────────────────────────── WORKSHOP TODO ────────────────────────────

    private function seedWorkshopTodo(Armada $armada, ?User $workshop, ?User $kepala): void
    {
        $todos = [
            [
                'judul' => 'Ganti Oli Mesin Unit B 9999 TEST',
                'deskripsi' => 'Oli mesin sudah mencapai 5.000 km. Ganti dengan oli heavy duty 15W-40.',
                'jadwal_tipe' => 'harian',
                'jadwal_detail' => now()->toDateString(),
                'status' => 'belum_selesai',
            ],
            [
                'judul' => 'Pengecekan Tekanan & Alur Ban',
                'deskripsi' => 'Cek tekanan 6 roda dan ketebalan alur ban. Rotasi jika diperlukan.',
                'jadwal_tipe' => 'mingguan',
                'jadwal_detail' => 'Senin',
                'status' => 'belum_selesai',
            ],
            [
                'judul' => 'Cek Sistem Pengereman & Kampas Rem',
                'deskripsi' => 'Pengecekan minyak rem dan ketebalan kampas rem depan & belakang.',
                'jadwal_tipe' => 'harian',
                'jadwal_detail' => now()->toDateString(),
                'status' => 'belum_selesai',
            ],
            [
                'judul' => 'Pembersihan Radiator & Cek Coolant',
                'deskripsi' => 'Kuras air radiator dan isi ulang dengan coolant anti-karat.',
                'jadwal_tipe' => 'harian',
                'jadwal_detail' => now()->subDay()->toDateString(),
                'status' => 'selesai',
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

    // ──────────────────────── CHECKLIST SERAH TERIMA ──────────────────────

    private function seedChecklistSerahTerima(Armada $armada, ?Proyek $proyek, ?User $user): void
    {
        if (! $proyek) {
            return;
        }

        $sewa = SewaAlatJam::firstOrCreate(
            [
                'armada_id' => $armada->id,
                'proyek_id' => $proyek->id,
                'tanggal' => now()->subDays(5)->toDateString(),
            ],
            [
                'penyewa_eksternal' => 'PT Karya Cikarang Mandiri',
                'lokasi_pekerjaan' => 'Area Galian Blok A',
                'harga_per_jam_snapshot' => 350_000,
                'hm_awal' => 1500.0,
                'hm_akhir' => 1540.0,
                'jumlah_jam' => 40,
                'status' => 'disetujui',
                'catatan' => 'Sewa alat berat excavator untuk proyek pematangan lahan.',
            ]
        );

        // Checklist Berangkat
        $cstBerangkat = ChecklistSerahTerima::firstOrCreate(
            [
                'sewa_alat_jam_id' => $sewa->id,
                'tipe' => 'berangkat',
            ],
            [
                'armada_id' => $armada->id,
                'data_penyewa' => [
                    'nama_perusahaan' => 'PT Karya Cikarang Mandiri',
                    'penanggung_jawab' => 'Ir. Bambang Wijaya',
                    'no_hp' => '081198765432',
                    'alamat' => 'Jl. Industri No. 45, Cikarang',
                ],
                'odo_atau_hm' => 1500.0,
                'foto_kondisi' => [],
                'catatan' => 'Kondisi alat berangkat dalam keadaan bersih dan siap kerja.',
                'ditandatangani_oleh' => 'Ir. Bambang Wijaya',
                'tanggal' => now()->subDays(5)->toDateString(),
                'dicatat_oleh_id' => $user?->id,
            ]
        );

        foreach (ChecklistSerahTerima::DEFAULT_ITEMS as $item) {
            ChecklistSerahTerimaDetail::firstOrCreate(
                [
                    'checklist_serah_terima_armada_id' => $cstBerangkat->id,
                    'item' => $item,
                ],
                [
                    'kondisi' => 'baik',
                    'catatan' => 'Kondisi prima.',
                ]
            );
        }

        // Checklist Kembali
        $cstKembali = ChecklistSerahTerima::firstOrCreate(
            [
                'sewa_alat_jam_id' => $sewa->id,
                'tipe' => 'kembali',
            ],
            [
                'armada_id' => $armada->id,
                'data_penyewa' => [
                    'nama_perusahaan' => 'PT Karya Cikarang Mandiri',
                    'penanggung_jawab' => 'Ir. Bambang Wijaya',
                    'no_hp' => '081198765432',
                    'alamat' => 'Jl. Industri No. 45, Cikarang',
                ],
                'odo_atau_hm' => 1540.0,
                'foto_kondisi' => [],
                'catatan' => 'Alat kembali dalam kondisi baik. Total pemakaian 40 jam.',
                'ditandatangani_oleh' => 'Ir. Bambang Wijaya',
                'tanggal' => now()->subDay()->toDateString(),
                'dicatat_oleh_id' => $user?->id,
            ]
        );

        foreach (ChecklistSerahTerima::DEFAULT_ITEMS as $item) {
            ChecklistSerahTerimaDetail::firstOrCreate(
                [
                    'checklist_serah_terima_armada_id' => $cstKembali->id,
                    'item' => $item,
                ],
                [
                    'kondisi' => 'baik',
                    'catatan' => 'Pemeriksaan pasca-sewa selesai.',
                ]
            );
        }
    }

    private function karyawan(string $nama): ?Karyawan
    {
        return Karyawan::where('nama', $nama)->first();
    }
}
