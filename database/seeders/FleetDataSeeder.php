<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Data ARMADA ASLI perusahaan (master data real; aman untuk production).
 *
 * Sumber data:
 *   - docs/DATA ARMADA.csv      → dump truck (DT), dump truck tronton (DTT),
 *                                 self loader (SL) — unit bisnis GCS.
 *   - docs/Daftar kendaraan.csv → truck mixer (TM) — unit bisnis CBP
 *                                 (plat nomor belum terdata, dibiarkan null).
 *
 * Untuk tiap driver asli dibuat:
 *   - Karyawan (nama + alias/julukan + no_hp, tipe borongan_rit).
 *   - Akun User role 'Driver Armada' dengan email @real.com (password 'password').
 *   - ArmadaDriver (tipe standby, mulai hari ini).
 *   - ArmadaPenanggungJawab (peran utama, mulai hari ini).
 *
 * Kolom opsional (tahun, kapasitas, titik_id, tanggal_mulai_pakai) sengaja
 * dikosongkan agar diisi via aplikasi web nanti. Idempotent (updateOrCreate).
 */
class FleetDataSeeder extends Seeder
{
    private const PASSWORD = 'password';

    /** Nama driver → unit pemilik (untuk disambiguasi nama kembar lintas unit). */
    private array $driverOwner = [];

    public function run(): void
    {
        $gcs = UnitBisnis::where('kode', 'GCS')->firstOrFail();
        $cbp = UnitBisnis::where('kode', 'CBP')->firstOrFail();

        $count = count($this->armadaRows());

        foreach ($this->armadaRows() as $row) {
            $unitBisnis = $row['unit_bisnis'] === 'CBP' ? $cbp : $gcs;

            $armada = Armada::updateOrCreate(
                ['kode_unit' => $row['kode_unit']],
                [
                    'unit_bisnis_id' => $unitBisnis->id,
                    'plat_nomor' => $row['plat_nomor'],
                    'jenis' => $row['jenis'],
                    'tipe_unit' => 'armada_jalan',
                    'model_tarif' => 'ritase',
                    'status' => 'aktif',
                    'tahun' => null,
                    'kapasitas' => null,
                    'titik_id' => null,
                    'tanggal_mulai_pakai' => null,
                ]
            );

            if ($row['driver'] === null) {
                continue; // unit tanpa driver (mis. DT 18, DT 19, TM 08, TM 09, TM 121 B)
            }

            $karyawan = $this->resolveKaryawan($row['driver'], $unitBisnis, $row['jenis']);

            ArmadaDriver::updateOrCreate(
                ['armada_id' => $armada->id, 'karyawan_id' => $karyawan->id],
                [
                    'tipe' => 'standby',
                    'tanggal_mulai' => now()->toDateString(),
                    'tanggal_selesai' => null,
                    'status' => 'aktif',
                ]
            );

            ArmadaPenanggungJawab::updateOrCreate(
                ['armada_id' => $armada->id, 'karyawan_id' => $karyawan->id, 'peran' => 'utama'],
                [
                    'mulai_dari' => now()->toDateString(),
                    'sampai' => null,
                    'alasan' => null,
                ]
            );
        }

        $this->command?->info("[FleetDataSeeder] {$count} armada real + driver asli tersinkron.");
    }

    /**
     * Buat/ambil Karyawan driver asli + akun User role 'Driver Armada'.
     * Nama kembar lintas unit (mis. AGUS di GCS & CBP) diberi akhiran kode unit.
     */
    private function resolveKaryawan(array $driver, UnitBisnis $unitBisnis, string $jenis): Karyawan
    {
        $base = trim($driver['nama']);
        $nama = $base;

        $ownerId = $this->driverOwner[$base] ?? null;
        if ($ownerId === null) {
            $existing = Karyawan::where('nama', $base)->first();
            if ($existing) {
                $existingOwner = $existing->user?->unit_bisnis_id;
                if ($existingOwner !== null && (string) $existingOwner !== (string) $unitBisnis->id) {
                    $nama = $base.' ('.$unitBisnis->kode.')';
                }
            }
        } elseif ($ownerId !== $unitBisnis->id) {
            $nama = $base.' ('.$unitBisnis->kode.')';
        }

        $this->driverOwner[$base] = $unitBisnis->id;

        $email = Str::slug($nama).'@real.com';
        $jabatan = $this->jabatanFor($jenis);

        $user = User::where('email', $email)->first();
        if (! $user) {
            $user = User::create([
                'name' => $nama,
                'nama_lengkap' => $nama,
                'jabatan' => $jabatan,
                'email' => $email,
                'password' => Hash::make(self::PASSWORD),
                'email_verified_at' => now(),
                'unit_bisnis_id' => $unitBisnis->id,
                'divisi' => 'Armada',
                'is_active' => true,
            ]);
            $user->syncRoles(['Driver Armada']);
        }

        return Karyawan::updateOrCreate(
            ['nama' => $nama],
            [
                'user_id' => $user->id,
                'tipe' => 'borongan_rit',
                'jabatan' => $jabatan,
                'rate_gaji_pokok' => null,
                'rate_harian' => null,
                'no_hp' => $driver['no_hp'] ?? null,
                'alias' => $driver['alias'] ?? null,
                'status' => 'aktif',
            ]
        );
    }

    private function jabatanFor(string $jenis): string
    {
        return match ($jenis) {
            'dump_truck_tronton' => 'Driver Dump Truck Tronton',
            'self_loader' => 'Driver Self Loader',
            'truck_molen' => 'Driver Truck Mixer',
            default => 'Driver Dump Truck',
        };
    }

    /** @return array<int, array<string, mixed>> */
    private function armadaRows(): array
    {
        return [
            // ── MOBIL DUMP TRUCK (GCS) ──
            ['plat_nomor' => 'AB 8054 ZR', 'kode_unit' => 'DT 01', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'NOVI', 'alias' => null, 'no_hp' => '0831-9709-3285']],
            ['plat_nomor' => 'AB 8056 ZR', 'kode_unit' => 'DT 02', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'SUPRI', 'alias' => 'ACUN', 'no_hp' => '0822-9856-3278']],
            ['plat_nomor' => 'AB 8057 ZR', 'kode_unit' => 'DT 03', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'SUDIR', 'alias' => null, 'no_hp' => '0882-2961-8620']],
            ['plat_nomor' => 'AB 8058 ZR', 'kode_unit' => 'DT 04', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'KUNTO', 'alias' => null, 'no_hp' => '0858-7706-5240']],
            ['plat_nomor' => 'AB 8059 ZR', 'kode_unit' => 'DT 05', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'YATNO', 'alias' => null, 'no_hp' => '0823-2809-2686']],
            ['plat_nomor' => 'AB 8060 ZR', 'kode_unit' => 'DT 06', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'NARTUM', 'alias' => null, 'no_hp' => '0852-2889-5148']],
            ['plat_nomor' => 'AB 8061 ZR', 'kode_unit' => 'DT 07', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'NARSONO', 'alias' => 'SAMSON', 'no_hp' => '0813-9315-8999']],
            ['plat_nomor' => 'AB 8062 ZR', 'kode_unit' => 'DT 08', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'TONO', 'alias' => null, 'no_hp' => '0896-6971-2271']],
            ['plat_nomor' => 'AB 8063 ZR', 'kode_unit' => 'DT 09', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'TEGUH', 'alias' => null, 'no_hp' => '0822-2075-0965']],
            ['plat_nomor' => 'AB 8064 ZR', 'kode_unit' => 'DT 10', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'SARTAM', 'alias' => 'BLENGGO', 'no_hp' => '0812-2877-3164']],
            ['plat_nomor' => 'R 8699 HR', 'kode_unit' => 'DT 11', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'AGUS', 'alias' => null, 'no_hp' => '0851-6816-2169']],
            ['plat_nomor' => 'R 8698 HR', 'kode_unit' => 'DT 12', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'HERMADI', 'alias' => 'BOEK', 'no_hp' => '0812-2649-0438']],
            ['plat_nomor' => 'R 8702 HR', 'kode_unit' => 'DT 13', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'LUDI', 'alias' => null, 'no_hp' => '0812-1547-9722']],
            ['plat_nomor' => 'R 8071 HR', 'kode_unit' => 'DT 14', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'RAHMAT', 'alias' => null, 'no_hp' => '0857-2634-0560']],
            ['plat_nomor' => 'R 8697 HR', 'kode_unit' => 'DT 15', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'NASRUL', 'alias' => null, 'no_hp' => '0812-8901-3809']],
            ['plat_nomor' => 'R 8695 HR', 'kode_unit' => 'DT 16', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'SALIKUN', 'alias' => null, 'no_hp' => '0822-2016-1050']],
            ['plat_nomor' => 'R 8696 HR', 'kode_unit' => 'DT 17', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'RUSYANTO', 'alias' => null, 'no_hp' => '0813-2759-3968']],
            ['plat_nomor' => 'A 8826 ZS', 'kode_unit' => 'DT 18', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => null],
            ['plat_nomor' => 'R 8011 OA', 'kode_unit' => 'DT 19', 'jenis' => 'dump_truck', 'unit_bisnis' => 'GCS', 'driver' => null],

            // ── MOBIL DUMP TRUCK TRONTON (GCS) ──
            ['plat_nomor' => 'R 8704 HR', 'kode_unit' => 'DTT 01', 'jenis' => 'dump_truck_tronton', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'NARSO', 'alias' => null, 'no_hp' => '0852-9000-6588']],
            ['plat_nomor' => 'R 8703 HR', 'kode_unit' => 'DTT 02', 'jenis' => 'dump_truck_tronton', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'EKO', 'alias' => null, 'no_hp' => '0813-9115-3828']],
            ['plat_nomor' => 'R 8693 KR', 'kode_unit' => 'DTT 03', 'jenis' => 'dump_truck_tronton', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'YANTO', 'alias' => null, 'no_hp' => '0812-2779-3588']],
            ['plat_nomor' => 'D 6958 UB', 'kode_unit' => 'DTT 04', 'jenis' => 'dump_truck_tronton', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'TIKNO', 'alias' => null, 'no_hp' => '0852-2510-1988']],
            ['plat_nomor' => 'AD 8939 CU', 'kode_unit' => 'DT ENGKEL', 'jenis' => 'dump_truck_tronton', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'SUNARTO', 'alias' => null, 'no_hp' => '0852-2510-1988']],

            // ── MOBIL SELF LOADER (GCS) ──
            ['plat_nomor' => 'B 9072 UIQ', 'kode_unit' => 'SL 01', 'jenis' => 'self_loader', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'NONO', 'alias' => null, 'no_hp' => '0858-4815-5960']],
            ['plat_nomor' => 'R 8048 FR', 'kode_unit' => 'SL 02', 'jenis' => 'self_loader', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'TOLET', 'alias' => null, 'no_hp' => '0813-9233-2349']],
            ['plat_nomor' => 'R 8236 ER', 'kode_unit' => 'SL 03', 'jenis' => 'self_loader', 'unit_bisnis' => 'GCS', 'driver' => ['nama' => 'TARISUN', 'alias' => null, 'no_hp' => '0853-2618-3433']],

            // ── MOBIL TRUCK MIXER (CBP) — plat belum terdata di CSV ──
            ['plat_nomor' => null, 'kode_unit' => 'TM 01 C', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'NADOM', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 02 C', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'DULKARIM', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 03 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'KAMTO', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 04 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'AGUS', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 05 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'GINO', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 010 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'SABAR', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 121 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => null],
            ['plat_nomor' => null, 'kode_unit' => 'TM 122 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'WIWIT', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 125 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'HARTO', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 126 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'DAYAT', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM PP 19 B', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => ['nama' => 'OMPONG', 'alias' => null, 'no_hp' => null]],
            ['plat_nomor' => null, 'kode_unit' => 'TM 09', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => null],
            ['plat_nomor' => null, 'kode_unit' => 'TM 08', 'jenis' => 'truck_molen', 'unit_bisnis' => 'CBP', 'driver' => null],
        ];
    }
}
