<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    // Buat Owner
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    // Buat user biasa (tidak punya akses)
    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');
});

test('owner can view unit bisnis index', function () {
    $this->actingAs($this->owner)
        ->get(route('core.unit-bisnis.index'))
        ->assertStatus(200);
});

test('normal user cannot view unit bisnis index', function () {
    $this->actingAs($this->user)
        ->get(route('core.unit-bisnis.index'))
        ->assertStatus(403);
});

test('owner can create unit bisnis', function () {
    $data = [
        'kode' => 'XYZ',
        'nama' => 'Unit Test',
        'deskripsi' => 'Deskripsi Test',
        'aktif' => true,
    ];

    $this->actingAs($this->owner)
        ->post(route('core.unit-bisnis.store'), $data)
        ->assertRedirect(route('core.unit-bisnis.index'));

    $this->assertDatabaseHas('unit_bisnis', ['kode' => 'XYZ']);
});

test('kode must be unique', function () {
    UnitBisnis::factory()->create(['kode' => 'XYZ']);

    $data = [
        'kode' => 'XYZ',
        'nama' => 'Unit Duplicate',
        'aktif' => true,
    ];

    $this->actingAs($this->owner)
        ->post(route('core.unit-bisnis.store'), $data)
        ->assertSessionHasErrors('kode');
});

test('owner can update unit bisnis', function () {
    $unit = UnitBisnis::factory()->create();

    $this->actingAs($this->owner)
        ->put(route('core.unit-bisnis.update', $unit), [
            'kode' => $unit->kode,
            'nama' => 'Updated Name',
        ])
        ->assertRedirect(route('core.unit-bisnis.show', $unit));

    $this->assertDatabaseHas('unit_bisnis', ['id' => $unit->id, 'nama' => 'Updated Name']);
});

test('owner can delete unit bisnis', function () {
    $unit = UnitBisnis::factory()->create();

    $this->actingAs($this->owner)
        ->delete(route('core.unit-bisnis.destroy', $unit))
        ->assertRedirect(route('core.unit-bisnis.index'));

    $this->assertDatabaseMissing('unit_bisnis', ['id' => $unit->id]);
});

test('normal user cannot delete unit bisnis', function () {
    $unit = UnitBisnis::factory()->create();

    $this->actingAs($this->user)
        ->delete(route('core.unit-bisnis.destroy', $unit))
        ->assertStatus(403);
});
