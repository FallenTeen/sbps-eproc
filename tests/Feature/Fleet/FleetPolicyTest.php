<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

function createFleetRoleUser(string $roleName, ?string $unitBisnisId = null): User
{
    Role::findOrCreate($roleName);
    $user = User::factory()->create(['unit_bisnis_id' => $unitBisnisId]);
    $user->assignRole($roleName);

    return $user;
}

beforeEach(function () {
    (new RolePermissionSeeder)->run();

    $this->unitGcs = UnitBisnis::factory()->gcs()->create();
    $this->unitCbp = UnitBisnis::factory()->cbp()->create();

    $this->armadaGcs = Armada::factory()->create(['unit_bisnis_id' => $this->unitGcs->id]);
    $this->armadaCbp = Armada::factory()->create(['unit_bisnis_id' => $this->unitCbp->id]);

    $this->driver = Karyawan::factory()->create([
        'status' => 'aktif',
    ]);
});

test('armada policy allows owner, koordinator gcs, and ketua divisi armada', function () {
    $owner = createFleetRoleUser('Owner');
    $koorGcs = createFleetRoleUser('Koordinator GCS', $this->unitGcs->id);
    $ketuaArmada = createFleetRoleUser('Ketua Divisi Armada', $this->unitGcs->id);
    $adminKeuangan = createFleetRoleUser('Admin Keuangan');
    $regularUser = User::factory()->create();

    // Owner
    expect($owner->can('viewAny', Armada::class))->toBeTrue();
    expect($owner->can('view', $this->armadaGcs))->toBeTrue();
    expect($owner->can('create', Armada::class))->toBeTrue();
    expect($owner->can('update', $this->armadaGcs))->toBeTrue();
    expect($owner->can('delete', $this->armadaGcs))->toBeTrue();
    expect($owner->can('recordRitase', $this->armadaGcs))->toBeTrue();
    expect($owner->can('recordSewa', $this->armadaGcs))->toBeTrue();

    // Koordinator GCS
    expect($koorGcs->can('viewAny', Armada::class))->toBeTrue();
    expect($koorGcs->can('view', $this->armadaGcs))->toBeTrue();
    expect($koorGcs->can('create', Armada::class))->toBeTrue();
    expect($koorGcs->can('update', $this->armadaGcs))->toBeTrue();
    expect($koorGcs->can('recordRitase', $this->armadaGcs))->toBeTrue();
    expect($koorGcs->can('recordSewa', $this->armadaGcs))->toBeTrue();

    // Ketua Divisi Armada
    expect($ketuaArmada->can('viewAny', Armada::class))->toBeTrue();
    expect($ketuaArmada->can('view', $this->armadaGcs))->toBeTrue();
    expect($ketuaArmada->can('create', Armada::class))->toBeTrue();
    expect($ketuaArmada->can('update', $this->armadaGcs))->toBeTrue();
    expect($ketuaArmada->can('delete', $this->armadaGcs))->toBeTrue();
    expect($ketuaArmada->can('recordRitase', $this->armadaGcs))->toBeTrue();
    expect($ketuaArmada->can('recordSewa', $this->armadaGcs))->toBeTrue();

    // Admin Keuangan
    expect($adminKeuangan->can('viewAny', Armada::class))->toBeTrue();
    expect($adminKeuangan->can('view', $this->armadaGcs))->toBeTrue();
    expect($adminKeuangan->can('create', Armada::class))->toBeFalse();
    expect($adminKeuangan->can('recordRitase', $this->armadaGcs))->toBeFalse();

    // Regular user
    expect($regularUser->can('viewAny', Armada::class))->toBeFalse();
    expect($regularUser->can('create', Armada::class))->toBeFalse();
    expect($regularUser->can('recordRitase', $this->armadaGcs))->toBeFalse();
    expect($regularUser->can('recordSewa', $this->armadaGcs))->toBeFalse();
});

test('ritase and sewa policies enforce role restrictions', function () {
    $owner = createFleetRoleUser('Owner');
    $koorGcs = createFleetRoleUser('Koordinator GCS', $this->unitGcs->id);
    $ketuaArmada = createFleetRoleUser('Ketua Divisi Armada', $this->unitGcs->id);
    $regularUser = User::factory()->create();

    $ritase = Ritase::create([
        'armada_id' => $this->armadaGcs->id,
        'driver_karyawan_id' => $this->driver->id,
        'tanggal' => now()->toDateString(),
        'jumlah_rit' => 2,
        'tarif_per_rit_snapshot' => 100000,
        'status' => 'disetujui',
    ]);
    $sewa = SewaAlatJam::create([
        'armada_id' => $this->armadaGcs->id,
        'tanggal' => now()->toDateString(),
        'harga_per_jam_snapshot' => 250000,
        'jumlah_jam' => 5,
        'status' => 'disetujui',
    ]);

    // Ritase
    expect($owner->can('create', Ritase::class))->toBeTrue();
    expect($koorGcs->can('create', Ritase::class))->toBeTrue();
    expect($ketuaArmada->can('create', Ritase::class))->toBeTrue();
    expect($regularUser->can('create', Ritase::class))->toBeFalse();

    // Sewa
    expect($owner->can('create', SewaAlatJam::class))->toBeTrue();
    expect($koorGcs->can('create', SewaAlatJam::class))->toBeTrue();
    expect($ketuaArmada->can('create', SewaAlatJam::class))->toBeTrue();
    expect($regularUser->can('create', SewaAlatJam::class))->toBeFalse();
});

test('armada controller index scopes data for non-owner', function () {
    $owner = createFleetRoleUser('Owner');
    $koorGcs = createFleetRoleUser('Koordinator GCS', $this->unitGcs->id);

    $this->actingAs($owner);
    $responseOwner = $this->get(route('fleet.armada.index'));
    $responseOwner->assertOk();
    $ownerArmadas = $responseOwner->original->getData()['page']['props']['armadas']['data'];
    $ownerArmadaIds = collect($ownerArmadas)->pluck('id');
    expect($ownerArmadaIds)->toContain($this->armadaGcs->id);
    expect($ownerArmadaIds)->toContain($this->armadaCbp->id);

    $this->actingAs($koorGcs);
    $responseGcs = $this->get(route('fleet.armada.index'));
    $responseGcs->assertOk();
    $gcsArmadas = $responseGcs->original->getData()['page']['props']['armadas']['data'];
    $gcsArmadaIds = collect($gcsArmadas)->pluck('id');
    expect($gcsArmadaIds)->toContain($this->armadaGcs->id);
    expect($gcsArmadaIds)->not->toContain($this->armadaCbp->id);
});
