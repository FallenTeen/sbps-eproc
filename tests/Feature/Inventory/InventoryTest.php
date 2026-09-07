<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Inventory\Actions\CreateStokOpnameAction;
use App\Domain\Inventory\Models\StokOpname;
use App\Domain\Procurement\Actions\GetStokSaldoAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\StokMutasi;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Permission::findOrCreate('manage stok opname');
    Permission::findOrCreate('view stok opname');
    Permission::findOrCreate('manage inventory');
    Permission::findOrCreate('view inventory');
    \Spatie\Permission\Models\Role::findOrCreate('Inventory', 'web');

    $this->unit = UnitBisnis::factory()->create(['kode' => 'U-'.((string) Illuminate\Support\Str::uuid())]);
    $this->proyek = Proyek::factory()->for($this->unit)->internal()->create(['created_by' => (User::factory()->create())->id]);
    $this->titik = Titik::factory()->for($this->proyek)->create();

    $this->inventory = User::factory()->create(['is_active' => true]);
    $this->inventory->givePermissionTo(['manage stok opname', 'view stok opname', 'manage inventory', 'view inventory']);
    $this->inventory->syncRoles(['Inventory']);

    $this->bahanBaku = BahanBaku::factory()->create(['kategori' => 'bahan_baku']);
    $this->sparepart = BahanBaku::factory()->create(['kategori' => 'sparepart']);

    StokMutasi::create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'titik_id' => $this->titik->id,
        'tipe' => 'masuk',
        'jumlah' => 100,
        'tanggal' => now()->subDay()->toDateString(),
        'created_by' => $this->inventory->id,
    ]);
    StokMutasi::create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'titik_id' => $this->titik->id,
        'tipe' => 'keluar',
        'jumlah' => 30,
        'tanggal' => now()->toDateString(),
        'created_by' => $this->inventory->id,
    ]);
});

test('GetStokSaldoAction menghitung saldo on-the-fly (masuk - keluar)', function () {
    $saldo = (new GetStokSaldoAction)->execute($this->bahanBaku, $this->titik->id);
    expect($saldo)->toBe(70.0);
});

test('CreateStokOpnameAction mencatat saldo_sistem snapshot + selisih terhitung', function () {
    $created = (new CreateStokOpnameAction)->execute($this->inventory, $this->titik->id, now()->toDateString(), [
        ['bahan_baku_id' => $this->bahanBaku->id, 'saldo_fisik' => 65],
        ['bahan_baku_id' => $this->sparepart->id, 'saldo_fisik' => 10],
    ]);

    expect($created)->toHaveCount(2);

    $baris = StokOpname::where('bahan_baku_id', $this->bahanBaku->id)->first();
    expect($baris->saldo_sistem)->toBe(70.0);
    expect($baris->saldo_fisik)->toBe(65.0);
    expect($baris->selisih)->toBe(-5.0);
    expect($baris->dicatat_oleh)->toBe($this->inventory->id);
});

test('opname idempoten: updateOrCreate per (item,titik,tanggal) tidak dobel', function () {
    (new CreateStokOpnameAction)->execute($this->inventory, $this->titik->id, today()->toDateString(), [
        ['bahan_baku_id' => $this->bahanBaku->id, 'saldo_fisik' => 70],
    ]);
    (new CreateStokOpnameAction)->execute($this->inventory, $this->titik->id, today()->toDateString(), [
        ['bahan_baku_id' => $this->bahanBaku->id, 'saldo_fisik' => 60],
    ]);

    expect(StokOpname::where('bahan_baku_id', $this->bahanBaku->id)->count())->toBe(1);
    expect(StokOpname::where('bahan_baku_id', $this->bahanBaku->id)->value('saldo_fisik'))->toBe(60.0);
});

test('role Inventory bisa membuka halaman stok opname (index + create) via web', function () {
    $this->actingAs($this->inventory)
        ->get(route('inventory.stok-opname.index'))
        ->assertOk();

    $this->actingAs($this->inventory)
        ->get(route('inventory.stok-opname.create'))
        ->assertOk();
});

test('user tanpa permission stok opname tidak bisa membuka halaman', function () {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->get(route('inventory.stok-opname.index'))
        ->assertForbidden();
});

test('PIC mencoba buka / di-cookies, role Inventory bisa catat opname via web POST', function () {
    $this->actingAs($this->inventory)
        ->post(route('inventory.stok-opname.store'), [
            'titik_id' => $this->titik->id,
            'tanggal' => now()->toDateString(),
            'items' => [
                ['bahan_baku_id' => $this->bahanBaku->id, 'saldo_fisik' => 70],
            ],
        ])
        ->assertRedirect(route('inventory.stok-opname.index'))
        ->assertSessionHas('success');

    expect(StokOpname::where('bahan_baku_id', $this->bahanBaku->id)->count())->toBe(1);
});

test('dashboard inventory menampilkan metrik untuk role Inventory', function () {
    (new CreateStokOpnameAction)->execute($this->inventory, $this->titik->id, today()->toDateString(), [
        ['bahan_baku_id' => $this->bahanBaku->id, 'saldo_fisik' => 70],
    ]);

    $this->actingAs($this->inventory)
        ->get(route('inventory.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Inventory/Dashboard/Index')
            ->has('metrics.total_item')
            ->has('metrics.mendekati_habis')
        );
});
