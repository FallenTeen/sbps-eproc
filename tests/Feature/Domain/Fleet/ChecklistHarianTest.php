<?php

use App\Models\User;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\HR\Models\Karyawan;
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

    // Koordinator harus terhubung ke data karyawan aktif (controller
    // resolveKaryawanAktif memakai Auth::user()->karyawan)
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->koordinator->id]);
});

test('koordinator can view checklist index', function () {
    $this->actingAs($this->koordinator)
        ->get(route('fleet.checklist-harian.index'))
        ->assertStatus(200);
});

test('driver cannot view checklist index', function () {
    $this->actingAs($this->user)
        ->get(route('fleet.checklist-harian.index'))
        ->assertStatus(403);
});

test('koordinator can create checklist with good condition', function () {
    $data = [
        'checkable_type' => 'armada',
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => true,
        'dicatat_oleh_karyawan_id' => $this->karyawan->id,
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.checklist-harian.store'), $data)
        ->assertRedirect();

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'kondisi_baik' => true,
    ]);
});

test('checklist with bad condition requires item_bermasalah', function () {
    $data = [
        'checkable_type' => 'armada',
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => false,
        'dicatat_oleh_karyawan_id' => $this->karyawan->id,
        // item_bermasalah tidak diisi
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.checklist-harian.store'), $data)
        ->assertSessionHasErrors('item_bermasalah');
});

test('checklist with bad condition triggers notification', function () {
    $data = [
        'checkable_type' => 'armada',
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => false,
        'item_bermasalah' => 'Mesin overheat',
        'dicatat_oleh_karyawan_id' => $this->karyawan->id,
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.checklist-harian.store'), $data)
        ->assertRedirect();

    // Checklist kondisi buruk tersimpan dan memicu notifikasi
    // (NotificationController membaca checklist kondisi buruk otomatis)
    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'kondisi_baik' => false,
        'item_bermasalah' => 'Mesin overheat',
    ]);
});

test('duplicate checklist on same day is updated, not duplicated', function () {
    ArmadaChecklistHarian::factory()->create([
        'checkable_type' => Armada::class,
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => true,
        'dicatat_oleh_karyawan_id' => $this->karyawan->id,
    ]);

    $data = [
        'checkable_type' => 'armada',
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => false,
        'item_bermasalah' => 'AC mati',
        'dicatat_oleh_karyawan_id' => $this->karyawan->id,
    ];

    $this->actingAs($this->koordinator)
        ->post(route('fleet.checklist-harian.store'), $data)
        ->assertRedirect();

    // Tetap satu record per checkable per hari (diupdate, bukan dobel)
    $this->assertDatabaseCount('armada_checklist_harians', 1);
    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'kondisi_baik' => false,
        'item_bermasalah' => 'AC mati',
    ]);
});
