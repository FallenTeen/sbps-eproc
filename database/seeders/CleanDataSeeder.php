<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Membersihkan seluruh data bisnis sebelum di-seed ulang.
 *
 * Urutan hapus mengikuti ketergantungan foreign key (anak sebelum induk),
 * sehingga aman untuk dijalankan berulang kali (idempotent).
 */
class CleanDataSeeder extends Seeder
{
    use StagingOnly;

    private array $tables = [
        // Finance
        'invoice_items',
        'pembayaran_kliens',
        'invoices',
        'transfer_antar_kas',
        'mutasi_kas_banks',

        // Procurement (referensi ke purchase_orders)
        'pembayarans',
        'bbm_logs',
        'service_history',
        'purchase_order_approvals',
        'purchase_order_items',
        'purchase_orders',
        'stok_mutasis',
        'harga_belis',

        // Production
        'pengirimans',
        'qc_samples',
        'production_session_items',
        'production_sessions',
        'mix_design_template_items',
        'mix_design_templates',
        'resep_produksis',
        'harga_juals',
        'mesin_produksis',
        'produks',

        // Fleet
        'checklist_serah_terima_detail',
        'checklist_serah_terima_armada',
        'pengajuan_servis_spareparts',
        'pengajuan_servis_personels',
        'pengajuan_servis_armadas',
        'workshop_todos',
        'presensi_helpers',
        'helper_armadas',
        'armada_odo_awal_proyeks',
        'armada_penanggung_jawabs',
        'ritase_biaya_lains',
        'ritases',
        'sewa_alat_jams',
        'armada_checklist_harians',
        'downtime_logs',
        'service_intervals',
        'armada_drivers',
        'armadas',
        'rute_tarifs',
        'stok_opnames',

        // HR & Payroll
        'komponen_gajis',
        'gaji_periodes',
        'cutis',
        'karyawan_titik_assignments',
        'karyawans',

        // Attendance
        'formulir_lapangans',
        'presensis',

        // Core
        'komunikasi_logs',
        'rabs',
        'titiks',
        'proyeks',
        'dokumens',

        // Finance (induk)
        'akun_kas_banks',
    ];

    public function run(): void
    {
        $this->assertNotProduction();

        foreach ($this->tables as $table) {
            DB::table($table)->delete();
        }
    }
}
