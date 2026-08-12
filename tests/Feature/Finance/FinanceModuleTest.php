<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\Rab;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\InvoiceItem;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\PembayaranKlien;
use App\Domain\Finance\Models\TransferAntarKas;
use App\Domain\Finance\Actions\RecordClientPaymentAction;
use App\Domain\Finance\Actions\RecordTransferAntarKasAction;
use App\Domain\Finance\Actions\GetPiutangOutstandingAction;
use App\Domain\Finance\Actions\GenerateInvoiceFromProductionAction;
use App\Domain\Finance\Actions\GenerateInvoiceFromRitaseAction;
use App\Domain\Finance\Services\ConsolidateFinanceReportService;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\HargaJual;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Str;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->unitGCS = UnitBisnis::factory()->gcs()->create();
    $this->unitCBP = UnitBisnis::factory()->cbp()->create();

    $this->proyekKontrak = Proyek::factory()->for($this->unitCBP)->kontrakKlien()->create([
        'created_by' => $this->user->id,
        'client'     => 'PT Klien Beton',
    ]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyekKontrak->id]);

    $this->akunKasCBP = AkunKasBank::factory()->create([
        'unit_bisnis_id' => $this->unitCBP->id,
        'saldo_awal'     => 5_000_000,
        'jenis_kas'      => 'kas_operasional',
    ]);
    $this->akunKasGCS = AkunKasBank::factory()->create([
        'unit_bisnis_id' => $this->unitGCS->id,
        'saldo_awal'     => 10_000_000,
        'jenis_kas'      => 'kas_kecil',
    ]);
});

// =========================================================
// Kas & Bank - Saldo On-the-Fly
// =========================================================

describe('Kas dan Bank - Saldo On-the-Fly', function () {
    test('saldo akun kas dihitung dari saldo_awal + masuk - keluar', function () {
        $akun = $this->akunKasCBP;

        // Tambah mutasi masuk
        MutasiKasBank::create([
            'akun_kas_bank_id' => $akun->id,
            'tipe'             => 'masuk',
            'jumlah'           => 2_000_000,
            'kategori'         => 'Pembayaran Klien',
            'tanggal'          => now(),
            'created_by'       => $this->user->id,
        ]);

        // Tambah mutasi keluar
        MutasiKasBank::create([
            'akun_kas_bank_id' => $akun->id,
            'tipe'             => 'keluar',
            'jumlah'           => 500_000,
            'kategori'         => 'Pembayaran Supplier',
            'tanggal'          => now(),
            'created_by'       => $this->user->id,
        ]);

        $saldo = $akun->saldo_awal
            + $akun->mutasis()->where('tipe', 'masuk')->sum('jumlah')
            - $akun->mutasis()->where('tipe', 'keluar')->sum('jumlah');

        // 5.000.000 + 2.000.000 - 500.000 = 6.500.000
        expect($saldo)->toEqual(6_500_000);
    });

    test('saldo tidak berubah tanpa transaksi', function () {
        $akun  = $this->akunKasCBP;
        $saldo = $akun->saldo_awal
            + $akun->mutasis()->where('tipe', 'masuk')->sum('jumlah')
            - $akun->mutasis()->where('tipe', 'keluar')->sum('jumlah');

        expect($saldo)->toEqual(5_000_000);
    });
});

// =========================================================
// Transfer Antar Kas
// =========================================================

describe('Transfer Antar Kas', function () {
    test('transfer antar kas membuat dua mutasi keluar dan masuk', function () {
        $action = new RecordTransferAntarKasAction();
        $transfer = $action->execute([
            'dari_akun_kas_bank_id' => $this->akunKasGCS->id,
            'ke_akun_kas_bank_id'   => $this->akunKasCBP->id,
            'jumlah'                => 1_000_000,
            'tanggal'               => now()->toDateString(),
            'catatan'               => 'Pinjam kas antar divisi',
        ], $this->user->id);

        // Harus ada record TransferAntarKas
        expect($transfer)->not->toBeNull();
        expect($transfer->jumlah)->toEqual(1_000_000);

        // Mutasi keluar di akun GCS
        $mutasiKeluar = MutasiKasBank::where('akun_kas_bank_id', $this->akunKasGCS->id)
            ->where('tipe', 'keluar')->first();
        expect($mutasiKeluar)->not->toBeNull();
        expect($mutasiKeluar->jumlah)->toEqual(1_000_000);

        // Mutasi masuk di akun CBP
        $mutasiMasuk = MutasiKasBank::where('akun_kas_bank_id', $this->akunKasCBP->id)
            ->where('tipe', 'masuk')->first();
        expect($mutasiMasuk)->not->toBeNull();
        expect($mutasiMasuk->jumlah)->toEqual(1_000_000);
    });

    test('transfer antar kas memperbarui saldo kedua akun', function () {
        $action = new RecordTransferAntarKasAction();
        $action->execute([
            'dari_akun_kas_bank_id' => $this->akunKasGCS->id,
            'ke_akun_kas_bank_id'   => $this->akunKasCBP->id,
            'jumlah'                => 3_000_000,
            'tanggal'               => now()->toDateString(),
            'catatan'               => 'Transfer operasional',
        ], $this->user->id);

        $saldoGCS = $this->akunKasGCS->saldo_awal
            + $this->akunKasGCS->mutasis()->where('tipe', 'masuk')->sum('jumlah')
            - $this->akunKasGCS->mutasis()->where('tipe', 'keluar')->sum('jumlah');

        $saldoCBP = $this->akunKasCBP->saldo_awal
            + $this->akunKasCBP->mutasis()->where('tipe', 'masuk')->sum('jumlah')
            - $this->akunKasCBP->mutasis()->where('tipe', 'keluar')->sum('jumlah');

        // GCS: 10.000.000 - 3.000.000 = 7.000.000
        expect($saldoGCS)->toEqual(7_000_000);
        // CBP: 5.000.000 + 3.000.000 = 8.000.000
        expect($saldoCBP)->toEqual(8_000_000);
    });
});

// =========================================================
// Invoice - Generate dari Production Session (CBP/AMP)
// =========================================================

describe('Invoice dari Production Session', function () {
    beforeEach(function () {
        $this->produk = Produk::factory()->create([
            'unit_bisnis_id' => $this->unitCBP->id,
            'kategori'       => 'BETON_COR',
            'satuan_output'  => 'm3',
        ]);
        HargaJual::create([
            'produk_id'    => $this->produk->id,
            'harga'        => 1_200_000,
            'berlaku_dari' => now()->subMonth(),
            'aktif'        => true,
        ]);
        $this->mesin = MesinProduksi::create([
            'unit_bisnis_id'   => $this->unitCBP->id,
            'titik_id'         => $this->titik->id,
            'nama'             => 'Batching Plant 1',
            'jenis'            => 'mixer_beton',
            'kapasitas'        => 60,
            'status'           => 'aktif',
            'biaya_per_jam'    => 500_000,
            'default_produk_id' => $this->produk->id,
        ]);
        $this->operator = Karyawan::create([
            'nama'    => 'Operator Test',
            'tipe'    => 'tetap',
            'jabatan' => 'Operator Mesin',
            'status'  => 'aktif',
        ]);
    });

    test('generate invoice dari sesi produksi yang selesai dan belum ditagih', function () {
        $sesi1 = ProductionSession::create([
            'mesin_id'            => $this->mesin->id,
            'titik_id'            => $this->titik->id,
            'produk_id'           => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai'               => now()->subHours(5),
            'selesai'             => now()->subHours(3),
            'hasil_output'        => 10,
            'status'              => 'selesai',
        ]);
        $sesi2 = ProductionSession::create([
            'mesin_id'            => $this->mesin->id,
            'titik_id'            => $this->titik->id,
            'produk_id'           => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai'               => now()->subHours(2),
            'selesai'             => now()->subHour(),
            'hasil_output'        => 5,
            'status'              => 'selesai',
        ]);

        $action  = new GenerateInvoiceFromProductionAction();
        $invoice = $action->execute($this->proyekKontrak->id, [
            'tanggal_terbit'         => now()->toDateString(),
            'termin_pembayaran_hari' => 30,
            'catatan'                => 'Invoice bulanan CBP',
            'created_by'             => $this->user->id,
        ]);

        expect($invoice)->not->toBeNull();
        expect($invoice->unit_bisnis_id)->toBe($this->unitCBP->id);
        expect($invoice->status)->toBe('draft');
        expect($invoice->items()->count())->toBe(2);

        $totalExpected = (10 + 5) * 1_200_000;
        expect((int) $invoice->items()->sum('subtotal'))->toBe($totalExpected);
    });

    test('sesi produksi yang sudah ditagih tidak muncul di invoice baru', function () {
        $sesiSudahDitagih = ProductionSession::create([
            'mesin_id'            => $this->mesin->id,
            'titik_id'            => $this->titik->id,
            'produk_id'           => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai'               => now()->subHours(10),
            'selesai'             => now()->subHours(8),
            'hasil_output'        => 8,
            'status'              => 'selesai',
        ]);

        $invoiceLama = Invoice::create([
            'unit_bisnis_id'         => $this->unitCBP->id,
            'proyek_id'              => $this->proyekKontrak->id,
            'kode_invoice'           => 'INV-CBP-2026-001',
            'status'                 => 'terkirim',
            'tanggal_terbit'         => now()->subDays(10),
            'tanggal_jatuh_tempo'    => now()->addDays(20),
            'termin_pembayaran_hari' => 30,
            'created_by'             => $this->user->id,
        ]);
        InvoiceItem::create([
            'invoice_id'      => $invoiceLama->id,
            'deskripsi'       => 'Beton CBP',
            'referensi_type'  => ProductionSession::class,
            'referensi_id'    => $sesiSudahDitagih->id,
            'jumlah'          => 8,
            'harga_satuan'    => 1_200_000,
            'subtotal'        => 9_600_000,
        ]);

        ProductionSession::create([
            'mesin_id'            => $this->mesin->id,
            'titik_id'            => $this->titik->id,
            'produk_id'           => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai'               => now()->subHours(3),
            'selesai'             => now()->subHour(),
            'hasil_output'        => 6,
            'status'              => 'selesai',
        ]);

        $action      = new GenerateInvoiceFromProductionAction();
        $invoiceBaru = $action->execute($this->proyekKontrak->id, [
            'tanggal_terbit'         => now()->toDateString(),
            'termin_pembayaran_hari' => 30,
            'created_by'             => $this->user->id,
        ]);

        expect($invoiceBaru->items()->count())->toBe(1);
        expect((int) $invoiceBaru->items()->first()->jumlah)->toBe(6);
    });
});

// =========================================================
// Invoice - Generate dari Ritase (GCS)
// =========================================================

describe('Invoice dari Ritase GCS', function () {
    test('generate invoice dari ritase disetujui yang belum ditagih', function () {
        $proyekGCS = Proyek::factory()->for($this->unitGCS)->kontrakKlien()->create([
            'created_by' => $this->user->id,
            'client'     => 'PT Kontraktor Jalan',
        ]);

        $driver  = Karyawan::create(['nama' => 'Driver A', 'tipe' => 'borongan_rit', 'status' => 'aktif']);
        $armada  = Armada::factory()->for($this->unitGCS)->dumpTruck()->create();

        $ritase1 = Ritase::create([
            'armada_id'             => $armada->id,
            'driver_karyawan_id'    => $driver->id,
            'tanggal'               => now()->subDays(3)->toDateString(),
            'jumlah_rit'            => 5,
            'tarif_per_rit_snapshot' => 90_000,
            'total_upah_rit'        => 450_000,
            'proyek_id'             => $proyekGCS->id,
            'status'                => 'disetujui',
        ]);
        $ritase2 = Ritase::create([
            'armada_id'             => $armada->id,
            'driver_karyawan_id'    => $driver->id,
            'tanggal'               => now()->subDays(2)->toDateString(),
            'jumlah_rit'            => 3,
            'tarif_per_rit_snapshot' => 90_000,
            'total_upah_rit'        => 270_000,
            'proyek_id'             => $proyekGCS->id,
            'status'                => 'disetujui',
        ]);

        $action  = new GenerateInvoiceFromRitaseAction();
        $invoice = $action->execute($proyekGCS->id);

        expect($invoice)->not->toBeNull();
        expect($invoice->unit_bisnis_id)->toBe($this->unitGCS->id);
        expect($invoice->items()->count())->toBe(2);

        expect($ritase1->fresh()->status)->toBe('ditagih');
        expect($ritase2->fresh()->status)->toBe('ditagih');
    });
});

// =========================================================
// Pembayaran Klien & Update Status Invoice
// =========================================================

describe('Pembayaran Klien dan Status Invoice', function () {
    beforeEach(function () {
        $this->invoice = Invoice::create([
            'unit_bisnis_id'         => $this->unitCBP->id,
            'proyek_id'              => $this->proyekKontrak->id,
            'kode_invoice'           => 'INV-CBP-2026-TEST',
            'status'                 => 'terkirim',
            'tanggal_terbit'         => now()->subDays(5),
            'tanggal_jatuh_tempo'    => now()->addDays(25),
            'termin_pembayaran_hari' => 30,
            'created_by'             => $this->user->id,
        ]);
        InvoiceItem::create([
            'invoice_id'      => $this->invoice->id,
            'deskripsi'       => 'Beton FC20',
            'referensi_type'  => 'manual',
            'referensi_id'    => (string) Str::uuid(),
            'jumlah'          => 10,
            'harga_satuan'    => 1_200_000,
            'subtotal'        => 12_000_000,
        ]);
    });

    test('record pembayaran lunas mengubah status invoice menjadi lunas', function () {
        $action = new RecordClientPaymentAction();
        $action->execute($this->invoice, [
            'tanggal'          => now()->toDateString(),
            'jumlah'           => 12_000_000,
            'metode'           => 'transfer',
            'akun_kas_bank_id' => $this->akunKasCBP->id,
            'dicatat_oleh'     => $this->user->id,
        ]);

        expect($this->invoice->fresh()->status)->toBe('lunas');

        $mutasi = MutasiKasBank::where('akun_kas_bank_id', $this->akunKasCBP->id)
            ->where('tipe', 'masuk')->first();
        expect($mutasi)->not->toBeNull();
        expect($mutasi->jumlah)->toEqual(12_000_000);
    });

    test('record pembayaran sebagian mengubah status invoice menjadi lunas_sebagian', function () {
        $action = new RecordClientPaymentAction();
        $action->execute($this->invoice, [
            'tanggal'          => now()->toDateString(),
            'jumlah'           => 6_000_000,
            'metode'           => 'tunai',
            'akun_kas_bank_id' => $this->akunKasCBP->id,
            'dicatat_oleh'     => $this->user->id,
        ]);

        expect($this->invoice->fresh()->status)->toBe('lunas_sebagian');
    });

    test('GetPiutangOutstandingAction menghitung sisa tagihan per proyek', function () {
        PembayaranKlien::create([
            'invoice_id'       => $this->invoice->id,
            'tanggal'          => now()->toDateString(),
            'jumlah'           => 4_000_000,
            'metode'           => 'transfer',
            'akun_kas_bank_id' => $this->akunKasCBP->id,
            'dicatat_oleh'     => $this->user->id,
        ]);

        $action      = new GetPiutangOutstandingAction();
        $outstanding = $action->execute($this->proyekKontrak->id);

        // 12.000.000 - 4.000.000 = 8.000.000
        expect((float) $outstanding)->toEqual(8_000_000.0);
    });

    test('piutang outstanding nol setelah lunas dibayar', function () {
        PembayaranKlien::create([
            'invoice_id'       => $this->invoice->id,
            'tanggal'          => now()->toDateString(),
            'jumlah'           => 12_000_000,
            'metode'           => 'transfer',
            'akun_kas_bank_id' => $this->akunKasCBP->id,
            'dicatat_oleh'     => $this->user->id,
        ]);

        $action      = new GetPiutangOutstandingAction();
        $outstanding = $action->execute($this->proyekKontrak->id);

        expect((float) $outstanding)->toEqual(0.0);
    });
});

// =========================================================
// ConsolidateFinanceReportService
// =========================================================

describe('ConsolidateFinanceReportService - Laporan Konsolidasi', function () {
    test('service mengembalikan struktur laporan dengan keys yang benar', function () {
        $service = new ConsolidateFinanceReportService();
        $result  = $service->generate($this->proyekKontrak, now()->month, now()->year);

        expect($result)->toHaveKey('po');
        expect($result)->toHaveKey('ritase');
        expect($result)->toHaveKey('produksi');
        expect($result)->toHaveKey('gaji');
        expect($result)->toHaveKey('total');
    });

    test('service dapat dijalankan per proyek', function () {
        $service = new ConsolidateFinanceReportService();

        $result = $service->generate($this->proyekKontrak, now()->month, now()->year);

        expect($result)->not->toBeNull();
        expect($result['total'])->toBeGreaterThanOrEqual(0);
    });
});
