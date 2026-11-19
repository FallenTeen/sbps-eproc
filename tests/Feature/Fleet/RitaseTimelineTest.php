<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Services\RitaseTimelineService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->for($this->unit)->create();
    $this->rute = RuteTarif::factory()->for($this->unit)->create();
    $this->driver = Karyawan::factory()->create(['status' => 'aktif']);

    Permission::findOrCreate('manage fleet', 'web');
    $role = Role::findOrCreate('Ketua Armada', 'web');
    $role->syncPermissions(['manage fleet']);

    $this->user = User::factory()->create([
        'is_active' => true,
        'unit_bisnis_id' => $this->unit->id,
    ]);
    $this->user->assignRole($role);
});

test('store web mencatat ritase sebagai draft', function () {
    $this->actingAs($this->user)
        ->post(route('fleet.ritase.store'), [
            'armada_id' => $this->armada->id,
            'karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_trip' => 2,
            'satuan_volume' => 'ritase',
        ])
        ->assertRedirect(route('fleet.ritase.index'));

    expect(Ritase::latest('created_at')->first()->status)->toBe('draft');
});

test('approve ketua armada mengubah status dan timeline memuat verifikasi skipable', function () {
    $ritase = Ritase::factory()->for($this->armada)->create(['status' => 'draft']);

    RitaseVerifikasi::create([
        'ritase_id' => $ritase->id,
        'tahap' => 'logistik',
        'status' => 'terverifikasi',
        'jumlah_verifikasi' => 2,
        'diverifikasi_oleh' => $this->user->id,
        'diverifikasi_pada' => now()->subMinute(),
    ]);
    RitaseVerifikasi::create([
        'ritase_id' => $ritase->id,
        'tahap' => 'security',
        'status' => 'terverifikasi',
        'diverifikasi_oleh' => $this->user->id,
        'diverifikasi_pada' => now(),
    ]);

    $this->actingAs($this->user)
        ->post(route('fleet.ritase.approve', $ritase))
        ->assertRedirect();

    expect($ritase->fresh()->status)->toBe('disetujui');
    expect(Activity::where('subject_type', Ritase::class)
        ->where('subject_id', $ritase->id)
        ->where('description', 'ritase.disetujui')
        ->exists())->toBeTrue();

    $events = app(RitaseTimelineService::class)->for($ritase->fresh());
    $keys = array_column($events, 'key');

    expect($keys)->toBe([
        'diajukan',
        'diverifikasi_logistik',
        'diverifikasi_security',
        'disetujui',
        'ditagih',
    ]);
    expect($events[1]['state'])->toBe('done');
    expect($events[2]['state'])->toBe('done');
    expect($events[3]['state'])->toBe('done');
    expect($events[4]['state'])->toBe('pending');
    expect($events[3]['actor'])->toBe($this->user->name);
});
