<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\InvoiceItem;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\PembayaranKlien;
use App\Domain\Finance\Models\TransferAntarKas;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Production\Models\ProductionSession;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class FinanceDataSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $owner = User::where('email', 'owner@real.com')->firstOrFail();
        $gcsUser = User::where('email', 'gcs@real.com')->firstOrFail();
        $cbpUser = User::where('email', 'cbp@real.com')->firstOrFail();
        $ampUser = User::where('email', 'amp@real.com')->firstOrFail();

        $gcs = UnitBisnis::where('kode', 'GCS')->firstOrFail();
        $cbp = UnitBisnis::where('kode', 'CBP')->firstOrFail();
        $amp = UnitBisnis::where('kode', 'AMP')->firstOrFail();

        $proyek2 = Proyek::where('kode_proyek', 'PRJ-GCS-002')->firstOrFail();
        $proyek3 = Proyek::where('kode_proyek', 'PRJ-CBP-001')->firstOrFail();
        $proyekAmp = Proyek::where('kode_proyek', 'PRJ-AMP-001')->firstOrFail();

        $kasBesar = AkunKasBank::where('nama', 'Kas Besar GCS')->firstOrFail();
        $kasKecil = AkunKasBank::where('nama', 'Kas Kecil GCS')->firstOrFail();
        $bankMandiri = AkunKasBank::where('nama', 'Bank Mandiri CBP')->firstOrFail();
        $bankBca = AkunKasBank::where('nama', 'Bank BCA GCS')->firstOrFail();
        $bankBri = AkunKasBank::where('nama', 'Bank BRI AMP')->firstOrFail();
        $kasKecilCbp = AkunKasBank::where('nama', 'Kas Kecil CBP')->firstOrFail();

        // Referensi tagihan (dari Fleet & Production)
        $armadaDt01 = Armada::where('kode_unit', 'DT 01')->firstOrFail();
        $driverNovi = Karyawan::where('nama', 'NOVI')->firstOrFail();

        // Ritase demo (staging) untuk armada DT 01 — armada & driver asli.
        $ruteTarif = RuteTarif::firstOrCreate(
            ['unit_bisnis_id' => $gcs->id, 'lokasi_asal' => 'Lokasi Tambang', 'lokasi_tujuan' => 'Plant GCS'],
            [
                'jarak_km' => 18,
                'tarif_per_rit' => 1_200_000,
                'indeks_liter_solar_per_km' => 0.35,
                'berlaku_dari' => now()->subMonth()->toDateString(),
                'berlaku_sampai' => null,
            ]
        );

        $ritase1 = Ritase::updateOrCreate(
            ['armada_id' => $armadaDt01->id, 'tanggal' => now()->subDays(4)->toDateString()],
            [
                'driver_karyawan_id' => $driverNovi->id,
                'rute_tarif_id' => $ruteTarif->id,
                'kategori' => 'angkut',
                'material' => 'Pasir',
                'jumlah_rit' => 12,
                'satuan_volume' => 'ritase',
                'jumlah_volume' => null,
                'tarif_per_rit_snapshot' => 1_200_000,
                'nominal' => 14_400_000,
                'total_upah_rit' => 14_400_000,
                'proyek_id' => $proyek2->id,
                'titik_id' => null,
                'customer' => null,
                'status' => 'disetujui',
                'catatan' => 'Ritase angkut pasir untuk demo finance.',
            ]
        );

        $ritase3 = Ritase::updateOrCreate(
            ['armada_id' => $armadaDt01->id, 'tanggal' => now()->subDays(9)->toDateString()],
            [
                'driver_karyawan_id' => $driverNovi->id,
                'rute_tarif_id' => $ruteTarif->id,
                'kategori' => 'angkut',
                'material' => 'Pasir',
                'jumlah_rit' => 10,
                'satuan_volume' => 'ritase',
                'jumlah_volume' => null,
                'tarif_per_rit_snapshot' => 1_200_000,
                'nominal' => 12_000_000,
                'total_upah_rit' => 12_000_000,
                'proyek_id' => $proyek2->id,
                'titik_id' => null,
                'customer' => null,
                'status' => 'disetujui',
                'catatan' => 'Ritase angkut pasir untuk demo finance.',
            ]
        );

        $sewa1 = SewaAlatJam::firstOrCreate(
            ['armada_id' => $armadaDt01->id, 'proyek_id' => $proyek2->id, 'tanggal' => now()->subDays(6)->toDateString()],
            [
                'penyewa_eksternal' => 'PT Karya Cikarang Mandiri',
                'lokasi_pekerjaan' => 'Area Galian Blok A',
                'harga_per_jam_snapshot' => 350_000,
                'hm_awal' => 1500.0,
                'hm_akhir' => 1540.0,
                'jumlah_jam' => 40,
                'status' => 'disetujui',
                'catatan' => 'Sewa alat berat untuk demo finance.',
            ]
        );

        $session1 = ProductionSession::where('status', 'selesai')->whereNotNull('hasil_output')->firstOrFail();

        // ─────────────────────── MUTASI KAS BANK ───────────────────────
        MutasiKasBank::create(['akun_kas_bank_id' => $kasBesar->id, 'kategori' => 'Setoran Modal', 'tipe' => 'masuk', 'jumlah' => 50_000_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(20)->toDateString(), 'catatan' => 'Setoran modal awal.', 'created_by' => $owner->id]);
        MutasiKasBank::create(['akun_kas_bank_id' => $kasKecil->id, 'kategori' => 'Operasional', 'tipe' => 'keluar', 'jumlah' => 5_000_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(10)->toDateString(), 'catatan' => 'Operasional harian armada.', 'created_by' => $gcsUser->id]);
        MutasiKasBank::create(['akun_kas_bank_id' => $bankMandiri->id, 'kategori' => 'Pembayaran Klien', 'tipe' => 'masuk', 'jumlah' => 37_200_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(15)->toDateString(), 'catatan' => 'DP klien proyek jembatan.', 'created_by' => $owner->id]);

        // Mutasi tambahan agar rekap kas bank punya riwayat beragam.
        MutasiKasBank::create(['akun_kas_bank_id' => $kasBesar->id, 'kategori' => 'Hasil Sewa Alat', 'tipe' => 'masuk', 'jumlah' => 14_000_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(6)->toDateString(), 'catatan' => 'Pembayaran sewa excavator PT Karya Cikarang Mandiri.', 'created_by' => $owner->id]);
        MutasiKasBank::create(['akun_kas_bank_id' => $bankMandiri->id, 'kategori' => 'Operasional', 'tipe' => 'keluar', 'jumlah' => 7_500_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(4)->toDateString(), 'catatan' => 'Operasional plant CBP.', 'created_by' => $cbpUser->id]);
        MutasiKasBank::create(['akun_kas_bank_id' => $bankBri->id, 'kategori' => 'Setoran Modal', 'tipe' => 'masuk', 'jumlah' => 20_000_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(12)->toDateString(), 'catatan' => 'Tambahan modal unit AMP.', 'created_by' => $owner->id]);
        MutasiKasBank::create(['akun_kas_bank_id' => $kasKecilCbp->id, 'kategori' => 'Operasional', 'tipe' => 'keluar', 'jumlah' => 3_200_000, 'referensi_type' => null, 'referensi_id' => null, 'tanggal' => now()->subDays(3)->toDateString(), 'catatan' => 'Operasional harian plant CBP.', 'created_by' => $owner->id]);

        // ─────────────────────────── INVOICE ───────────────────────────
        $invoice1 = Invoice::updateOrCreate(
            ['kode_invoice' => 'INV-2026-001'],
            [
                'unit_bisnis_id' => $gcs->id,
                'proyek_id' => $proyek2->id,
                'termin_pembayaran_hari' => 30,
                'tanggal_terbit' => now()->subDays(10)->toDateString(),
                'tanggal_jatuh_tempo' => now()->addDays(20)->toDateString(),
                'status' => 'lunas_sebagian',
                'catatan' => 'Tagihan angkut & sewa alat proyek bendungan — dibayar sebagian.',
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

        // Invoice AMP (hotmix) — sudah terkirim ke Dinas PU.
        $sessionHotmix = ProductionSession::where('status', 'selesai')
            ->whereDate('mulai', now()->subDays(1)->toDateString())
            ->firstOrFail();

        $invoice4 = Invoice::updateOrCreate(
            ['kode_invoice' => 'INV-2026-004'],
            [
                'unit_bisnis_id' => $amp->id,
                'proyek_id' => $proyekAmp->id,
                'termin_pembayaran_hari' => 30,
                'tanggal_terbit' => now()->subDays(1)->toDateString(),
                'tanggal_jatuh_tempo' => now()->addDays(29)->toDateString(),
                'status' => 'terkirim',
                'catatan' => 'Tagihan suplai hotmix AC-WC jalan provinsi.',
                'created_by' => $owner->id,
            ]
        );
        InvoiceItem::create(['invoice_id' => $invoice4->id, 'deskripsi' => 'Hotmix AC-WC - 110 ton', 'referensi_type' => ProductionSession::class, 'referensi_id' => $sessionHotmix->id, 'jumlah' => 110, 'harga_satuan' => 1_600_000, 'subtotal' => 176_000_000]);

        // ──────────────────── TRANSFER ANTAR KAS ────────────────────
        TransferAntarKas::create([
            'dari_akun_kas_bank_id' => $kasBesar->id,
            'ke_akun_kas_bank_id' => $kasKecil->id,
            'jumlah' => 10_000_000,
            'tanggal' => now()->subDays(8)->toDateString(),
            'catatan' => 'Top up kas kecil.',
            'created_by' => $owner->id,
        ]);

        TransferAntarKas::create([
            'dari_akun_kas_bank_id' => $bankBca->id,
            'ke_akun_kas_bank_id' => $bankMandiri->id,
            'jumlah' => 15_000_000,
            'tanggal' => now()->subDays(7)->toDateString(),
            'catatan' => 'Transfer dana operasional ke CBP.',
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

        // Pembayaran sebagian INV-2026-001 (sisa 9,2 jt menunggu).
        $pembayaranKlien1 = PembayaranKlien::create([
            'invoice_id' => $invoice1->id,
            'tanggal' => now()->subDays(1)->toDateString(),
            'jumlah' => 8_000_000,
            'metode' => 'transfer',
            'akun_kas_bank_id' => $bankMandiri->id,
            'dicatat_oleh' => $owner->id,
            'dokumen_bukti' => null,
            'catatan' => 'Cicilan pertama INV-2026-001.',
        ]);

        MutasiKasBank::create([
            'akun_kas_bank_id' => $bankMandiri->id,
            'kategori' => 'Pembayaran Klien',
            'tipe' => 'masuk',
            'jumlah' => 8_000_000,
            'referensi_type' => PembayaranKlien::class,
            'referensi_id' => $pembayaranKlien1->id,
            'tanggal' => now()->subDays(1)->toDateString(),
            'catatan' => 'Cicilan pertama INV-2026-001.',
            'created_by' => $owner->id,
        ]);
    }
}
