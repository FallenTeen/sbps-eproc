<?php

use App\Models\User;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Models\Ritase;
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

    // Buat rute dan ritase untuk anomali
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

test('koordinator can view bbm index', function () {
    $this->actingAs($this->koordinator)
        ->get(route('fleet.bbm.index'))
        ->assertStatus(200);
});

test('koordinator can view standalone bbm create form', function () {
    $this->actingAs($this->koordinator)
        ->get(route('fleet.bbm.create'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/BBM/Create')
            ->has('serviceables.armada')
            ->has('serviceables.mesin_produksi')
        );
});

test('koordinator can create bbm log', function () {
    $data = [
        'serviceable_type' => 'armada',
        'serviceable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'liter' => 100,
        'biaya' => 500000,
        'jam_operasional_saat_isi' => 8.5,
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.bbm.store'), $data)
        ->assertRedirect();

    $this->assertDatabaseHas('bbm_logs', [
        'serviceable_id' => $this->armada->id,
        'liter' => 100,
    ]);
});

test('anomaly detection uses rute tarif', function () {
    // Buat BBM dengan konsumsi tinggi (anomali)
    BbmLog::factory()->create([
        'serviceable_type' => Armada::class,
        'serviceable_id' => $this->armada->id,
        'liter' => 100, // Estimasi seharusnya: 50km * 0.3 * 4 rit = 60L -> 100 > 60*1.2 = 72, anomali!
    ]);

    $this->actingAs($this->koordinator)
        ->get(route('fleet.bbm.anomaly'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/BBM/Anomaly')
            ->has('anomalies')
        );
});

test('anomaly uses fallback if no rute', function () {
    // Buat armada tanpa ritase (tidak ada rute)
    $armada2 = Armada::factory()->create(['unit_bisnis_id' => $this->armada->unit_bisnis_id]);
    BbmLog::factory()->create([
        'serviceable_type' => Armada::class,
        'serviceable_id' => $armada2->id,
        'liter' => 200,
    ]);

    $this->actingAs($this->koordinator)
        ->get(route('fleet.bbm.anomaly'))
        ->assertStatus(200); // Harus tetap jalan dengan fallback
});

test('bbm with purchase_order_id requires valid po', function () {
    $data = [
        'serviceable_type' => 'armada',
        'serviceable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'liter' => 50,
        'purchase_order_id' => 'invalid-uuid',
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.bbm.store'), $data)
        ->assertSessionHasErrors('purchase_order_id');
});
