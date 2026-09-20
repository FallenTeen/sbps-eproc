<?php

namespace Database\Seeders;

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\QCSample;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

/**
 * Data demo untuk pengujian aplikasi mobile di staging.
 *
 * Seeder ini MENAMBAH data transaksional (presensi, formulir lapangan,
 * sesi produksi, QC, tracking GPS) untuk user test yang sudah dibuat oleh
 * MobileTestUserSeeder, sehingga aplikasi langsung terlihat terisi saat demo:
 *
 *   - Presensi & formulir  : hari ini diisi PENUH (check-in → check-out +
 *                            formulir), plus beberapa hari riwayat.
 *   - Produksi             : riwayat sesi selesai + sesi aktif untuk mandor
 *                            & operator mesin test.
 *   - Quality Control      : sample slump test & uji tekan (lolos / menunggu
 *                            hasil / tidak lolos) pada sesi demo.
 *   - Tracking GPS         : jejak lokasi hari ini untuk role yang dipantau
 *                            (mandor), agar Owner/Admin bisa melihat user aktif.
 *
 * Idempotent (menggunakan firstOrCreate/cek keberadaan), aman dijalankan
 * berulang, dan tidak menghapus/menimpa data lain.
 *
 * Prasyarat: jalankan MobileTestUserSeeder terlebih dahulu (sudah tercantum
 * di DatabaseSeeder sebelum seeder ini).
 */
class MobileDemoDataSeeder extends Seeder
{
    use StagingOnly;

    /** Koordinat uji (sesuai Titik Kerja Uji Coba dari MobileTestUserSeeder). */
    private const TITIK_LAT = -6.2190;

    private const TITIK_LNG = 107.0010;

    public function run(): void
    {
        $this->assertNotProduction();

        $titik = Titik::where('nama', 'Titik Kerja Uji Coba')->first();

        if (! $titik) {
            $this->command?->warn('[MobileDemoData] Titik kerja uji coba tidak ditemukan. Jalankan MobileTestUserSeeder dulu.');

            return;
        }

        // Karyawan test (dari MobileTestUserSeeder)
        $sdm = $this->karyawan('Sari SDM Lapangan');
        $mandor = $this->karyawan('Budi Mandor Titik');
        $operator = $this->karyawan('Donny Operator Mesin');
        $driver = $this->karyawan('Eko Driver Armada');

        // Mesin/produk test (dari MobileTestUserSeeder)
        $mesinCrusher = MesinProduksi::where('nama', 'Stone Crusher Test-01')->first();
        $mesinBatching = MesinProduksi::where('nama', 'Batching Plant Test-01')->first();

        // ─────────────────────────── PRESENSI & FORMULIR ──────────────────────
        // Hari ini diisi penuh (selesai) + formulir, plus riwayat beberapa hari.
        if ($sdm) {
            $this->seedPresensiRiwayat($sdm->id, $titik->id, 4);
            $presensi = $this->seedPresensiHariIni($sdm->id, $titik->id);
            $this->seedFormulir($presensi, [
                'aktivitas_dilakukan' => 'Pendampingan operasional di titik kerja: pengecekan material, koordinasi tim, dan pencatatan volume harian.',
                'kondisi_area' => 'Kondisi area baik, cuaca cerah, material cukup.',
                'kendala' => 'Tidak ada kendala berarti.',
                'catatan_tambahan' => 'Siap untuk kegiatan besok.',
            ]);
        }

        // Mandor: presensi hari ini juga (diperlukan agar tracking punya acuan
        // check-in) + formulir demo.
        if ($mandor) {
            $this->seedPresensiRiwayat($mandor->id, $titik->id, 3);
            $this->seedPresensiHariIni($mandor->id, $titik->id);
        }

        // Driver armada: presensi hari ini (untuk pantauan kehadiran).
        if ($driver) {
            $this->seedPresensiRiwayat($driver->id, $titik->id, 2);
            $this->seedPresensiHariIni($driver->id, $titik->id);
        }

        // Operator Mesin: presensi hari ini
        if ($operator) {
            $this->seedPresensiRiwayat($operator->id, $titik->id, 3);
            $this->seedPresensiHariIni($operator->id, $titik->id);
        }

        // Karyawan role lainnya: presensi hari ini
        $ketua = $this->karyawan('Hendra Ketua Armada');
        if ($ketua) {
            $this->seedPresensiHariIni($ketua->id, $titik->id);
        }

        $workshopKaryawan = $this->karyawan('Wahyu Teknisi Workshop');
        if ($workshopKaryawan) {
            $this->seedPresensiHariIni($workshopKaryawan->id, $titik->id);
        }

        $inventoryKaryawan = $this->karyawan('Indra Staf Inventory');
        if ($inventoryKaryawan) {
            $this->seedPresensiHariIni($inventoryKaryawan->id, $titik->id);
        }

        // ──────────────────────────── PRODUKSI ────────────────────────────────
        if ($mesinCrusher && $mandor) {
            $this->seedProduksi($mesinCrusher, $mandor->id, $titik->id);
        }

        if ($mesinBatching && $operator) {
            $this->seedProduksi($mesinBatching, $operator->id, $titik->id);
        }

        // ─────────────────────────────── QC ───────────────────────────────────
        // Sampel QC dilampirkan ke sesi produksi demo terbaru yang sudah selesai (Mandor & Operator).
        if ($mesinCrusher && $mandor) {
            $session = ProductionSession::where('mesin_id', $mesinCrusher->id)
                ->where('operator_karyawan_id', $mandor->id)
                ->where('status', 'selesai')
                ->latest('selesai')
                ->first();

            if ($session) {
                $this->seedQc($session);
            }
        }

        if ($mesinBatching && $operator) {
            $sessionBatching = ProductionSession::where('mesin_id', $mesinBatching->id)
                ->where('operator_karyawan_id', $operator->id)
                ->where('status', 'selesai')
                ->latest('selesai')
                ->first();

            if ($sessionBatching) {
                $this->seedQc($sessionBatching);
            }
        }

        // ───────────────────────── TRACKING GPS ───────────────────────────────
        // Jejak lokasi hari ini untuk mandor (role yang dipantau), agar
        // Owner/Admin bisa melihat user aktif di modul Tracking.
        if ($mandor) {
            $this->seedTracking($mandor->id, $titik->id);
        }

        $this->command?->info('[MobileDemoData] Data demo mobile berhasil ditambahkan.');
    }

    // ─────────────────────────────── PRESENSI ───────────────────────────────

    private function seedPresensiRiwayat(string $karyawanId, string $titikId, int $days): void
    {
        for ($i = 1; $i <= $days; $i++) {
            $date = now()->subDays($i)->startOfDay();

            $checkIn = $date->copy()->addHours(6)->addMinutes(45 + $i);
            $checkOut = $checkIn->copy()->addHours(9)->addMinutes(20);
            if ($checkOut->gt($date->copy()->addHours(16)->addMinutes(15))) {
                $checkOut = $date->copy()->addHours(16)->addMinutes(15);
            }

            Presensi::firstOrCreate(
                ['karyawan_id' => $karyawanId, 'check_in' => $checkIn],
                [
                    'titik_id' => $titikId,
                    'check_in_lat' => self::TITIK_LAT,
                    'check_in_lng' => self::TITIK_LNG,
                    'check_out' => $checkOut,
                    'check_out_lat' => self::TITIK_LAT,
                    'check_out_lng' => self::TITIK_LNG,
                    'status_validasi' => 'valid',
                    'catatan_override' => null,
                    'device_id' => 'demo-device',
                ]
            );
        }
    }

    private function seedPresensiHariIni(string $karyawanId, string $titikId): Presensi
    {
        $presensi = Presensi::where('karyawan_id', $karyawanId)
            ->whereDate('check_in', now()->toDateString())
            ->first();

        if ($presensi) {
            return $presensi;
        }

        return Presensi::create([
            'karyawan_id' => $karyawanId,
            'titik_id' => $titikId,
            'check_in' => now()->startOfDay()->addHours(6)->addMinutes(45),
            'check_in_lat' => self::TITIK_LAT,
            'check_in_lng' => self::TITIK_LNG,
            'check_in_photo' => null,
            'check_in_photo_metadata' => ['latitude' => self::TITIK_LAT, 'longitude' => self::TITIK_LNG],
            'check_out' => now()->startOfDay()->addHours(16)->addMinutes(10),
            'check_out_lat' => self::TITIK_LAT,
            'check_out_lng' => self::TITIK_LNG,
            'check_out_photo' => null,
            'check_out_photo_metadata' => ['latitude' => self::TITIK_LAT, 'longitude' => self::TITIK_LNG],
            'status_validasi' => 'valid',
            'catatan_override' => null,
            'device_id' => 'demo-device',
        ]);
    }

    private function seedFormulir(?Presensi $presensi, array $data): void
    {
        if (! $presensi || ! $presensi->exists) {
            return;
        }

        FormulirLapangan::firstOrCreate(
            ['presensi_id' => $presensi->id],
            [
                'kondisi_area' => $data['kondisi_area'] ?? null,
                'aktivitas_dilakukan' => $data['aktivitas_dilakukan'],
                'kendala' => $data['kendala'] ?? null,
                'foto' => null,
                'catatan_tambahan' => $data['catatan_tambahan'] ?? null,
            ]
        );
    }

    // ─────────────────────────────── PRODUKSI ──────────────────────────────

    private function seedProduksi($mesin, string $operatorKaryawanId, string $titikId): void
    {
        // Riwayat sesi selesai untuk beberapa hari terakhir.
        for ($i = 1; $i <= 3; $i++) {
            $mulai = now()->subDays($i)->startOfDay()->addHours(7);
            $selesai = $mulai->copy()->addHours(6);

            ProductionSession::firstOrCreate(
                [
                    'operator_karyawan_id' => $operatorKaryawanId,
                    'mesin_id' => $mesin->id,
                    'mulai' => $mulai,
                ],
                [
                    'titik_id' => $titikId,
                    'produk_id' => $mesin->produk_id,
                    'client_uuid' => null,
                    'selesai' => $selesai,
                    'hasil_output' => round(80 + $i * 20, 2),
                    'status' => 'selesai',
                    'catatan' => 'Sesi produksi demo hari ke-'.$i.'.',
                ]
            );
        }

        // Pastikan ada sesi AKTIF hari ini agar modul "Sesi Aktif" terlihat.
        $active = ProductionSession::where('operator_karyawan_id', $operatorKaryawanId)
            ->where('mesin_id', $mesin->id)
            ->berjalan()
            ->first();

        if (! $active) {
            ProductionSession::create([
                'mesin_id' => $mesin->id,
                'titik_id' => $titikId,
                'produk_id' => $mesin->produk_id,
                'operator_karyawan_id' => $operatorKaryawanId,
                'client_uuid' => null,
                'mulai' => now()->subMinutes(50),
                'selesai' => null,
                'hasil_output' => null,
                'status' => 'berjalan',
                'catatan' => 'Sesi produksi aktif (demo).',
            ]);
        }
    }

    // ──────────────────────────────── QC ──────────────────────────────────

    private function seedQc(ProductionSession $session): void
    {
        // Sample slump yang sudah jadi (lolos) — uji tekan selesai.
        QCSample::firstOrCreate(
            [
                'production_session_id' => $session->id,
                'jenis_uji' => 'slump_test',
                'nilai_slump' => 12,
            ],
            [
                'client_uuid' => null,
                'tanggal_uji_tekan_rencana' => null,
                'hasil_uji_tekan' => 25.4,
                'status' => 'lolos',
                'catatan' => 'Slump sesuai spesifikasi 12±2 cm, hasil uji tekan memenuhi target.',
            ]
        );

        // Sample slump yang menunggu hasil uji tekan.
        QCSample::firstOrCreate(
            [
                'production_session_id' => $session->id,
                'jenis_uji' => 'slump_test',
                'nilai_slump' => 11,
            ],
            [
                'client_uuid' => null,
                'tanggal_uji_tekan_rencana' => now()->addDays(7)->toDateString(),
                'hasil_uji_tekan' => null,
                'status' => 'menunggu_hasil',
                'catatan' => 'Menunggu hasil uji tekan.',
            ]
        );
    }

    // ──────────────────────────── TRACKING GPS ─────────────────────────────

    private function seedTracking(string $karyawanId, string $titikId): void
    {
        $presensi = Presensi::where('karyawan_id', $karyawanId)
            ->whereDate('check_in', now()->toDateString())
            ->first();

        if (! $presensi) {
            return;
        }

        $already = MobileTrackingLocation::where('karyawan_id', $karyawanId)
            ->whereDate('recorded_at', now()->toDateString())
            ->exists();

        if ($already) {
            return;
        }

        // Simulasikan jejak konvo (bergeser sedikit dari titik) per ±25 menit
        // antara 07:00 s.d. 15:00 (sebelum cutoff tracking 18:00).
        $offset = 0.0;
        $start = now()->startOfDay()->addHours(7);

        foreach (range(0, 18) as $i) {
            $offset += 0.00002 * (($i % 2 === 0) ? 1 : -1);

            MobileTrackingLocation::create([
                'karyawan_id' => $karyawanId,
                'presensi_id' => $presensi->id,
                'latitude' => self::TITIK_LAT + $offset,
                'longitude' => self::TITIK_LNG + $offset * 0.5,
                'recorded_at' => $start->copy()->addMinutes($i * 25),
            ]);
        }
    }

    private function karyawan(string $nama): ?Karyawan
    {
        return Karyawan::where('nama', $nama)->first();
    }
}
