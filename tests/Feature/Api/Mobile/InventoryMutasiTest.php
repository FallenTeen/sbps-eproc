<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Production\Models\ProductionSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    [$this->user, $this->token] = createMobileUserWithToken('Inventory');

    $this->unit = UnitBisnis::factory()->create(['kode' => 'U-'.Str::uuid()]);
    $proyek = Proyek::factory()->for($this->unit)->internal()->create([
        'created_by' => $this->user->id,
    ]);
    $this->titik = Titik::factory()->for($proyek)->create();

    $this->bahanBaku = BahanBaku::factory()->create(['kategori' => 'bahan_baku', 'nama' => 'Semen']);
    $this->sparepart = BahanBaku::factory()->create(['kategori' => 'sparepart', 'nama' => 'Filter Oli']);
});

test('mutasi masuk via PO — GET /inventory/mutasi menampilkan baris dengan sumber pembelian', function () {
    $po = PurchaseOrder::factory()->create();

    StokMutasi::create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'titik_id' => $this->titik->id,
        'tipe' => 'masuk',
        'jumlah' => 100,
        'referensi_type' => PurchaseOrder::class,
        'referensi_id' => $po->id,
        'catatan' => "Penerimaan PO {$po->kode_po}",
        'tanggal' => now()->subDay()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/inventory/mutasi')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.nama_barang', 'Semen')
        ->assertJsonPath('data.items.0.tipe', 'masuk')
        ->assertJsonPath('data.items.0.sumber', 'pembelian')
        ->assertJsonPath('data.items.0.created_by', $this->user->nama_lengkap ?? $this->user->name);
});

test('mutasi keluar produksi — sumber produksi; filter tanggal_mulai berfungsi', function () {
    StokMutasi::create([
        'bahan_baku_id' => $this->sparepart->id,
        'titik_id' => $this->titik->id,
        'tipe' => 'keluar',
        'jumlah' => 5,
        'referensi_type' => ProductionSession::class,
        'referensi_id' => (string) Str::uuid(),
        'tanggal' => now()->subDays(5)->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/inventory/mutasi?tanggal_mulai='.now()->subDays(3)->toDateString())
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 0);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/inventory/mutasi')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.sumber', 'produksi')
        ->assertJsonPath('data.items.0.tipe', 'keluar');
});

test('filter kategori sparepart memfilter hasil', function () {
    StokMutasi::create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'titik_id' => $this->titik->id,
        'tipe' => 'masuk',
        'jumlah' => 10,
        'tanggal' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/inventory/mutasi?kategori=sparepart')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 0);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/inventory/mutasi?kategori=bahan_baku')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.sumber', 'manual');
});

test('GET /inventory/materials/{id}/mutasi difilter per barang', function () {
    StokMutasi::create([
        'bahan_baku_id' => $this->bahanBaku->id,
        'titik_id' => $this->titik->id,
        'tipe' => 'masuk',
        'jumlah' => 10,
        'tanggal' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);
    StokMutasi::create([
        'bahan_baku_id' => $this->sparepart->id,
        'titik_id' => $this->titik->id,
        'tipe' => 'masuk',
        'jumlah' => 3,
        'tanggal' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/inventory/materials/'.$this->sparepart->id.'/mutasi')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.nama_barang', 'Filter Oli');

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/inventory/materials/'.Str::uuid().'/mutasi')
        ->assertNotFound();
});