<?php

use App\Domain\Fleet\Models\RuteTarif;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('create ritase mengirim alias rute dan default satuan', function () {
    Permission::findOrCreate('manage fleet', 'web');
    $user = User::factory()->create(['is_active' => true]);
    $user->givePermissionTo('manage fleet');

    $rute = RuteTarif::factory()->create([
        'lokasi_asal' => 'Site A',
        'lokasi_tujuan' => 'Site B',
        'tarif_per_rit' => 150000,
    ]);

    $this->actingAs($user)
        ->get(route('fleet.ritase.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/Ritase/Create')
            ->has('ruteList', 1)
            ->where('ruteList.0.id', $rute->id)
            ->where('ruteList.0.nama_rute', 'Site A -> Site B')
            ->where('ruteList.0.lokasi_muat', 'Site A')
            ->where('ruteList.0.lokasi_bongkar', 'Site B')
            ->where('ruteList.0.tarif_per_trip', 150000)
            ->where('formDefaults.satuan_volume', 'ritase'));
});
