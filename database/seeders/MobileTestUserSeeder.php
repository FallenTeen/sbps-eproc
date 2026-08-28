<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Produk;
use App\Models\User;
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
    /** Kredensial login yang dipakai semua user test. */
    public const TEST_PASSWORD = 'password';

    public function run(): void
    {
        // ─────────────────────── Unit Bisnis / master ───────────────────────
        $gcs = UnitBisnis::where('kode', 'GCS')->first();
        // created_by pada proyeks tidak boleh NULL → pakai user owner jika ada.
        $owner = User::where('email', 'owner@example.com')->first();

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
        $users = [
            [
                'email' => 'test.mandor@example.com',
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
                'email' => 'test.sdm@example.com',
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
                'email' => 'test.kontraktor@example.com',
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
                'email' => 'test.owner@example.com',
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
                'email' => 'test.keuangan@example.com',
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
            }
        }

        $this->command?->info(
            'User test mobile dibuat (password: '.self::TEST_PASSWORD.'): '
            .implode(', ', array_column($users, 'email'))
        );
    }
}
