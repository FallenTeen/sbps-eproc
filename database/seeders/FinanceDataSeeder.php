<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\InvoiceItem;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\PembayaranKlien;
use App\Domain\Finance\Models\TransferAntarKas;
use App\Domain\Production\Models\ProductionSession;
use App\Models\User;
use Illuminate\Database\Seeder;

class FinanceDataSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner@example.com')->firstOrFail();
        $gcsUser = User::where('email', 'gcs@example.com')->firstOrFail();

        $gcs = UnitBisnis::where('kode', 'GCS')->firstOrFail();
        $cbp = UnitBisnis::where('kode', 'CBP')->firstOrFail();

        $proyek2 = Proyek::where('kode_proyek', 'PRJ-GCS-002')->firstOrFail();
        $proyek3 = Proyek::where('kode_proyek', 'PRJ-CBP-001')->firstOrFail();

        $kasBesar = AkunKasBank::where('nama', 'Kas Besar GCS')->firstOrFail();
        $kasKecil = AkunKasBank::where('nama', 'Kas Kecil GCS')->firstOrFail();
        $bankMandiri = AkunKasBank::where('nama', 'Bank Mandiri CBP')->firstOrFail();
        $bankBca = AkunKasBank::where('nama', 'Bank BCA GCS')->firstOrFail();

        // Referensi tagihan (dari Fleet & Production)
        $armadaDt01 = Armada::where('kode_unit', 'GCS-DT-01')->firstOrFail();
        $ritase1 = Ritase::where('armada_id', $armadaDt01->id)->where('status', 'disetujui')->orderBy('tanggal')->firstOrFail();
        $ritase3 = Ritase::where('armada_id', $armadaDt01->id)->where('status', 'disetujui')->orderBy('tanggal', 'desc')->firstOrFail();
        $sewa1 = SewaAlatJam::where('status', 'disetujui')->firstOrFail();
        $session1 = ProductionSession::where('status', 'selesai')->whereNotNull('hasil_output')->firstOrFail();

        // ─────────────────────── MUTASI KAS BANK ───────────────────────
        MutasiKasBank::create(['akun_kas_bank_id' => $kasBesar->id, 'kategori' => 'Setoran Modal', 'tipe' => 'masuk', 'jumlah' => 50_000_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(20)->toDateString(), 'catatan' => 'Setoran modal awal.', 'created_by' => $owner->id]);
        MutasiKasBank::create(['akun_kas_bank_id' => $kasKecil->id, 'kategori' => 'Operasional', 'tipe' => 'keluar', 'jumlah' => 5_000_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(10)->toDateString(), 'catatan' => 'Operasional harian armada.', 'created_by' => $gcsUser->id]);
        MutasiKasBank::create(['akun_kas_bank_id' => $bankMandiri->id, 'kategori' => 'Pembayaran Klien', 'tipe' => 'masuk', 'jumlah' => 37_200_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(15)->toDateString(), 'catatan' => 'DP klien proyek jembatan.', 'created_by' => $owner->id]);

        // ─────────────────────────── INVOICE ───────────────────────────
        $invoice1 = Invoice::updateOrCreate(
            ['kode_invoice' => 'INV-2026-001'],
            [
                'unit_bisnis_id' => $gcs->id,
                'proyek_id' => $proyek2->id,
                'termin_pembayaran_hari' => 30,
                'tanggal_terbit' => now()->subDays(10)->toDateString(),
                'tanggal_jatuh_tempo' => now()->addDays(20)->toDateString(),
                'status' => 'terkirim',
                'catatan' => 'Tagihan angkut & sewa alat proyek bendungan.',
                'created_by' => $owner->id,
            ]
        );
        InvoiceItem::create(['invoice_id' => $invoice1->id, 'deskripsi' => 'Ritase angkut pasir - 12 rit', 'referensi_type' => Ritase::class, 'referensi_id' => $ritase1->id, 'jumlah' => 12, 'harga_satuan' => 1_200_000, 'subtotal' => 14_400_000]);
        InvoiceItem::create(['invoice_id' => $invoice1->id, 'deskripsi' => 'Sewa excavator - 8 jam', 'referensi_type' => SewaAlatJam::class, 'referensi_id' => $sewa1->id, 'jumlah' => 8, 'harga_satuan' => 350_000, 'subtotal' => 2_800_000]);

        $invoice2 = Invoice::updateOrCreate(
            ['kode_invoice' => 'INV-2026-002'],
            [
                'unit_bisnis_id' => $gcs->id,
                'proyek_id' => $proyek2->id,
                'termin_pembayaran_hari' => 30,
                'tanggal_terbit' => now()->subDays(5)->toDateString(),
                'tanggal_jatuh_tempo' => now()->addDays(25)->toDateString(),
                'status' => 'lunas',
                'catatan' => 'Tagihan ritase tahap 2 - sudah lunas.',
                'created_by' => $owner->id,
            ]
        );
        InvoiceItem::create(['invoice_id' => $invoice2->id, 'deskripsi' => 'Ritase angkut pasir - 10 rit', 'referensi_type' => Ritase::class, 'referensi_id' => $ritase3->id, 'jumlah' => 10, 'harga_satuan' => 1_200_000, 'subtotal' => 12_000_000]);

        $invoice3 = Invoice::updateOrCreate(
            ['kode_invoice' => 'INV-2026-003'],
            [
                'unit_bisnis_id' => $cbp->id,
                'proyek_id' => $proyek3->id,
                'termin_pembayaran_hari' => 30,
                'tanggal_terbit' => now()->subDay()->toDateString(),
                'tanggal_jatuh_tempo' => now()->addDays(29)->toDateString(),
                'status' => 'draft',
                'catatan' => 'Tagihan suplai beton K-225.',
                'created_by' => $owner->id,
            ]
        );
        InvoiceItem::create(['invoice_id' => $invoice3->id, 'deskripsi' => 'Beton K-225 - 120 m³', 'referensi_type' => ProductionSession::class, 'referensi_id' => $session1->id, 'jumlah' => 120, 'harga_satuan' => 1_200_000, 'subtotal' => 144_000_000]);

        // ──────────────────── TRANSFER ANTAR KAS ────────────────────
        TransferAntarKas::create([
            'dari_akun_kas_bank_id' => $kasBesar->id,
            'ke_akun_kas_bank_id' => $kasKecil->id,
            'jumlah' => 10_000_000,
            'tanggal' => now()->subDays(8)->toDateString(),
            'catatan' => 'Top up kas kecil.',
            'created_by' => $owner->id,
        ]);

        // ────────────────────── PEMBAYARAN KLIEN ──────────────────────
        $pembayaranKlien2 = PembayaranKlien::create([
            'invoice_id' => $invoice2->id,
            'tanggal' => now()->subDays(2)->toDateString(),
            'jumlah' => 12_000_000,
            'metode' => 'transfer',
            'akun_kas_bank_id' => $bankBca->id,
            'dicatat_oleh' => $owner->id,
            'dokumen_bukti' => null,
            'catatan' => 'Pelunasan INV-2026-002.',
        ]);

        MutasiKasBank::create([
            'akun_kas_bank_id' => $bankBca->id,
            'kategori' => 'Pembayaran Klien',
            'tipe' => 'masuk',
            'jumlah' => 12_000_000,
            'referensi_type' => PembayaranKlien::class,
            'referensi_id' => $pembayaranKlien2->id,
            'tanggal' => now()->subDays(2)->toDateString(),
            'catatan' => 'Pelunasan INV-2026-002.',
            'created_by' => $owner->id,
        ]);
    }
}
