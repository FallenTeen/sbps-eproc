<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    [$this->user, $this->token] = createMobileUserWithToken('Mandor Titik');
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);

    $this->produk = Produk::factory()->split()->create();
    $this->mesin = MesinProduksi::create([
        'unit_bisnis_id' => UnitBisnis::factory()->create()->id,
        'nama' => 'Mesin AMP Test',
        'jenis' => 'mixer_aspal',
        'kapasitas' => 50,
        'status' => 'aktif',
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'biaya_per_jam' => 500000,
    ]);
});

test('mulai sesi produksi membuat sesi berjalan', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/produksi/mulai', [
            'mesin_id' => $this->mesin->id,
            'produk_id' => $this->produk->id,
            'titik_id' => $this->titik->id,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.status', 'berjalan')
        ->assertJsonPath('data.mesin.id', $this->mesin->id);

    $this->assertDatabaseHas('production_sessions', [
        'operator_karyawan_id' => $this->karyawan->id,
        'status' => 'berjalan',
    ]);
});

test('selesai sesi produksi menutup sesi', function () {
    $mulai = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/produksi/mulai', [
            'mesin_id' => $this->mesin->id,
            'produk_id' => $this->produk->id,
        ])
        ->assertStatus(201)
        ->json('data');

    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/produksi/selesai/{$mulai['id']}", [
            'hasil_output' => 12,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'selesai');

    $this->assertDatabaseHas('production_sessions', [
        'id' => $mulai['id'],
        'status' => 'selesai',
    ]);
});

test('selesai sesi milik operator lain ditolak', function () {
    $operatorLain = Karyawan::factory()->create();

    $session = ProductionSession::create([
        'mesin_id' => $this->mesin->id,
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'operator_karyawan_id' => $operatorLain->id,
        'mulai' => now(),
        'status' => 'berjalan',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/produksi/selesai/{$session->id}", [
            'hasil_output' => 5,
        ])
        ->assertStatus(403);
});

test('sesi aktif hanya menampilkan sesi berjalan milik sendiri', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/produksi/mulai', [
            'mesin_id' => $this->mesin->id,
            'produk_id' => $this->produk->id,
        ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/produksi/sesi-aktif')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('riwayat produksi terpaginate', function () {
    ProductionSession::create([
        'mesin_id' => $this->mesin->id,
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'operator_karyawan_id' => $this->karyawan->id,
        'mulai' => now()->subDay(),
        'selesai' => now()->subDay()->addHours(6),
        'hasil_output' => 8,
        'status' => 'selesai',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/produksi/riwayat')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 1);
});
