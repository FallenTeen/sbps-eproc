<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder khusus pengujian aplikasi mobile (staging).
 *
 * Membuat beberapa user test dengan role berbeda + data karyawan & tugas
 * (penugasan ke Titik Kerja) lengkap, sehingga bisa login via aplikasi mobile
 * dan melihat dinamika antar-role:
 *
 *   Role                      Portal yang muncul     Modul proyek         Tugas (assignment)
 *   ------------------------  ---------------------  -------------------  ------------------
 *   Mandor Titik              Presensi + Proyek      produksi, qc,        ya
 *                                                     tracking, dashboard
 *   SDM Lapangan Kondisional  Presensi               (tidak ada)          ya
 *   Kontraktor                Proyek                 dashboard            tidak
 *   Owner                     Proyek                 produksi, qc,        tidak
 *                                                     tracking, dashboard,
 *                                                     keuangan (+ monitoring tracking)
 *   Admin Keuangan            Proyek                 tracking, dashboard, tidak
 *                                                     keuangan (+ monitoring tracking)
 *
 * Semua user memakai password yang sama (lihat TEST_PASSWORD) agar mudah
 * dicoba. Seeder ini idempotent (updateOrCreate), aman dijalankan berulang,
 * dan tidak menghapus/mengubah data lainnya.
 */
class MobileTestUserSeeder extends Seeder
{
    use StagingOnly;

    /** Kredensial login yang dipakai semua user test. */
    public const TEST_PASSWORD = 'password';

    public function run(): void
    {
        $this->assertNotProduction();

        // ─────────────────────── Unit Bisnis / master ───────────────────────
        $gcs = UnitBisnis::where('kode', 'GCS')->first();
        $cbp = UnitBisnis::where('kode', 'CBP')->first();
        // created_by pada proyeks tidak boleh NULL → pakai user owner jika ada.
        $owner = User::where('email', 'owner@real.com')->first();

        // ────────────────────────────── PROYEK/TITIK ────────────────────────
        $proyek = Proyek::updateOrCreate(
            ['kode_proyek' => 'PRJ-TEST-MOBILE'],
            [
                'unit_bisnis_id' => $gcs?->id,
                'nama' => 'Proyek Uji Coba Mobile',
                'tipe_proyek' => 'internal',
                'client' => null,
                'lokasi' => 'Lokasi Uji Coba, Cikarang',
                'tanggal_mulai' => now()->startOfMonth()->toDateString(),
                'tanggal_selesai_rencana' => now()->addMonths(6)->toDateString(),
                'status' => 'aktif',
                'catatan' => 'Data uji coba aplikasi mobile.',
                'created_by' => $owner?->id,
            ]
        );

        // Koordinat titik uji (bebas, asalkan konsisten dengan koordinat yang
        // dikirim dari perangkat saat check-in agar status radius = valid).
        $titik = Titik::updateOrCreate(
            ['proyek_id' => $proyek->id, 'nama' => 'Titik Kerja Uji Coba'],
            [
                'latitude' => -6.21900000,
                'longitude' => 107.00100000,
                'radius_presensi_meter' => 150,
                'status' => 'aktif',
            ]
        );

        // ─────────── MASTER PRODUKSI UNTUK MODUL OPERASIONAL ────────────
        // Dimiliki satu kali, dipakai oleh role lapangan yang punya modul produksi.
        $produk = Produk::updateOrCreate(
            ['unit_bisnis_id' => $gcs?->id, 'nama' => 'Agregat Kelas A (Test)'],
            ['kategori' => 'SPLIT', 'satuan_output' => 'ton', 'aktif' => true]
        );

        MesinProduksi::updateOrCreate(
            ['unit_bisnis_id' => $gcs?->id, 'nama' => 'Stone Crusher Test-01'],
            [
                'jenis' => 'crusher',
                'kapasitas' => '100 ton/jam',
                'status' => 'aktif',
                'titik_id' => $titik->id,
                'produk_id' => $produk->id,
                'biaya_per_jam' => 500_000,
            ]
        );

        // Pastikan minimal satu bahan baku tersedia untuk pencatatan konsumsi.
        BahanBaku::firstOrCreate(
            ['kode' => 'BB-TEST-AGR'],
            ['nama' => 'Agregat Test', 'kategori' => 'bahan_baku', 'satuan' => 'ton', 'aktif' => true]
        );

        // ────────────────────────────── USER TEST ───────────────────────────
        // Karena karyawans.user_id unik, tiap user punya karyawan sendiri.
        $createdKaryawanByEmail = [];
        $users = [
            [
                'email' => 'test.mandor@dummy.com',
                'name' => 'Test Mandor Titik',
                'nama_lengkap' => 'Budi Mandor Titik',
                'jabatan' => 'Mandor Titik',
                'role' => 'Mandor Titik',
                'divisi' => 'Lapangan',
                'karyawan_nama' => 'Budi Mandor Titik',
                'tipe' => 'harian',
                'rate_harian' => 175_000,
                'tugas' => true,
            ],
            [
                'email' => 'test.sdm@dummy.com',
                'name' => 'Test SDM Lapangan',
                'nama_lengkap' => 'Sari SDM Lapangan',
                'jabatan' => 'SDM Lapangan Kondisional',
                'role' => 'SDM Lapangan Kondisional',
                'divisi' => 'Lapangan',
                'karyawan_nama' => 'Sari SDM Lapangan',
                'tipe' => 'harian',
                'rate_harian' => 150_000,
                'tugas' => true,
            ],
            [
                'email' => 'test.kontraktor@dummy.com',
                'name' => 'Test Kontraktor',
                'nama_lengkap' => 'Perwakilan Kontraktor Client',
                'jabatan' => 'Kontraktor',
                'role' => 'Kontraktor',
                'divisi' => 'Eksternal',
                'karyawan_nama' => null,
                'tipe' => 'tetap',
                'rate_harian' => 0,
                'tugas' => false,
            ],
            [
                'email' => 'test.owner@dummy.com',
                'name' => 'Test Owner',
                'nama_lengkap' => 'Owner Pemilik Perusahaan',
                'jabatan' => 'Owner / Direktur',
                'role' => 'Owner',
                'divisi' => 'Manajemen',
                'karyawan_nama' => null,
                'tipe' => 'tetap',
                'rate_harian' => 0,
                'tugas' => false,
            ],
            [
                'email' => 'test.keuangan@dummy.com',
                'name' => 'Test Admin Keuangan',
                'nama_lengkap' => 'Ani Admin Keuangan',
                'jabatan' => 'Admin Keuangan',
                'role' => 'Admin Keuangan',
                'divisi' => 'Finance',
                'karyawan_nama' => null,
                'tipe' => 'tetap',
                'rate_harian' => 0,
                'tugas' => false,
            ],
            [
                'email' => 'test.operator.mesin@dummy.com',
                'name' => 'Test Operator Mesin',
                'nama_lengkap' => 'Donny Operator Mesin',
                'jabatan' => 'Operator Batching Plant',
                'role' => 'Operator Mesin',
                'divisi' => 'Produksi',
                'karyawan_nama' => 'Donny Operator Mesin',
                'tipe' => 'tetap',
                'rate_harian' => 0,
                'tugas' => true,
            ],
            [
                'email' => 'test.driver.armada@dummy.com',
                'name' => 'Test Driver Armada',
                'nama_lengkap' => 'Eko Driver Armada',
                'jabatan' => 'Driver Dump Truck',
                'role' => 'Driver Armada',
                'divisi' => 'Armada',
                'karyawan_nama' => 'Eko Driver Armada',
                'tipe' => 'borongan_rit',
                'rate_harian' => 150_000,
                'tugas' => true,
            ],
            [
                'email' => 'test.ketua.armada@dummy.com',
                'name' => 'Test Ketua Armada',
                'nama_lengkap' => 'Hendra Ketua Armada',
                'jabatan' => 'Ketua Divisi Armada',
                'role' => 'Ketua Armada',
                'divisi' => 'Armada',
                'karyawan_nama' => 'Hendra Ketua Armada',
                'tipe' => 'tetap',
                'rate_harian' => 0,
                'tugas' => false,
            ],
            [
                'email' => 'test.workshop@dummy.com',
                'name' => 'Test Workshop',
                'nama_lengkap' => 'Wahyu Teknisi Workshop',
                'jabatan' => 'Teknisi Workshop',
                'role' => 'Workshop',
                'divisi' => 'Armada',
                'karyawan_nama' => 'Wahyu Teknisi Workshop',
                'tipe' => 'tetap',
                'rate_harian' => 0,
                'tugas' => false,
            ],
            [
                'email' => 'test.inventory@dummy.com',
                'name' => 'Test Inventory',
                'nama_lengkap' => 'Indra Staf Inventory',
                'jabatan' => 'Staf Inventory',
                'role' => 'Inventory',
                'divisi' => 'Inventory',
                'karyawan_nama' => 'Indra Staf Inventory',
                'tipe' => 'tetap',
                'rate_harian' => 0,
                'tugas' => false,
            ],
        ];

        foreach ($users as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'nama_lengkap' => $data['nama_lengkap'],
                    'jabatan' => $data['jabatan'],
                    'password' => Hash::make(self::TEST_PASSWORD),
                    'unit_bisnis_id' => $gcs?->id,
                    'divisi' => $data['divisi'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            $user->syncRoles([$data['role']]);

            // Role lapangan (Mandor Titik / SDM) perlu Karyawan terhubung agar
            // endpoint presensi & produksi bisa dipanggil.
            if ($data['karyawan_nama']) {
                $karyawan = Karyawan::updateOrCreate(
                    ['nama' => $data['karyawan_nama']],
                    [
                        'user_id' => $user->id,
                        'tipe' => $data['tipe'],
                        'jabatan' => $data['jabatan'],
                        'rate_gaji_pokok' => null,
                        'rate_harian' => $data['rate_harian'] > 0 ? $data['rate_harian'] : null,
                        'npwp' => '00.000.000.0-000.000',
                        'no_bpjs_kesehatan' => '0000000000000',
                        'no_bpjs_ketenagakerjaan' => '0000000000000',
                        'status_ptkp' => 'TK/0',
                        'status' => 'aktif',
                    ]
                );
                if ($karyawan->user_id !== $user->id) {
                    $karyawan->update(['user_id' => $user->id]);
                }

                // Tugas (penugasan) ke Titik Kerja uji coba.
                if ($data['tugas']) {
                    KaryawanTitikAssignment::updateOrCreate(
                        ['karyawan_id' => $karyawan->id, 'titik_id' => $titik->id],
                        [
                            'tanggal_mulai' => now()->startOfMonth()->toDateString(),
                            'tanggal_selesai' => null,
                            'status' => 'aktif',
                        ]
                    );
                }

                $createdKaryawanByEmail[$user->email] = $karyawan;
            }
        }

        // ════════ USER: TEST KONTRAKTOR → PROYEK MILIKNYA (pivot) ═════════
        // Role eksternal Kontraktor discoping object-level via pivot proyek_user:
        // user hanya boleh melihat proyek yang ditautkan ke-nya. Buat proyek
        // kontrak_klien khusus untuk demo mobile supaya portal kontraktor punya
        // data dan sekaligus menunjukkan ia TIDAK melihat proyek klien lainnya.
        $testKontraktor = User::where('email', 'test.kontraktor@dummy.com')->first();
        if ($testKontraktor) {
            $proyekKtr = Proyek::updateOrCreate(
                ['kode_proyek' => 'PRJ-TEST-KTR'],
                [
                    'unit_bisnis_id' => $gcs?->id,
                    'nama' => 'Proyek Kontrak Test Kontraktor',
                    'tipe_proyek' => 'kontrak_klien',
                    'client' => 'Client Uji Coba',
                    'lokasi' => 'Cikarang, Jawa Barat',
                    'tanggal_mulai' => now()->startOfMonth()->toDateString(),
                    'tanggal_selesai_rencana' => now()->addMonths(6)->toDateString(),
                    'status' => 'aktif',
                    'catatan' => 'Proyek kontrak khusus demo portal kontraktor mobile.',
                    'created_by' => $owner?->id,
                ]
            );
            $proyekKtr->users()->syncWithoutDetaching([$testKontraktor->id]);
        }

        // ══════════════════ USER: OPERATOR MESIN & DRIVER ARMADA ═════════════
        // "Mengampu" sebuah unit kerja (mesin produksi / armada). Untuk mesin
        // tidak ada tabel assignment permanen → dibuatkan sesi produksi aktif
        // agar modul operasional menampilkan sesi milik operator tsb. Untuk
        // armada dipakai tabel persisten ArmadaDriver.
        $this->seedOperatorMesin(
            $createdKaryawanByEmail['test.operator.mesin@dummy.com'] ?? null,
            $cbp, $titik
        );
        $this->seedDriverArmada(
            $createdKaryawanByEmail['test.driver.armada@dummy.com'] ?? null,
            $gcs, $titik, $proyek
        );

        $emails = array_column($users, 'email');
        $this->command?->info(
            'User test mobile dibuat (password: '.self::TEST_PASSWORD.'): '
            .implode(', ', $emails)
        );
    }

    /**
     * Buat operator yang "mengampu" sebuah mesin produksi (Batching Plant CBP)
     * beserta master produk/bahan baku, dan seekan sesi produksi aktif miliknya.
     */
    private function seedOperatorMesin(?Karyawan $operator, ?UnitBisnis $cbp, Titik $titik): void
    {
        if (! $operator) {
            return;
        }

        $produk = Produk::updateOrCreate(
            ['unit_bisnis_id' => $cbp?->id, 'nama' => 'Beton K-225 (Test)'],
            ['kategori' => 'BETON_COR', 'satuan_output' => 'm3', 'aktif' => true]
        );

        $mesin = MesinProduksi::updateOrCreate(
            ['unit_bisnis_id' => $cbp?->id, 'nama' => 'Batching Plant Test-01'],
            [
                'jenis' => 'mixer_beton',
                'kapasitas' => '90 m³/jam',
                'status' => 'aktif',
                'titik_id' => $titik->id,
                'produk_id' => $produk->id,
                'biaya_per_jam' => 850_000,
            ]
        );

        // Pastikan bahan baku tersedia untuk pencatatan konsumsi (resep produksi).
        BahanBaku::firstOrCreate(
            ['kode' => 'BB-TEST-SEMEN'],
            ['nama' => 'Semen Test', 'kategori' => 'bahan_baku', 'satuan' => 'kg', 'aktif' => true]
        );

        // Sesi aktif milik operator agar terlihat "mengampu" mesin tsb.
        $existing = ProductionSession::where('operator_karyawan_id', $operator->id)
            ->where('mesin_id', $mesin->id)
            ->where('status', 'berjalan')
            ->exists();

        if (! $existing) {
            ProductionSession::create([
                'mesin_id' => $mesin->id,
                'titik_id' => $titik->id,
                'produk_id' => $produk->id,
                'operator_karyawan_id' => $operator->id,
                'client_uuid' => null,
                'mulai' => now()->subMinutes(45),
                'selesai' => null,
                'hasil_output' => null,
                'status' => 'berjalan',
                'catatan' => 'Sesi produksi test operator mesin.',
            ]);
        }
    }

    /**
     * Buat driver yang "mengampu" sebuah armada (dump truck GCS) via ArmadaDriver,
     * plus beberapa ritase demo untuk pengiriman milik driver tsb.
     */
    private function seedDriverArmada(
        ?Karyawan $driver,
        ?UnitBisnis $gcs,
        Titik $titik,
        ?Proyek $proyek
    ): void {
        if (! $driver) {
            return;
        }

        $armada = Armada::updateOrCreate(
            ['plat_nomor' => 'B 9999 TEST'],
            [
                'unit_bisnis_id' => $gcs?->id,
                'kode_unit' => 'GCS-TEST-DT-01',
                'jenis' => 'dump_truck',
                'model_tarif' => 'ritase',
                'tahun' => 2021,
                'kapasitas' => '8 m³',
                'titik_id' => $titik->id,
                'status' => 'aktif',
                'tanggal_mulai_pakai' => now()->subMonths(3)->toDateString(),
            ]
        );

        // Tutup assignment aktif sebelumnya ke armada ini jika ada, lalu assign.
        ArmadaDriver::where('armada_id', $armada->id)
            ->where('status', 'aktif')
            ->update(['status' => 'selesai', 'tanggal_selesai' => now()]);

        ArmadaDriver::updateOrCreate(
            ['armada_id' => $armada->id, 'karyawan_id' => $driver->id],
            [
                'tipe' => 'standby',
                'tanggal_mulai' => now()->subDays(7)->toDateString(),
                'tanggal_selesai' => null,
                'status' => 'aktif',
            ]
        );

        $this->seedDriverRitase($driver, $armada, $titik, $proyek, $gcs);
    }

    /**
     * Buat rute tarif + beberapa ritase demo untuk driver (modul Armada).
     */
    private function seedDriverRitase(
        Karyawan $driver,
        Armada $armada,
        Titik $titik,
        ?Proyek $proyek,
        ?UnitBisnis $gcs
    ): void {
        $rute = RuteTarif::updateOrCreate(
            ['unit_bisnis_id' => $gcs?->id, 'lokasi_asal' => 'Quarry Cikarang', 'lokasi_tujuan' => 'Proyek Uji Coba'],
            [
                'jarak_km' => 12.5,
                'tarif_per_rit' => 150_000,
                'indeks_liter_solar_per_km' => 0.4,
                'berlaku_dari' => now()->subMonths(6)->toDateString(),
                'berlaku_sampai' => null,
            ]
        );

        $materials = ['Agregat Kelas A', 'Batu Pecah 1-2', 'Pasir Urug'];
        $statuses = ['draft', 'disetujui', 'ditagih'];

        $existing = Ritase::where('driver_karyawan_id', $driver->id)
            ->where('armada_id', $armada->id)
            ->count();

        if ($existing >= 8) {
            return;
        }

        for ($i = 0; $i < 8; $i++) {
            $tanggal = now()->subDays($i);

            Ritase::updateOrCreate(
                [
                    'driver_karyawan_id' => $driver->id,
                    'armada_id' => $armada->id,
                    'tanggal' => $tanggal->toDateString(),
                ],
                [
                    'rute_tarif_id' => $rute->id,
                    'kategori' => 'angkut_material',
                    'material' => $materials[$i % count($materials)],
                    'jumlah_rit' => random_int(2, 8),
                    'tarif_per_rit_snapshot' => $rute->tarif_per_rit,
                    'proyek_id' => $proyek?->id,
                    'titik_id' => $titik->id,
                    'customer' => 'Client Uji Coba',
                    'status' => $statuses[$i % count($statuses)],
                    'catatan' => 'Ritase demo untuk uji modul Armada.',
                ]
            );
        }
    }
}
