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
 * Seeder khusus untuk pengujian mobile (staging).
 *
 * Membuat user test dengan role "Mandor Titik" + data karyawan dan tugas
 * (penugasan ke Titik Kerja) lengkap, sehingga bisa login via aplikasi
 * mobile dan mencoba fitur:
 *  - Portal Presensi  : check-in/check-out, formulir lapangan, tracking
 *  - Portal Proyek     : produksi (mulai/selesai sesi), QC, tracking, dashboard
 *
 * Note role "Mandor Titik" dipilih karena di aplikasi mobile role ini
 * punya akses ke KEDUA portal (presensi & proyek) serta modul operasional
 * (produksi, qc, tracking, dashboard).
 *
 * Seeder ini idempotent (updateOrCreate), jadi aman dijalankan berulang.
 * Tidak menghapus data lain.
 */
class MobileTestUserSeeder extends Seeder
{
    /** Kredensial test yang dipakai untuk login via aplikasi mobile. */
    public const TEST_EMAIL = 'test.lapangan@example.com';
    public const TEST_PASSWORD = 'password';

    public function run(): void
    {
        // ─────────────────────── Unit Bisnis / master ───────────────────────
        $gcs = UnitBisnis::where('kode', 'GCS')->first();
        // created_by pada proyeks tidak boleh NULL → pakai user owner jika ada.
        $owner = User::where('email', 'owner@example.com')->first();

        // ────────────────────────────── PROYEK ─────────────────────────────
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

        // Koordinat titik uji (bebas, asalkan konsisten dengan yang dikirim
        // dari perangkat saat check-in agar status radius = valid).
        $titik = Titik::updateOrCreate(
            ['proyek_id' => $proyek->id, 'nama' => 'Titik Kerja Uji Coba'],
            [
                'latitude' => -6.21900000,
                'longitude' => 107.00100000,
                'radius_presensi_meter' => 150,
                'status' => 'aktif',
            ]
        );

        // ────────────────────────────── USER ─────────────────────────────
        $user = User::updateOrCreate(
            ['email' => self::TEST_EMAIL],
            [
                'name' => 'Test Lapangan',
                'nama_lengkap' => 'Test Karyawan Mobile Lapangan',
                'jabatan' => 'Mandor Titik',
                'password' => Hash::make(self::TEST_PASSWORD),
                'unit_bisnis_id' => $gcs?->id,
                'divisi' => 'Lapangan',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Role "Mandor Titik": akses portal presensi + proyek + modul operasional.
        $user->syncRoles(['Mandor Titik']);

        // ─────────────────────────── KARYAWAN ───────────────────────────
        $karyawan = Karyawan::updateOrCreate(
            ['nama' => 'Test Karyawan Mobile Lapangan'],
            [
                'user_id' => $user->id,
                'tipe' => 'harian',
                'jabatan' => 'Mandor Titik',
                'rate_gaji_pokok' => null,
                'rate_harian' => 175_000,
                'npwp' => '00.000.000.0-000.000',
                'no_bpjs_kesehatan' => '0000000000000',
                'no_bpjs_ketenagakerjaan' => '0000000000000',
                'status_ptkp' => 'TK/0',
                'status' => 'aktif',
            ]
        );

        // Amankan relasi user <-> karyawan (jika sebelumnya user_id kosong).
        if ($karyawan->user_id !== $user->id) {
            $karyawan->update(['user_id' => $user->id]);
        }

        // ─────────────── TUGAS / PENUGASAN KE TITIK KERJA ───────────────
        KaryawanTitikAssignment::updateOrCreate(
            [
                'karyawan_id' => $karyawan->id,
                'titik_id' => $titik->id,
            ],
            [
                'tanggal_mulai' => now()->startOfMonth()->toDateString(),
                'tanggal_selesai' => null,
                'status' => 'aktif',
            ]
        );

        // ─────────── MASTER PRODUKSI UNTUK MODUL OPERASIONAL ────────────
        // Gunakan unit bisnis GCS agar sejalan dengan titik uji.
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

        // Pastikan minimal satu bahan baku tersedia untuk pencatatan konsumsi
        // (opsional; hanya jika tabel bahan baku belum terisi).
        BahanBaku::firstOrCreate(
            ['kode' => 'BB-TEST-AGR'],
            ['nama' => 'Agregat Test', 'kategori' => 'bahan_baku', 'satuan' => 'ton', 'aktif' => true]
        );

        $this->command?->info(
            'User test mobile dibuat: '.self::TEST_EMAIL.' / '.self::TEST_PASSWORD
        );
    }
}
