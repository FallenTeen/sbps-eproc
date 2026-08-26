<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Procurement\Actions\ApprovePurchaseOrderAction;
use App\Domain\Procurement\Actions\RecordPaymentAction;
use App\Domain\Procurement\Actions\RecordStockMutationAction;
use App\Domain\Procurement\Actions\RejectPurchaseOrderAction;
use App\Domain\Procurement\Actions\SubmitPurchaseOrderAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Procurement\States\DibayarSebagian;
use App\Domain\Procurement\States\Disetujui;
use App\Domain\Procurement\States\Diterima;
use App\Domain\Procurement\States\Ditolak;
use App\Domain\Procurement\States\Lunas;
use App\Domain\Procurement\States\MenungguApprovalFinance;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\Auth;

uses(TestCase::class, DatabaseTransactions::class); // <-- penting!

// ========== HELPER: Setup Data Awal ==========
beforeEach(function () {
    // Buat user untuk auth
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    // Buat unit bisnis
    $this->unit = UnitBisnis::factory()->gcs()->create();

    // Buat proyek
    $this->proyek = Proyek::factory()
        ->for($this->unit)
        ->internal()
        ->create(['created_by' => $this->user->id]);

    // Buat supplier
    $this->supplier = Supplier::factory()->create();

    // Buat bahan baku
    $this->bahanBaku = BahanBaku::factory()->bahanBaku()->create();

    // Buat akun kas
    $this->akunKas = AkunKasBank::factory()->create([
        'unit_bisnis_id' => $this->unit->id,
        'saldo_awal' => 10000000,
    ]);
});

// ========== TEST 1: SUBMIT PO BERHASIL ==========
test('submit po validasi rab berhasil', function () {
    // Buat RAB dengan rencana 1.000.000
    $rab = Rab::factory()
        ->for($this->proyek)
        ->bahanBaku()
        ->create(['rencana' => 1000000]);

    // Buat PO draft
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->draft()
        ->create();

    // Tambahkan item PO dengan subtotal 500.000 (masih di bawah RAB)
    $po->items()->create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'jumlah' => 10,
        'harga_satuan_snapshot' => 50000,
        'subtotal' => 500000,
    ]);

    // Submit PO
    $action = new SubmitPurchaseOrderAction;
    $po = $action->execute($po);

    // Assert: status berubah menjadi MenungguApprovalFinance
    expect($po->status)->toBeInstanceOf(MenungguApprovalFinance::class);
    expect($po->total)->toEqual(500000);
});

// ========== TEST 2: SUBMIT PO MELEBIHI RAB ==========
test('submit po melebihi rab ditolak', function () {
    // Buat RAB dengan rencana kecil
    $rab = Rab::factory()
        ->for($this->proyek)
        ->bahanBaku()
        ->create(['rencana' => 100000]);

    // Buat PO draft
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->draft()
        ->create();

    // Tambahkan item PO dengan subtotal 500.000 (melebihi RAB)
    $po->items()->create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'jumlah' => 10,
        'harga_satuan_snapshot' => 50000,
        'subtotal' => 500000,
    ]);

    // Assert: throw exception
    expect(fn () => (new SubmitPurchaseOrderAction)->execute($po))
        ->toThrow(Exception::class, 'RAB bahan_baku melebihi rencana');
});

// ========== TEST 3: APPROVE PO ==========
test('approve po berhasil', function () {
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->create(['status' => 'menunggu_approval_finance']); // set status langsung

    $action = new ApprovePurchaseOrderAction;
    $po = $action->execute($po);

    expect($po->status)->toBeInstanceOf(Disetujui::class);
    expect($po->approvals)->toHaveCount(1);
    expect($po->approvals->first()->status)->toBe('disetujui');
    expect($po->approvals->first()->approved_by)->toBe($this->user->id);
});

// ========== TEST 4: REJECT PO ==========
test('reject po berhasil', function () {
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->diajukan()
        ->create();

    $action = new RejectPurchaseOrderAction;
    $po = $action->execute($po);

    expect($po->status)->toBeInstanceOf(Ditolak::class);
    expect($po->approvals)->toHaveCount(1);
    expect($po->approvals->first()->status)->toBe('ditolak');
});

// ========== TEST 5: RECEIVE PO & STOCK ==========
test('receive po menambah stok', function () {
    // Buat PO dengan status disetujui
    $titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);

    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->disetujui()
        ->create(['titik_id' => $titik->id]); // set titik_id;

    $po->items()->create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'jumlah' => 50,
        'harga_satuan_snapshot' => 10000,
        'subtotal' => 500000,
    ]);

    // Receive PO
    $po->status->transitionTo(Diterima::class);
    (new RecordStockMutationAction)->execute($po);

    // Assert: status menjadi Diterima
    expect($po->status)->toBeInstanceOf(Diterima::class);

    // Assert: stok bertambah
    $stokMutasi = $po->stokMutasis()->first();
    expect($stokMutasi)->not->toBeNull();
    expect($stokMutasi->tipe)->toBe('masuk');
    expect($stokMutasi->jumlah)->toEqual(50);
    expect($stokMutasi->bahan_baku_id)->toBe($this->bahanBaku->id);
});

// ========== TEST 6: PAYMENT PO ==========
test('payment po mengurangi kas', function () {
    // Buat PO dengan status diterima
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->diterima()
        ->create(['total' => 500000]);

    // Catat pembayaran
    $data = [
        'jumlah' => 500000,
        'tanggal' => now()->toDateString(),
        'metode' => 'transfer',
        'akun_kas_bank_id' => $this->akunKas->id,
        'catatan' => 'Pembayaran lunas',
    ];

    $action = new RecordPaymentAction;
    $pembayaran = $action->execute($po, $data);

    // Assert: status menjadi Lunas
    expect($po->status)->toBeInstanceOf(Lunas::class);

    // Assert: ada record pembayaran
    expect($pembayaran)->not->toBeNull();
    expect($pembayaran->jumlah)->toEqual(500000);

    // Assert: kas berkurang
    $mutasi = $po->pembayarans->first()->mutasiKasBank;
    expect($mutasi)->not->toBeNull();
    expect($mutasi->tipe)->toBe('keluar');
    expect($mutasi->jumlah)->toEqual(500000);
    expect($mutasi->akun_kas_bank_id)->toBe($this->akunKas->id);
});

// ========== TEST 7: PAYMENT SEBAGIAN ==========
test('payment sebagian mengubah status menjadi dibayar_sebagian', function () {
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->diterima()
        ->create(['total' => 1000000]);

    $data = [
        'jumlah' => 500000,
        'tanggal' => now()->toDateString(),
        'metode' => 'transfer',
        'akun_kas_bank_id' => $this->akunKas->id,
    ];

    $action = new RecordPaymentAction;
    $action->execute($po, $data);

    // Assert: status menjadi DibayarSebagian
    expect($po->status)->toBeInstanceOf(DibayarSebagian::class);
});

// ========== TEST 8: PO TIDAK BISA SUBMIT KALAU ITEM KOSONG ==========
test('po tanpa item tidak bisa diajukan', function () {
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->draft()
        ->create();

    expect(fn () => (new SubmitPurchaseOrderAction)->execute($po))
        ->toThrow(Exception::class, 'PO tidak memiliki item');
});

// ========== TEST 9: SPAREPART TIDAK DIVALIDASI RAB ==========
test('sparepart tidak divalidasi terhadap rab', function () {
    // Buat RAB dengan rencana kecil
    $rab = Rab::factory()
        ->for($this->proyek)
        ->bahanBaku()
        ->create(['rencana' => 1000]);

    // Buat bahan baku sparepart
    $sparepart = BahanBaku::factory()->sparepart()->create();

    // Buat PO dengan item sparepart
    $po = PurchaseOrder::factory()
        ->for($this->proyek)
        ->draft()
        ->create();

    $po->items()->create([
        'bahan_baku_id' => $sparepart->id,
        'jumlah' => 10,
        'harga_satuan_snapshot' => 500000,
        'subtotal' => 5000000,
    ]);

    // Submit PO - sparepart seharusnya tidak divalidasi, sehingga berhasil
    $action = new SubmitPurchaseOrderAction;
    $po = $action->execute($po);

    expect($po->status)->toBeInstanceOf(MenungguApprovalFinance::class);
});
