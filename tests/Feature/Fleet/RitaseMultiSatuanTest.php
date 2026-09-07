<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Permission::findOrCreate('manage fleet');
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('manage fleet');
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->proyek = Proyek::factory()->for($this->unit)->internal()->create(['created_by' => $this->user->id]);
    $this->armada = Armada::factory()->for($this->unit)->dumpTruck()->create();
    $this->driver = Karyawan::create([
        'nama' => 'Driver Multi Satuan',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);

    $this->rute = RuteTarif::create([
        'unit_bisnis_id' => $this->unit->id,
        'lokasi_asal' => 'Quarry A',
        'lokasi_tujuan' => 'Site B',
        'jarak_km' => 20,
        'tarif_per_rit' => 100_000,
        'berlaku_dari' => '2026-01-01',
    ]);
});

// =========================================================
// Fase A3 — ritase multi-satuan & normalisasi total_upah_rit
// =========================================================

describe('Fase A3 - Normalisasi total_upah_rit', function () {
    test('satuan ritase: total = jumlah_rit x tarif snapshot', function () {
        $ritase = (new RecordRitaseAction)->execute([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 8,
            'satuan_volume' => 'ritase',
            'proyek_id' => $this->proyek->id,
        ]);

        expect($ritase->satuan_volume)->toBe('ritase');
        expect($ritase->total_upah_rit)->toBe(800_000.0);
        expect($ritase->nominal)->toBe(800_000.0);
    });

    test('satuan tonase: total = nominal yang diinput user', function () {
        $ritase = (new RecordRitaseAction)->execute([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 3,
            'satuan_volume' => 'tonase',
            'jumlah_volume' => 24.5,
            'nominal' => 1_500_000,
            'proyek_id' => $this->proyek->id,
        ]);

        expect($ritase->satuan_volume)->toBe('tonase');
        expect($ritase->jumlah_volume)->toBe(24.5);
        expect($ritase->total_upah_rit)->toBe(1_500_000.0);
        expect($ritase->nominal)->toBe(1_500_000.0);
    });

    test('satuan m3: total = nominal', function () {
        $ritase = (new RecordRitaseAction)->execute([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 2,
            'satuan_volume' => 'm3',
            'jumlah_volume' => 16,
            'nominal' => 750_000,
        ]);

        expect($ritase->total_upah_rit)->toBe(750_000.0);
    });

    test('satuan harian: total = nominal (tarif harian)', function () {
        $ritase = (new RecordRitaseAction)->execute([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 1,
            'satuan_volume' => 'harian',
            'nominal' => 900_000,
        ]);

        expect($ritase->total_upah_rit)->toBe(900_000.0);
    });

    test('satuan non-ritase tanpa nominal: fallback ke hitung ritase', function () {
        $ritase = (new RecordRitaseAction)->execute([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 4,
            'satuan_volume' => 'tonase',
            'jumlah_volume' => 32,
            // nominal kosong
        ]);

        expect($ritase->total_upah_rit)->toBe(400_000.0);
        expect($ritase->nominal)->toBe(400_000.0);
    });

    test('satuan default ritase jika tidak dikirim', function () {
        $ritase = (new RecordRitaseAction)->execute([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 5,
        ]);

        expect($ritase->satuan_volume)->toBe('ritase');
        expect($ritase->total_upah_rit)->toBe(500_000.0);
    });
});

describe('Fase A3 - Kolom baru', function () {
    test('jumlah_volume disimpan untuk satuan tonase', function () {
        $ritase = (new RecordRitaseAction)->execute([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 1,
            'satuan_volume' => 'tonase',
            'jumlah_volume' => 12.75,
            'nominal' => 600_000,
        ]);

        expect($ritase->jumlah_volume)->toBe(12.75);
    });

    test('ritase multi-satuan tetap bisa dipermudah lewat factory', function () {
        $ritase = Ritase::factory()->for($this->armada)->create([
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id' => $this->rute->id,
            'satuan_volume' => 'harian',
            'nominal' => 850_000,
            'total_upah_rit' => 850_000,
        ]);

        expect($ritase->satuan_volume)->toBe('harian');
        expect($ritase->nominal)->toBe(850_000.0);
        expect($ritase->total_upah_rit)->toBe(850_000.0);
    });
});