<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->create([
        'tipe_unit' => 'armada_jalan',
        'plat_nomor' => 'B 1234 ARM',
        'kode_unit' => 'ARM-EDIT-001',
        'model_tarif' => 'ritase',
        'tara_master_kg' => 8500,
    ]);

    $this->owner = User::factory()->create(['is_active' => true]);
    $this->owner->assignRole('Owner');

    $this->payload = function (array $overrides = []): array {
        return array_merge([
            'plat_nomor' => $this->armada->plat_nomor,
            'kode_unit' => $this->armada->kode_unit,
            'jenis' => $this->armada->jenis,
            'tipe_unit' => $this->armada->tipe_unit,
            'model_tarif' => $this->armada->model_tarif,
            'tahun' => $this->armada->tahun,
            'kapasitas' => $this->armada->kapasitas,
            'titik_id' => $this->armada->titik_id,
            'status' => $this->armada->status,
            'tanggal_mulai_pakai' => $this->armada->tanggal_mulai_pakai?->toDateString(),
            'tara_master_kg' => (string) $this->armada->tara_master_kg,
        ], $overrides);
    };
});

test('edit armada mengirim formDefaults lengkap untuk form', function () {
    $this->actingAs($this->owner)
        ->get(route('fleet.armada.edit', $this->armada))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/Armada/Edit')
            ->where('formDefaults.kode_unit', $this->armada->kode_unit)
            ->where('formDefaults.jenis', $this->armada->jenis)
            ->where('formDefaults.model_tarif', $this->armada->model_tarif)
            ->where('formDefaults.tara_master_kg', '8500.00'));
});

test('edit armada dengan payload dari state tidak validation.required', function () {
    $payload = ($this->payload)([
        'plat_nomor' => 'B 9999 EDIT',
        'kapasitas' => '25 ton',
        'tara_master_kg' => '9100',
    ]);

    $this->actingAs($this->owner)
        ->put(route('fleet.armada.update', $this->armada), $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->armada->refresh();
    expect($this->armada->plat_nomor)->toBe('B 9999 EDIT');
    expect($this->armada->kapasitas)->toBe('25 ton');
    expect((float) $this->armada->tara_master_kg)->toBe(9100.0);
});

test('perubahan tara master mencatat timestamp hanya saat nilai beda', function () {
    expect($this->armada->tara_diperbarui_pada)->toBeNull();

    $this->actingAs($this->owner)
        ->put(route('fleet.armada.update', $this->armada), ($this->payload)())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($this->armada->fresh()->tara_diperbarui_pada)->toBeNull();

    $this->actingAs($this->owner)
        ->put(route('fleet.armada.update', $this->armada), ($this->payload)(['tara_master_kg' => '9200']))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($this->armada->fresh()->tara_diperbarui_pada)->not->toBeNull();
});
