<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\Rab;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Actions\SubmitPurchaseOrderAction;
use App\Domain\Procurement\Actions\ApprovePurchaseOrderAction;
use App\Domain\Procurement\States\MenungguApprovalFinance;
use App\Domain\Procurement\States\MenungguApprovalOwner;
use App\Domain\Procurement\States\Disetujui;
use App\Domain\Procurement\States\Ditolak;
use App\Domain\Finance\Models\AkunKasBank;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, DatabaseTransactions::class);

function makeUserWithRole(string $role): User
{
    Role::findOrCreate($role);
    $user = User::factory()->create();
    $user->assignRole($role);
    return $user;
}

function makeOwner(): User
{
    return makeUserWithRole('Owner');
}

function makeAdminKeuangan(): User
{
    Permission::findOrCreate('manage finance');
    $user = makeUserWithRole('Admin Keuangan');
    $user->givePermissionTo('manage finance');
    return $user;
}

function makeKoordinatorProcurement(): User
{
    Permission::findOrCreate('manage procurement');
    $user = User::factory()->create();
    $user->givePermissionTo('manage procurement');
    return $user;
}

beforeEach(function () {
    $this->owner         = makeOwner();
    $this->adminKeuangan = makeAdminKeuangan();
    $this->unit          = UnitBisnis::factory()->gcs()->create();
    $this->proyek        = Proyek::factory()->for($this->unit)->internal()->create([
        'created_by' => $this->owner->id,
    ]);
    $this->titik         = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
    $this->akunKas       = AkunKasBank::factory()->create([
        'unit_bisnis_id' => $this->unit->id,
        'saldo_awal'     => 50_000_000,
    ]);
    $this->bahanBaku     = BahanBaku::factory()->bahanBaku()->create();
    $this->sparepart     = BahanBaku::factory()->sparepart()->create();
});

// =========================================================
// Hak Akses Modul
// =========================================================

describe('Hak Akses per Role', function () {
    test('user tanpa role tidak bisa akses halaman procurement', function () {
        $tanpaRole = User::factory()->create();
        $this->actingAs($tanpaRole);

        $this->get(route('procurement.purchase-orders.index'))
            ->assertStatus(403);
    });

    test('user tanpa permission manage fleet tidak bisa akses halaman armada', function () {
        $tanpaRole = User::factory()->create();
        $this->actingAs($tanpaRole);

        $this->get(route('fleet.armada.index'))
            ->assertStatus(403);
    });

    test('Owner bisa akses semua halaman utama', function () {
        $this->actingAs($this->owner);

        $this->get(route('dashboard'))->assertOk();
        $this->get(route('procurement.purchase-orders.index'))->assertOk();
    });

    test('Admin Keuangan bisa akses halaman finance', function () {
        $this->actingAs($this->adminKeuangan);

        $this->get(route('finance.akun-kas.index'))->assertOk();
    });

    test('Koordinator Procurement bisa akses PO tetapi tidak bisa akses finance', function () {
        $koordinator = makeKoordinatorProcurement();
        $this->actingAs($koordinator);

        $this->get(route('procurement.purchase-orders.index'))->assertOk();
        $this->get(route('finance.laporan-keuangan.index'))->assertStatus(403);
    });
});

// =========================================================
// PO: Owner Override RAB
// =========================================================

describe('PO: Owner dapat Override RAB yang Melebihi Rencana', function () {
    test('owner dapat submit PO yang melebihi RAB bahan baku', function () {
        $this->actingAs($this->owner);

        Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 100_000]);

        $po = PurchaseOrder::factory()->for($this->proyek)->draft()->create([
            'created_by' => $this->owner->id,
        ]);
        $po->items()->create([
            'bahan_baku_id'         => $this->bahanBaku->id,
            'jumlah'                => 10,
            'harga_satuan_snapshot' => 50_000,
            'subtotal'              => 500_000, // melebihi RAB 100.000
        ]);

        // Submit PO oleh Owner
        $po = (new SubmitPurchaseOrderAction())->execute($po);

        expect($po->status)->toBeInstanceOf(MenungguApprovalFinance::class);
        expect($po->total)->toEqual(500_000);
    });

    test('non-owner tidak bisa submit PO yang melebihi RAB', function () {
        $koordinator = makeKoordinatorProcurement();
        $this->actingAs($koordinator);

        Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 100_000]);

        $po = PurchaseOrder::factory()->for($this->proyek)->draft()->create([
            'created_by' => $koordinator->id,
        ]);
        $po->items()->create([
            'bahan_baku_id'         => $this->bahanBaku->id,
            'jumlah'                => 10,
            'harga_satuan_snapshot' => 50_000,
            'subtotal'              => 500_000,
        ]);

        expect(fn () => (new SubmitPurchaseOrderAction())->execute($po))
            ->toThrow(\Exception::class);
    });
});

// =========================================================
// PO: Alur Approval Berdasarkan Nominal
// =========================================================

describe('Alur Approval PO Berdasarkan Nominal (Threshold Finance vs Owner)', function () {
    test('PO nominal kecil masuk menunggu approval finance', function () {
        $this->actingAs($this->owner);

        // Buat RAB agar validasi lolos
        Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 10_000_000]);

        $po = PurchaseOrder::factory()->for($this->proyek)->draft()->create();
        $po->items()->create([
            'bahan_baku_id'         => $this->bahanBaku->id,
            'jumlah'                => 5,
            'harga_satuan_snapshot' => 100_000,
            'subtotal'              => 500_000, // di bawah threshold owner
        ]);

        $po = (new SubmitPurchaseOrderAction())->execute($po);

        expect($po->status)->toBeInstanceOf(MenungguApprovalFinance::class);
    });

    test('PO nominal besar masuk menunggu approval owner', function () {
        $this->actingAs($this->owner);

        // Buat RAB agar validasi lolos
        Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 100_000_000]);

        $po = PurchaseOrder::factory()->for($this->proyek)->draft()->create();
        $po->items()->create([
            'bahan_baku_id'         => $this->bahanBaku->id,
            'jumlah'                => 100,
            'harga_satuan_snapshot' => 500_000,
            'subtotal'              => 50_000_000, // di atas threshold owner (misal 10.000.000)
        ]);

        $po = (new SubmitPurchaseOrderAction())->execute($po);

        expect($po->status)->toBeInstanceOf(MenungguApprovalOwner::class);
    });

    test('admin keuangan dapat approve PO di level finance', function () {
        $this->actingAs($this->adminKeuangan);

        $po = PurchaseOrder::factory()->for($this->proyek)->create([
            'status' => 'menunggu_approval_finance',
        ]);

        $po = (new ApprovePurchaseOrderAction())->execute($po);

        expect($po->status)->toBeInstanceOf(Disetujui::class);
        expect($po->approvals->first()->approved_by)->toBe($this->adminKeuangan->id);
    });
});

// =========================================================
// Portal Kontraktor: Hak Akses Terbatas
// =========================================================

describe('Portal Kontraktor - Akses Terbatas per Proyek', function () {
    test('kontraktor hanya bisa akses proyek kontrak klien miliknya', function () {
        $roleKontraktor = Role::findOrCreate('Kontraktor');
        $roleKontraktor->syncPermissions([]);
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        $kontraktor = User::factory()->create();
        $kontraktor->assignRole($roleKontraktor);
        $this->actingAs($kontraktor);

        $proyekKontrak = Proyek::factory()->for($this->unit)->kontrakKlien()->create([
            'created_by' => $this->owner->id,
            'client'     => 'PT Kontraktor Test',
        ]);

        // Kontraktor bisa akses portal kontraktor
        $this->get(route('kontraktor.dashboard'))->assertOk();

        // Kontraktor tidak bisa akses modul internal
        $this->get(route('procurement.purchase-orders.index'))->assertStatus(403);
        $this->get(route('hr.karyawan.index'))->assertStatus(403);
        $this->get(route('finance.akun-kas.index'))->assertStatus(403);
    });
});

// =========================================================
// Negative Test: Validasi Input
// =========================================================

describe('Negative Test - Validasi Input', function () {
    test('PO tanpa item tidak bisa diajukan', function () {
        $this->actingAs($this->owner);

        $po = PurchaseOrder::factory()->for($this->proyek)->draft()->create();

        expect(fn () => (new SubmitPurchaseOrderAction())->execute($po))
            ->toThrow(\Exception::class, 'PO tidak memiliki item');
    });

    test('approve PO oleh user tanpa permission ditolak via HTTP 403', function () {
        $tanpaRole = User::factory()->create();
        $this->actingAs($tanpaRole);

        $po = PurchaseOrder::factory()->for($this->proyek)->create([
            'status' => 'menunggu_approval_finance',
        ]);

        $this->post(route('procurement.purchase-orders.approve', $po->id))
            ->assertStatus(403);
    });

    test('submit PO dengan nominal negatif ditolak dengan validation error', function () {
        $this->actingAs($this->owner);

        $this->post(route('procurement.purchase-orders.store'), [
            'proyek_id'             => $this->proyek->id,
            'supplier_id'           => Supplier::factory()->create()->id,
            'tanggal_pesan'         => now()->toDateString(),
            'catatan'               => 'Test',
            'items'                 => [
                [
                    'bahan_baku_id'         => $this->bahanBaku->id,
                    'jumlah'                => -5,
                    'harga_satuan_snapshot' => 10_000,
                ],
            ],
        ])->assertSessionHasErrors('items.0.jumlah');
    });

    test('sparepart tidak divalidasi terhadap RAB bahan baku', function () {
        $this->actingAs($this->owner);

        // RAB bahan_baku kecil
        Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 1_000]);

        $po = PurchaseOrder::factory()->for($this->proyek)->draft()->create();
        $po->items()->create([
            'bahan_baku_id'         => $this->sparepart->id,
            'jumlah'                => 10,
            'harga_satuan_snapshot' => 500_000,
            'subtotal'              => 5_000_000, // jauh melebihi RAB bahan_baku
        ]);

        // Sparepart seharusnya lolos karena tidak diperiksa terhadap RAB
        $po = (new SubmitPurchaseOrderAction())->execute($po);
        expect($po->status)->toBeInstanceOf(MenungguApprovalFinance::class);
    });
});

// =========================================================
// Audit Trail: Perubahan Data Sensitif Tercatat
// =========================================================

describe('Audit Trail - Perubahan Data Sensitif', function () {
    test('perubahan status PO tercatat di purchase_order_approvals', function () {
        $this->actingAs($this->adminKeuangan);

        $po = PurchaseOrder::factory()->for($this->proyek)->create([
            'status' => 'menunggu_approval_finance',
        ]);

        (new ApprovePurchaseOrderAction())->execute($po);

        $this->assertDatabaseHas('purchase_order_approvals', [
            'purchase_order_id' => $po->id,
            'approved_by'       => $this->adminKeuangan->id,
            'status'            => 'disetujui',
        ]);
    });
});
