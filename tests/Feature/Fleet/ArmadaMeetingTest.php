<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use App\Support\ArmadaOwnership;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Role::findOrCreate('Operator Alat Berat');
    Role::findOrCreate('Driver Standby');
});

test('operator alat berat hanya memegang armada bertipe alat_berat (TD-G1)', function () {
    $unit = UnitBisnis::factory()->gcs()->create();

    $user = User::factory()->create();
    $user->assignRole('Operator Alat Berat');

    $karyawan = Karyawan::factory()->create(['user_id' => $user->id]);

    $truk = Armada::factory()->for($unit)->dumpTruck()->create(['tipe_unit' => 'armada_jalan']);
    $excavator = Armada::factory()->for($unit)->alatBerat()->create(['tipe_unit' => 'alat_berat']);

    ArmadaDriver::create([
        'armada_id' => $truk->id,
        'karyawan_id' => $karyawan->id,
        'status' => 'aktif',
        'tanggal_mulai' => now()->toDateString(),
    ]);

    ArmadaDriver::create([
        'armada_id' => $excavator->id,
        'karyawan_id' => $karyawan->id,
        'status' => 'aktif',
        'tanggal_mulai' => now()->toDateString(),
    ]);

    $held = ArmadaOwnership::heldIds($user);

    expect($held)->toContain($excavator->id)
        ->and($held)->not->toContain($truk->id);
});

test('armada model memiliki relasi media foto_unit dan kolom audit update (TD-C1, TD-C2)', function () {
    $unit = UnitBisnis::factory()->gcs()->create();
    $user = User::factory()->create();

    $armada = Armada::create([
        'unit_bisnis_id' => $unit->id,
        'plat_nomor' => 'B 9999 SBPS',
        'kode_unit' => 'EXC-01',
        'jenis' => 'alat_berat',
        'tipe_unit' => 'alat_berat',
        'model_tarif' => 'sewa_jam',
        'status' => 'aktif',
        'data_diperbarui_pada' => now(),
        'data_diperbarui_oleh' => $user->id,
        'tara_master_kg' => 15000.50,
        'tara_diperbarui_pada' => now(),
    ]);

    expect($armada->foto_url)->toBeNull()
        ->and($armada->data_diperbarui_pada)->not->toBeNull()
        ->and($armada->diperbaruiOleh->id)->toBe($user->id)
        ->and((float) $armada->tara_master_kg)->toBe(15000.50);
});
