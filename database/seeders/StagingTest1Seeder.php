<?php

namespace Database\Seeders;

use App\Domain\Finance\Models\PembayaranKlien;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder SESI UJI COBA MODUL FLEET oleh USER ASLI (staging).
 *
 * Menyiapkan basis data yang IDENTIK dengan StagingSeeder — data master asli
 * (unit bisnis, user esensial, armada + driver asli dari FleetDataSeeder,
 * proyek & titik termasuk Kantor Pusat) plus data dummy untuk role NON-fleet
 * (finance, HR, procurement, produksi, presensi, tracking) — TETAPI seluruh
 * data transaksional FLEET dikosongkan agar pengemudi asli memulai dari nol:
 *
 *   - Checklist awal/akhir armada, pengisian solar, ODO awal proyek.
 *   - Ritase, biaya lain ritase, sewa alat per jam.
 *   - BBM/downtime/service khusus armada (baris mesin produksi tetap aman).
 *   - Pengajuan servis, workshop todo, helper & presensi helper, serah terima.
 *   - Pengiriman (delivery) yang memakai armada.
 *   - Armada uji coba/dummy (GCS-TEST-*, CBP-TEST-*) beserta penugasan driver.
 *   - Invoice + item + pembayaran + mutasi kas yang merujuk ritase/sewa fleet.
 *   - Presensi (absensi) seluruh karyawan + formulir lapangan terkait, agar
 *     sesi uji coba presensi user asli besok dimulai dari nol.
 *
 * Master yang DIPERTAHANKAN: tabel `armadas` (asli), `armada_drivers`,
 * `armada_penanggung_jawabs`, `rute_tarifs` — agar driver asli mengenali unit
 * yang diampu dan bisa langsung mencatat ritase.
 *
 * Jalankan eksplisit (tidak mengubah jalur default StagingSeeder):
 *   php artisan db:seed --class=StagingTest1Seeder
 * (atau `php artisan migrate:fresh --seed --seeder=StagingTest1Seeder`).
 */
class StagingTest1Seeder extends Seeder
{
    use StagingOnly;

    /** Kode unit armada uji coba/demo yang harus dibuang (bukan armada asli). */
    private const DEMO_ARMADA_KODE = ['GCS-TEST-DT-01', 'CBP-TEST-TM-01', 'GCS-TEST-EX-01'];

    public function run(): void
    {
        $this->assertNotProduction();

        $this->command?->info('[StagingTest1] Menyiapkan data staging + armada/driver asli...');

        $this->call([
            CleanDataSeeder::class,
            UnitBisnisSeeder::class,
            RolePermissionSeeder::class,
            DivisiRoleSeeder::class,
            UserSeeder::class,
            BahanBakuSeeder::class,
            SupplierSeeder::class,
            ProyekSeeder::class,
            KaryawanSeeder::class,
            AkunKasBankSeeder::class,
            FleetDataSeeder::class,
            ProcurementDataSeeder::class,
            ProductionDataSeeder::class,
            FinanceDataSeeder::class,
            AttendanceDataSeeder::class,
            AppVersionSeeder::class,
            MobileTestUserSeeder::class,
            MobileDemoDataSeeder::class,
            MobileArmadaDemoSeeder::class,
        ]);

        $this->purgeFleetTransactions();
        $this->purgeAttendance();

        $this->command?->info('[StagingTest1] Selesai. Data transaksional Fleet & presensi KOSONG; driver asli siap diuji.');
    }

    /**
     * Kosongkan seluruh data transaksional Fleet (anak sebelum induk) dan
     * bersihkan referensi finance + armada demo yang menggantung.
     */
    private function purgeFleetTransactions(): void
    {
        // ── 1. Finance: buang invoice yang merujuk entitas Fleet ──────────────
        $this->purgeFleetInvoices();

        // ── 2. Transaksional Fleet (semua baris) ──────────────────────────────
        $fleetTables = [
            'armada_checklist_akhirs',
            'armada_pengisian_solars',
            'armada_odo_awal_proyeks',
            'ritase_biaya_lains',
            'ritases',
            'sewa_alat_jams',
            'checklist_serah_terima_detail',
            'checklist_serah_terima_armada',
            'pengajuan_servis_spareparts',
            'pengajuan_servis_personels',
            'pengajuan_servis_armadas',
            'workshop_todos',
            'presensi_helpers',
            'helper_armadas',
            'pengirimans',
        ];

        foreach ($fleetTables as $table) {
            DB::table($table)->delete();
        }

        // ── 3. Checklist/BBM/downtime/service hanya untuk ARMADA ──────────────
        // (baris bertipe MesinProduksi tetap aman).
        DB::table('armada_checklist_harians')
            ->where('checkable_type', Armada::class)
            ->delete();

        foreach (['bbm_logs', 'downtime_logs', 'service_history', 'service_intervals'] as $table) {
            DB::table($table)->where('serviceable_type', Armada::class)->delete();
        }

        // ── 4. Armada uji coba/demo + penugasan drivernya ─────────────────────
        $demoArmadaIds = DB::table('armadas')
            ->whereIn('kode_unit', self::DEMO_ARMADA_KODE)
            ->pluck('id')
            ->all();

        if ($demoArmadaIds) {
            DB::table('armada_drivers')->whereIn('armada_id', $demoArmadaIds)->delete();
            DB::table('armada_penanggung_jawabs')->whereIn('armada_id', $demoArmadaIds)->delete();
            DB::table('armadas')->whereIn('id', $demoArmadaIds)->delete();
        }
    }

    /**
     * Kosongkan seluruh presensi (absensi) karyawan dan formulir lapangan yang
     * merujuk padanya, agar sesi uji coba presensi user asli besok mulai nol.
     *
     * `formulir_lapangans` dihapus lebih dulu (anak), lalu `presensis`.
     * `mobile_tracking_locations.presensi_id` (FK `on delete set null`) ikut
     * menjadi NULL otomatis — titik tracking itu sendiri tidak dihapus.
     */
    private function purgeAttendance(): void
    {
        DB::table('formulir_lapangans')->delete();
        DB::table('presensis')->delete();
    }

    /**
     * Hapus invoice (INV-2026-001/002) yang item-nya merujuk Ritase/SewaAlatJam
     * beserta pembayaran klien dan mutasi kas terkait, agar tidak menggantung.
     */
    private function purgeFleetInvoices(): void
    {
        $fleetInvoiceIds = DB::table('invoice_items')
            ->whereIn('referensi_type', [Ritase::class, SewaAlatJam::class])
            ->pluck('invoice_id')
            ->unique()
            ->all();

        if (empty($fleetInvoiceIds)) {
            return;
        }

        $pembayaranIds = DB::table('pembayaran_kliens')
            ->whereIn('invoice_id', $fleetInvoiceIds)
            ->pluck('id')
            ->all();

        if (! empty($pembayaranIds)) {
            DB::table('mutasi_kas_banks')
                ->where('referensi_type', PembayaranKlien::class)
                ->whereIn('referensi_id', $pembayaranIds)
                ->delete();

            DB::table('pembayaran_kliens')->whereIn('id', $pembayaranIds)->delete();
        }

        DB::table('invoice_items')->whereIn('invoice_id', $fleetInvoiceIds)->delete();
        DB::table('invoices')->whereIn('id', $fleetInvoiceIds)->delete();
    }
}
