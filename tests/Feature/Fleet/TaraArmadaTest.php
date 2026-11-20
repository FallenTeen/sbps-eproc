<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseTimbang;
use App\Domain\Fleet\Models\RuteTarif;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->create([
        'tipe_unit' => 'armada_jalan',
        'tara_master_kg' => 8500,
    ]);
    $rute = RuteTarif::create([
        'unit_bisnis_id' => $this->unit->id,
        'lokasi_asal' => 'Kantor Pusat',
        'lokasi_tujuan' => 'Proyek Uji Tara',
        'jarak_km' => 10,
        'tarif_per_rit' => 150000,
        'berlaku_dari' => now()->subDay(),
    ]);
    $this->ritase = Ritase::factory()->for($this->armada)->create([
        'rute_tarif_id' => $rute->id,
    ]);

    Permission::findOrCreate('verify ritase logistik', 'web');
    $this->logistik = User::factory()->create(['is_active' => true]);
    $this->logistik->givePermissionTo('verify ritase logistik');
    $this->token = $this->logistik->createToken('mobile-test')->plainTextToken;
});

test('verifikasi web tanpa berat kosong memakai tara master armada', function () {
    $this->actingAs($this->logistik)
        ->post(route('logistik.ritase-verifikasi.verifikasi', $this->ritase), [
            'jumlah_verifikasi' => 24,
            'berat_isi_kg' => 32500,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $timbang = RitaseTimbang::where('ritase_id', $this->ritase->id)->firstOrFail();
    expect((float) $timbang->berat_kosong_kg)->toBe(8500.0);
    expect((float) $timbang->berat_netto_kg)->toBe(24000.0);
    expect($timbang->tara_sumber)->toBe('master');
});

test('verifikasi mobile tanpa berat kosong memakai tara master armada', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->post("/api/mobile/logistik/ritase/{$this->ritase->id}/verifikasi", [
            'jumlah_verifikasi' => 24,
            'berat_isi_kg' => 32500,
        ])
        ->assertOk()
        ->assertJsonPath('status', 'success');

    $timbang = RitaseTimbang::where('ritase_id', $this->ritase->id)->firstOrFail();
    expect((float) $timbang->berat_kosong_kg)->toBe(8500.0);
    expect((float) $timbang->berat_netto_kg)->toBe(24000.0);
    expect($timbang->tara_sumber)->toBe('master');
});

test('timbang ulang tidak mengubah tara master armada', function () {
    $this->actingAs($this->logistik)
        ->post(route('logistik.ritase-verifikasi.verifikasi', $this->ritase), [
            'jumlah_verifikasi' => 23,
            'berat_kosong_kg' => 9000,
            'berat_isi_kg' => 32000,
            'tara_sumber' => 'timbang_ulang',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $timbang = RitaseTimbang::where('ritase_id', $this->ritase->id)->firstOrFail();
    expect((float) $timbang->berat_kosong_kg)->toBe(9000.0);
    expect($timbang->tara_sumber)->toBe('timbang_ulang');
    expect((float) $this->armada->fresh()->tara_master_kg)->toBe(8500.0);
});

test('route dan menu tara master lama tidak tersedia', function () {
    $this->actingAs($this->logistik)
        ->get('/logistik/tara-master')
        ->assertNotFound();

    $this->actingAs($this->logistik)
        ->put("/logistik/tara-master/{$this->armada->id}", ['tara_master_kg' => 9000])
        ->assertNotFound();

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/logistik/tara-master')
        ->assertNotFound();

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->put("/api/mobile/logistik/tara-master/{$this->armada->id}", ['tara_master_kg' => 9000])
        ->assertNotFound();
});
