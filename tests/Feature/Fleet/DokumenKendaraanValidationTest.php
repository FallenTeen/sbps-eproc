<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->create([
        'tipe_unit' => 'armada_jalan',
        'plat_nomor' => 'B 1234 DOK',
    ]);

    $this->owner = User::factory()->create(['is_active' => true]);
    $this->owner->assignRole('Owner');
});

test('create dokumen kendaraan minimal sukses dengan reminder default', function () {
    $this->actingAs($this->owner)
        ->post(route('fleet.armada.dokumen-berkala.store', $this->armada), [
            'jenis' => 'kir',
            'tanggal_jatuh_tempo' => now()->addMonths(6)->toDateString(),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $dokumen = ArmadaDokumenBerkala::where('jenis', 'kir')->firstOrFail();
    expect($dokumen->reminder_hari_sebelum)->toBe([30, 14, 7]);
});

test('edit dokumen kendaraan minimal sukses tanpa kehilangan data', function () {
    $dokumen = $this->armada->dokumenBerkalas()->create([
        'jenis' => 'pajak_tahunan',
        'nomor_dokumen' => 'PKB-001',
        'tanggal_terbit' => now()->subYear()->toDateString(),
        'tanggal_jatuh_tempo' => now()->addMonths(3)->toDateString(),
        'nominal_biaya' => 1500000,
        'reminder_hari_sebelum' => [30, 14, 7],
    ]);

    $tanggalBaru = now()->addMonths(9)->toDateString();

    $this->actingAs($this->owner)
        ->put(route('fleet.armada.dokumen-berkala.update', [$this->armada, $dokumen]), [
            'tanggal_jatuh_tempo' => $tanggalBaru,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $dokumen->refresh();
    expect($dokumen->tanggal_jatuh_tempo->toDateString())->toBe($tanggalBaru);
    expect($dokumen->nomor_dokumen)->toBe('PKB-001');
    expect($dokumen->nominal_biaya)->toBe(1500000.0);
    expect($dokumen->reminder_hari_sebelum)->toBe([30, 14, 7]);
});

test('edit dokumen kendaraan dapat memperbarui reminder_hari_sebelum', function () {
    $dokumen = $this->armada->dokumenBerkalas()->create([
        'jenis' => 'stnk_5_tahunan',
        'nomor_dokumen' => 'STNK-001',
        'tanggal_jatuh_tempo' => now()->addMonths(3)->toDateString(),
        'reminder_hari_sebelum' => [30, 14, 7],
    ]);

    $this->actingAs($this->owner)
        ->put(route('fleet.armada.dokumen-berkala.update', [$this->armada, $dokumen]), [
            'tanggal_jatuh_tempo' => now()->addMonths(6)->toDateString(),
            'reminder_hari_sebelum' => [45, 10],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($dokumen->fresh()->reminder_hari_sebelum)->toBe([45, 10]);
});

test('kontrak create dan update menerima field yang sama', function () {
    $payload = [
        'jenis' => 'stnk_5_tahunan',
        'nomor_dokumen' => 'STNK-002',
        'tanggal_terbit' => now()->subDay()->toDateString(),
        'tanggal_jatuh_tempo' => now()->addYear()->toDateString(),
        'nominal_biaya' => 250000,
        'wilayah' => 'Jakarta',
        'tempat_pembayaran' => 'Samsat',
        'teknis_pembayaran' => 'Transfer bank',
        'reminder_hari_sebelum' => [30, 14, 7],
        'catatan' => 'Dokumen uji kontrak',
    ];

    $this->actingAs($this->owner)
        ->post(route('fleet.armada.dokumen-berkala.store', $this->armada), $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $dokumen = ArmadaDokumenBerkala::where('nomor_dokumen', 'STNK-002')->firstOrFail();

    unset($payload['jenis']);

    $this->actingAs($this->owner)
        ->put(route('fleet.armada.dokumen-berkala.update', [$this->armada, $dokumen]), $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $dokumen->refresh();
    expect($dokumen->wilayah)->toBe('Jakarta');
    expect($dokumen->teknis_pembayaran)->toBe('Transfer bank');
    expect($dokumen->reminder_hari_sebelum)->toBe([30, 14, 7]);
});

test('submit tanpa tanggal_jatuh_tempo hanya menghasilkan error pada key itu', function () {
    $this->actingAs($this->owner)
        ->post(route('fleet.armada.dokumen-berkala.store', $this->armada), [
            'jenis' => 'kir',
            'reminder_hari_sebelum' => [30, 14, 7],
        ])
        ->assertSessionHasErrors(['tanggal_jatuh_tempo'])
        ->assertSessionDoesntHaveErrors([
            'jenis',
            'nomor_dokumen',
            'tanggal_terbit',
            'nominal_biaya',
            'wilayah',
            'tempat_pembayaran',
            'teknis_pembayaran',
            'reminder_hari_sebelum',
            'reminder_hari_sebelum.0',
            'catatan',
            'meta',
            'scan_dokumen',
        ]);

    expect(ArmadaDokumenBerkala::count())->toBe(0);
});

test('payload persis form create dan edit diterima tanpa error validasi', function () {
    $createPayload = [
        'jenis' => 'kir',
        'nomor_dokumen' => '',
        'tanggal_terbit' => '',
        'tanggal_jatuh_tempo' => now()->addMonths(6)->toDateString(),
        'nominal_biaya' => '',
        'wilayah' => '',
        'tempat_pembayaran' => '',
        'teknis_pembayaran' => '',
        'reminder' => '30,14,7',
        'reminder_hari_sebelum' => [30, 14, 7],
        'catatan' => '',
        'scan_dokumen' => '',
    ];

    $this->actingAs($this->owner)
        ->post(route('fleet.armada.dokumen-berkala.store', $this->armada), $createPayload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $dokumen = ArmadaDokumenBerkala::firstOrFail();
    expect($dokumen->reminder_hari_sebelum)->toBe([30, 14, 7]);

    $editPayload = [
        'nomor_dokumen' => '',
        'tanggal_terbit' => '',
        'tanggal_jatuh_tempo' => now()->addMonths(9)->toDateString(),
        'nominal_biaya' => '',
        'wilayah' => '',
        'tempat_pembayaran' => '',
        'teknis_pembayaran' => '',
        'reminder' => '45,10',
        'reminder_hari_sebelum' => [45, 10],
        'catatan' => '',
        'scan_dokumen' => '',
    ];

    $this->actingAs($this->owner)
        ->put(route('fleet.armada.dokumen-berkala.update', [$this->armada, $dokumen]), $editPayload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($dokumen->fresh()->reminder_hari_sebelum)->toBe([45, 10]);
});
