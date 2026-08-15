<?php

use App\Models\User;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\DowntimeLog;
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
});

test('koordinator can view downtime index', function () {
    $this->actingAs($this->koordinator)
        ->get(route('fleet.downtime.index', [
            'type' => 'armada',
            'id' => $this->armada->id,
        ]))
        ->assertStatus(200);
});

test('koordinator can start downtime', function () {
    $data = [
        'serviceable_type' => 'armada',
        'serviceable_id' => $this->armada->id,
        'penyebab' => 'Engine failure',
        'kategori' => 'kerusakan',
        'catatan' => 'Need spare parts',
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.downtime.store'), $data)
        ->assertRedirect();

    $this->assertDatabaseHas('downtime_logs', [
        'serviceable_id' => $this->armada->id,
        'penyebab' => 'Engine failure',
        'selesai' => null, // masih aktif
    ]);
});

test('cannot start downtime if active downtime exists', function () {
    // Buat downtime aktif
    DowntimeLog::factory()->create([
        'serviceable_type' => Armada::class,
        'serviceable_id' => $this->armada->id,
        'selesai' => null,
    ]);

    $data = [
        'serviceable_type' => 'armada',
        'serviceable_id' => $this->armada->id,
        'penyebab' => 'Another issue',
        'kategori' => 'lainnya',
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.downtime.store'), $data)
        ->assertSessionHasErrors();
});

test('koordinator can end downtime', function () {
    $downtime = DowntimeLog::factory()->create([
        'serviceable_type' => Armada::class,
        'serviceable_id' => $this->armada->id,
        'selesai' => null,
    ]);

    $this->actingAs($this->koordinator)
        ->post(route('fleet.downtime.end', $downtime))
        ->assertRedirect();

    $downtime->refresh();
    expect($downtime->selesai)->not->toBeNull();
});

test('driver cannot start downtime', function () {
    $data = [
        'serviceable_type' => 'armada',
        'serviceable_id' => $this->armada->id,
        'penyebab' => 'Test',
        'kategori' => 'kerusakan',
    ];

    $this->actingAs($this->user)
        ->post(route('fleet.downtime.store'), $data)
        ->assertStatus(403);
});