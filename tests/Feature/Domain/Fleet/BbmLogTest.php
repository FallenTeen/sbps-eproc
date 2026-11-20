<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->koordinator = User::factory()->create();
    $this->koordinator->assignRole('Koordinator GCS');

    $this->user = User::factory()->create();
    $this->user->assignRole('Driver Standby');

    $unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->create(['unit_bisnis_id' => $unit->id]);

    $this->rute = RuteTarif::factory()->create([
        'unit_bisnis_id' => $unit->id,
        'jarak_km' => 50,
        'indeks_liter_solar_per_km' => 0.3,
    ]);
    $this->ritase = Ritase::factory()->create([
        'armada_id' => $this->armada->id,
        'rute_tarif_id' => $this->rute->id,
        'jumlah_rit' => 4,
    ]);
});

test('halaman BBM lama dialihkan ke pengisian solar', function () {
    $this->actingAs($this->koordinator)
        ->get('/fleet/bbm')
        ->assertRedirect(route('fleet.pengisian-solar.index'));

    $this->actingAs($this->koordinator)
        ->get('/fleet/bbm/anomaly')
        ->assertRedirect(route('fleet.pengisian-solar.index'));
});

test('form create BBM legacy tidak tersedia', function () {
    $this->actingAs($this->koordinator)
        ->get('/fleet/bbm/create')
        ->assertNotFound();
});

test('pengiriman BBM legacy tidak bisa membuat log', function () {
    $this->actingAs($this->koordinator)
        ->post('/fleet/bbm', [
            'serviceable_type' => 'armada',
            'serviceable_id' => $this->armada->id,
            'tanggal' => now()->toDateString(),
            'liter' => 100,
            'biaya' => 500000,
        ])
        ->assertNotFound();

    expect(BbmLog::count())->toBe(0);
});

test('anomaly detection uses rute tarif', function () {
    BbmLog::factory()->create([
        'serviceable_type' => Armada::class,
        'serviceable_id' => $this->armada->id,
        'liter' => 100,
    ]);

    $this->actingAs($this->koordinator)
        ->get('/fleet/bbm/anomaly')
        ->assertRedirect(route('fleet.pengisian-solar.index'));
});

test('anomaly fallback tetap mengarah ke solar', function () {
    $armada2 = Armada::factory()->create(['unit_bisnis_id' => $this->armada->unit_bisnis_id]);
    BbmLog::factory()->create([
        'serviceable_type' => Armada::class,
        'serviceable_id' => $armada2->id,
        'liter' => 200,
    ]);

    $this->actingAs($this->koordinator)
        ->get('/fleet/bbm/anomaly')
        ->assertRedirect(route('fleet.pengisian-solar.index'));
});

test('validasi purchase order BBM legacy tidak lagi relevan', function () {
    $this->actingAs($this->koordinator)
        ->post('/fleet/bbm', [
            'serviceable_type' => 'armada',
            'serviceable_id' => $this->armada->id,
            'tanggal' => now()->toDateString(),
            'liter' => 50,
            'purchase_order_id' => 'invalid-uuid',
        ])
        ->assertNotFound();
});
