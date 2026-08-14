<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Proyek;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, DatabaseTransactions::class);

function createRoleUser(string $roleName, ?string $unitBisnisId = null): User
{
    Role::findOrCreate($roleName);
    $user = User::factory()->create(['unit_bisnis_id' => $unitBisnisId]);
    $user->assignRole($roleName);
    return $user;
}

beforeEach(function () {
    // Seed essential permissions
    $perms = [
        'manage procurement',
        'approve procurement',
        'receive procurement',
        'pay procurement',
        'manage bahan baku',
        'manage supplier',
        'view procurement',
    ];
    foreach ($perms as $p) {
        Permission::findOrCreate($p);
    }

    $this->unitGcs = UnitBisnis::factory()->gcs()->create();
    $this->unitCbp = UnitBisnis::factory()->cbp()->create();

    $this->supplier = Supplier::factory()->create();
    $this->bahanBakuProduksi = BahanBaku::factory()->bahanBaku()->create();
    $this->sparepart = BahanBaku::factory()->sparepart()->create();

    $this->proyekInternal = Proyek::factory()->for($this->unitGcs)->internal()->create();
    $this->proyekKontrak = Proyek::factory()->for($this->unitGcs)->kontrakKlien()->create();
});

test('owner can approve po with any amount', function () {
    $owner = createRoleUser('Owner');

    $po = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 150000000]);
    $po->items()->create([
        'bahan_baku_id' => $this->bahanBakuProduksi->id,
        'jumlah' => 10,
        'harga_satuan_snapshot' => 15000000,
        'subtotal' => 150000000,
    ]);

    expect($owner->can('approve', $po))->toBeTrue();
    expect($owner->can('viewAny', PurchaseOrder::class))->toBeTrue();
    expect($owner->can('create', PurchaseOrder::class))->toBeTrue();
    expect($owner->can('receive', $po))->toBeTrue();
    expect($owner->can('pay', $po))->toBeTrue();
});

test('admin keuangan can approve any nominal and pay po', function () {
    $admin = createRoleUser('Admin Keuangan');

    $po = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 100000000]);

    expect($admin->can('approve', $po))->toBeTrue();
    expect($admin->can('pay', $po))->toBeTrue();
    expect($admin->can('receive', $po))->toBeFalse();
});

test('koordinator procurement can create and receive po but not approve or pay', function () {
    $proc = createRoleUser('Koordinator Procurement');

    $po = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 10000000]);

    expect($proc->can('create', PurchaseOrder::class))->toBeTrue();
    expect($proc->can('receive', $po))->toBeTrue();
    expect($proc->can('approve', $po))->toBeFalse();
    expect($proc->can('pay', $po))->toBeFalse();
});

test('ketua divisi finance can approve up to 50jt and can pay', function () {
    $ketuaFinance = createRoleUser('Ketua Divisi Finance');

    $poUnderLimit = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 50000000]);
    $poOverLimit = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 50000001]);

    expect($ketuaFinance->can('approve', $poUnderLimit))->toBeTrue();
    expect($ketuaFinance->can('approve', $poOverLimit))->toBeFalse();
    expect($ketuaFinance->can('pay', $poUnderLimit))->toBeTrue();
});

test('ketua divisi armada can approve up to 25jt only for sparepart armada', function () {
    $ketuaArmada = createRoleUser('Ketua Divisi Armada', $this->unitGcs->id);

    // Sparepart PO under 25jt
    $poSparepartOk = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 25000000]);
    $poSparepartOk->items()->create([
        'bahan_baku_id' => $this->sparepart->id,
        'jumlah' => 5,
        'harga_satuan_snapshot' => 5000000,
        'subtotal' => 25000000,
    ]);

    // Sparepart PO over 25jt
    $poSparepartOver = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 26000000]);
    $poSparepartOver->items()->create([
        'bahan_baku_id' => $this->sparepart->id,
        'jumlah' => 6,
        'harga_satuan_snapshot' => 4333333,
        'subtotal' => 26000000,
    ]);

    // Non-sparepart PO under 25jt
    $poBahanBaku = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 10000000]);
    $poBahanBaku->items()->create([
        'bahan_baku_id' => $this->bahanBakuProduksi->id,
        'jumlah' => 10,
        'harga_satuan_snapshot' => 1000000,
        'subtotal' => 10000000,
    ]);

    expect($ketuaArmada->can('approve', $poSparepartOk))->toBeTrue();
    expect($ketuaArmada->can('approve', $poSparepartOver))->toBeFalse();
    expect($ketuaArmada->can('approve', $poBahanBaku))->toBeFalse();
});

test('ketua divisi produksi can approve up to 20jt only for bahan baku produksi', function () {
    $ketuaProduksi = createRoleUser('Ketua Divisi Produksi CBP', $this->unitGcs->id);

    // Bahan baku PO under 20jt
    $poBahanBakuOk = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 20000000]);
    $poBahanBakuOk->items()->create([
        'bahan_baku_id' => $this->bahanBakuProduksi->id,
        'jumlah' => 20,
        'harga_satuan_snapshot' => 1000000,
        'subtotal' => 20000000,
    ]);

    // Bahan baku PO over 20jt
    $poBahanBakuOver = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 21000000]);
    $poBahanBakuOver->items()->create([
        'bahan_baku_id' => $this->bahanBakuProduksi->id,
        'jumlah' => 21,
        'harga_satuan_snapshot' => 1000000,
        'subtotal' => 21000000,
    ]);

    // Sparepart PO under 20jt
    $poSparepart = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 15000000]);
    $poSparepart->items()->create([
        'bahan_baku_id' => $this->sparepart->id,
        'jumlah' => 15,
        'harga_satuan_snapshot' => 1000000,
        'subtotal' => 15000000,
    ]);

    expect($ketuaProduksi->can('approve', $poBahanBakuOk))->toBeTrue();
    expect($ketuaProduksi->can('approve', $poBahanBakuOver))->toBeFalse();
    expect($ketuaProduksi->can('approve', $poSparepart))->toBeFalse();
});

test('ketua divisi kontraktor can approve up to 30jt only for project kontrak klien', function () {
    $ketuaKontraktor = createRoleUser('Ketua Divisi Kontraktor', $this->unitGcs->id);

    // Contract client PO under 30jt
    $poKontrakOk = PurchaseOrder::factory()->for($this->proyekKontrak)->create(['total' => 30000000]);

    // Contract client PO over 30jt
    $poKontrakOver = PurchaseOrder::factory()->for($this->proyekKontrak)->create(['total' => 31000000]);

    // Internal project PO under 30jt
    $poInternal = PurchaseOrder::factory()->for($this->proyekInternal)->create(['total' => 10000000]);

    expect($ketuaKontraktor->can('approve', $poKontrakOk))->toBeTrue();
    expect($ketuaKontraktor->can('approve', $poKontrakOver))->toBeFalse();
    expect($ketuaKontraktor->can('approve', $poInternal))->toBeFalse();
});

test('creator can view their own po even without division role', function () {
    $regularUser = User::factory()->create();
    $po = PurchaseOrder::factory()->for($this->proyekInternal)->create([
        'created_by' => $regularUser->id,
    ]);

    expect($regularUser->can('view', $po))->toBeTrue();
});

test('bahan baku and supplier policies permit procurement coordinator and owner', function () {
    $owner = createRoleUser('Owner');
    $proc = createRoleUser('Koordinator Procurement');
    $regular = User::factory()->create();

    expect($owner->can('create', BahanBaku::class))->toBeTrue();
    expect($proc->can('create', BahanBaku::class))->toBeTrue();
    expect($regular->can('create', BahanBaku::class))->toBeFalse();

    expect($owner->can('create', Supplier::class))->toBeTrue();
    expect($proc->can('create', Supplier::class))->toBeTrue();
    expect($regular->can('create', Supplier::class))->toBeFalse();
});
