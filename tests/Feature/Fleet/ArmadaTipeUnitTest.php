<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Permission::findOrCreate('manage fleet');
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('manage fleet');
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->gcs()->create();
});

// =========================================================
// Fase A1 — tipe_unit: armada_jalan vs alat_berat
// =========================================================

describe('Fase A1 - tipe_unit armada', function () {
    test('default tipe_unit adalah armada_jalan', function () {
        $armada = Armada::factory()->for($this->unit)->dumpTruck()->create();

        expect($armada->tipe_unit)->toBe('armada_jalan');
    });

    test('state alatBerat mengeset tipe_unit = alat_berat', function () {
        $armada = Armada::factory()->for($this->unit)->alatBerat()->create();

        expect($armada->tipe_unit)->toBe('alat_berat');
        expect($armada->jenis)->toBe('alat_berat');
    });

    test('dumpTruck tidak mengubah tipe_unit dari default', function () {
        $armada = Armada::factory()->for($this->unit)->dumpTruck()->create();

        expect($armada->tipe_unit)->toBe('armada_jalan');
    });

    test('kolom tipe_unit adalah enum berisi armada_jalan dan alat_berat', function () {
        expect(DB::getSchemaBuilder()->getColumnType('armadas', 'tipe_unit'))->toBe('enum');
    });

    test('nilai enum tipe_unit yang valid tersimpan dan terbaca kembali', function () {
        $armada = Armada::factory()->for($this->unit)->dumpTruck()->create();
        $armada->update(['tipe_unit' => 'alat_berat']);

        expect($armada->fresh()->tipe_unit)->toBe('alat_berat');
    });
});