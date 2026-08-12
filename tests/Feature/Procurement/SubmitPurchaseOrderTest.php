<?php
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Procurement\Actions\SubmitPurchaseOrderAction;

test('submit po validasi rab berhasil', function () {
    $unit = UnitBisnis::factory()->create(['kode' => 'GCS']);
    $proyek = Proyek::factory()->create(['unit_bisnis_id' => $unit->id]);
    $rab = Rab::factory()->create(['proyek_id' => $proyek->id, 'kategori' => 'bahan_baku', 'rencana' => 1000000]);
    $po = PurchaseOrder::factory()->create(['proyek_id' => $proyek->id, 'status' => 'draft']);
    $item = $po->items()->create(['bahan_baku_id' => 1, 'jumlah' => 10, 'harga_satuan_snapshot' => 50000, 'subtotal' => 500000]);

    $action = new SubmitPurchaseOrderAction();
    $po = $action->execute($po);

    expect($po->status)->toBeInstanceOf(\App\Domain\Procurement\States\Diajukan::class);
});

test('submit po melebihi rab ditolak', function () {
    // ... expect exception
})->throws(\Exception::class);
