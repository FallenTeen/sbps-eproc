<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\Ritase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function createFleetRelatedUser(array $permissions = []): User
{
    $user = User::factory()->create();
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }
    if (! empty($permissions)) {
        $user->givePermissionTo($permissions);
    }

    return $user;
}

test('user with only view fleet sees armada related links without restricted items', function () {
    $unit = UnitBisnis::factory()->create();
    $armada = Armada::factory()->for($unit)->create();
    $user = createFleetRelatedUser(['view fleet']);

    $response = $this->actingAs($user)->get(route('fleet.armada.show', $armada));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Fleet/Armada/Show')
        ->has('related_links', 2)
        ->where('related_links.0.label', 'Ritase')
        ->where('related_links.0.href', 'fleet.ritase.index')
        ->where('related_links.0.permission', 'view fleet')
        ->where('related_links.1.label', 'Dokumen Armada')
        ->where('related_links.1.href', 'fleet.dokumen-berkala.index')
        ->where('related_links.1.permission', 'view fleet')
    );
});

test('user with manage pengisian solar sees pengisian solar link on armada detail', function () {
    $unit = UnitBisnis::factory()->create();
    $armada = Armada::factory()->for($unit)->create();
    $user = createFleetRelatedUser(['view fleet', 'manage pengisian solar']);

    $response = $this->actingAs($user)->get(route('fleet.armada.show', $armada));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Fleet/Armada/Show')
        ->has('related_links', 3)
        ->where('related_links.0.label', 'Ritase')
        ->where('related_links.1.label', 'Pengisian Solar')
        ->where('related_links.1.href', 'fleet.pengisian-solar.index')
        ->where('related_links.1.permission', 'manage pengisian solar')
        ->where('related_links.2.label', 'Dokumen Armada')
    );
});

test('ritase and servis detail send related links with correct target armada route param', function () {
    $unit = UnitBisnis::factory()->create();
    $armada = Armada::factory()->for($unit)->create();
    $user = createFleetRelatedUser(['view fleet', 'view fleet service']);

    $ritase = Ritase::factory()->create([
        'armada_id' => $armada->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->get(route('fleet.ritase.show', $ritase))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Fleet/Ritase/Show')
            ->has('related_links', 2)
            ->where('related_links.0.label', 'Detail Armada')
            ->where('related_links.0.href', 'fleet.armada.show')
            ->where('related_links.0.permission', 'view fleet')
            ->where('related_links.0.params.0', $armada->id)
            ->where('related_links.1.label', 'Riwayat Servis')
            ->where('related_links.1.href', 'fleet.workshop.riwayat.index')
            ->where('related_links.1.permission', 'view fleet service')
        );

    $pengajuan = PengajuanServisArmada::factory()->create([
        'armada_id' => $armada->id,
        'diajukan_oleh' => $user->id,
        'status' => 'disetujui',
    ]);

    $this->actingAs($user)
        ->get(route('fleet.servis-armada.show', $pengajuan))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Fleet/ServisArmada/Show')
            ->has('related_links', 3)
            ->where('related_links.0.label', 'Detail Armada')
            ->where('related_links.0.href', 'fleet.armada.show')
            ->where('related_links.0.permission', 'view fleet')
            ->where('related_links.0.params.0', $armada->id)
            ->where('related_links.1.label', 'Riwayat Servis')
            ->where('related_links.1.href', 'fleet.workshop.riwayat.index')
            ->where('related_links.1.permission', 'view fleet service')
            ->where('related_links.2.label', 'Verifikasi Eksternal')
            ->where('related_links.2.href', 'fleet.workshop.servis-eksternal.index')
            ->where('related_links.2.permission', 'view fleet service')
        );
});

test('workshop monitoring sends filtered related links', function () {
    $user = createFleetRelatedUser(['view fleet service']);

    $this->actingAs($user)
        ->get(route('fleet.workshop.monitoring.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Fleet/Workshop/Monitoring')
            ->has('related_links', 2)
            ->where('related_links.0.label', 'Riwayat Servis')
            ->where('related_links.0.href', 'fleet.workshop.riwayat.index')
            ->where('related_links.0.permission', 'view fleet service')
            ->where('related_links.1.label', 'Verifikasi Eksternal')
            ->where('related_links.1.href', 'fleet.workshop.servis-eksternal.index')
            ->where('related_links.1.permission', 'view fleet service')
        );
});
