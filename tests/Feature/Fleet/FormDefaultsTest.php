<?php

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseTimbang;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('create sewa alat mengirim default tipe sewa internal', function () {
    Permission::findOrCreate('manage fleet', 'web');
    $user = User::factory()->create(['is_active' => true]);
    $user->givePermissionTo('manage fleet');

    $this->actingAs($user)
        ->get(route('fleet.sewa-alat.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/SewaAlat/Create')
            ->where('formDefaults.tipe_sewa', 'internal')
            ->where('formDefaults.proyek_id', ''));
});

test('verifikasi logistik menghitung berat netto bila tidak diisi', function () {
    $armada = Armada::factory()->create(['tara_master_kg' => 8500]);
    $ritase = Ritase::factory()->for($armada)->create();
    Permission::findOrCreate('verify ritase logistik', 'web');
    $user = User::factory()->create(['is_active' => true]);
    $user->givePermissionTo('verify ritase logistik');

    $this->actingAs($user)
        ->post(route('logistik.ritase-verifikasi.verifikasi', $ritase), [
            'jumlah_verifikasi' => $ritase->jumlah_rit,
            'berat_kosong_kg' => 8500,
            'berat_isi_kg' => 20500,
            'tara_sumber' => 'master',
        ])
        ->assertRedirect();

    $timbang = RitaseTimbang::where('ritase_id', $ritase->id)->first();
    expect($timbang)->not->toBeNull();
    expect((float) $timbang->berat_netto_kg)->toBe(12000.0);
});
