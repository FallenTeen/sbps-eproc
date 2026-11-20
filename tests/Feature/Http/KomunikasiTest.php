<?php

use App\Domain\Core\Models\KomunikasiLog;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->unit = UnitBisnis::factory()->create();
    $this->unitB = UnitBisnis::factory()->create();

    $this->proyek = Proyek::factory()->for($this->unit)->kontrakKlien()->create([
        'created_by' => $this->owner->id,
        'client' => 'PT Klien Chat',
        'kode_proyek' => 'PRJ-CHAT-001',
    ]);

    // Proyek unit LAIN sebagai objek uji scoping unit per role.
    $this->proyekUnitB = Proyek::factory()->for($this->unitB)->create([
        'created_by' => $this->owner->id,
        'kode_proyek' => 'PRJ-CHAT-UNITB',
    ]);

    $this->kontraktor = User::factory()->create();
    $this->kontraktor->assignRole('Kontraktor');
    $this->proyek->users()->attach($this->kontraktor->id);
});

test('owner membuka daftar komunikasi (semua proyek) dan thread proyek', function () {
    $this->actingAs($this->owner)
        ->get(route('komunikasi.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Core/Komunikasi/Index')
            ->has('proyeks.data', 2)
        );

    $this->actingAs($this->owner)
        ->get(route('komunikasi.show', $this->proyek))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Core/Komunikasi/Show')
            ->has('komunikasiLogs', 0)
            ->where('proyek.id', $this->proyek->id)
        );
});

test('kantor mengirim pesan dicatat dengan pengirim_role kantor', function () {
    $this->actingAs($this->owner)
        ->post(route('komunikasi.send', $this->proyek), ['pesan' => 'Halo kontraktor, mohon update progres.'])
        ->assertRedirect(route('komunikasi.show', $this->proyek));

    $this->assertDatabaseHas('komunikasi_logs', [
        'proyek_id' => $this->proyek->id,
        'user_id' => $this->owner->id,
        'pengirim_role' => 'kantor',
    ]);
});

test('pengirim pesan wajib mengisi pesan (validasi)', function () {
    $this->actingAs($this->owner)
        ->from(route('komunikasi.show', $this->proyek))
        ->post(route('komunikasi.send', $this->proyek), ['pesan' => ''])
        ->assertSessionHasErrors('pesan');

    $this->assertDatabaseCount('komunikasi_logs', 0);
});

test('user ber-unit hanya melihat proyek unitnya di daftar komunikasi', function () {
    $koord = User::factory()->create(['unit_bisnis_id' => $this->unit->id]);
    $koord->assignRole('Koordinator GCS');

    $response = $this->actingAs($koord)->get(route('komunikasi.index'))->assertOk();

    $assert = Assert::fromTestResponse($response);
    $proyeks = $assert->toArray()['props']['proyeks']['data'] ?? [];
    $ids = array_map(fn ($p) => $p['id'], $proyeks);

    expect($ids)->toContain($this->proyek->id)
        ->and($ids)->not->toContain($this->proyekUnitB->id);
});

test('user ber-unit TIDAK bisa membuka/mengirim chat proyek unit lain', function () {
    $koord = User::factory()->create(['unit_bisnis_id' => $this->unit->id]);
    $koord->assignRole('Koordinator GCS');

    $this->actingAs($koord)->get(route('komunikasi.show', $this->proyekUnitB))->assertForbidden();

    $this->actingAs($koord)
        ->post(route('komunikasi.send', $this->proyekUnitB), ['pesan' => 'hack'])
        ->assertForbidden();

    $this->assertDatabaseCount('komunikasi_logs', 0);
});

test('role kontraktor (eksternal) TIDAK bisa akses modul komunikasi internal', function () {
    $this->actingAs($this->kontraktor)
        ->get(route('komunikasi.index'))
        ->assertForbidden();

    $this->actingAs($this->kontraktor)
        ->get(route('komunikasi.show', $this->proyek))
        ->assertForbidden();
});

test('thread tampil dengan urutan pesan ascending', function () {
    KomunikasiLog::create(['proyek_id' => $this->proyek->id, 'user_id' => $this->kontraktor->id, 'pengirim_role' => 'kontraktor', 'pesan' => 'Halo kantor']);
    KomunikasiLog::create(['proyek_id' => $this->proyek->id, 'user_id' => $this->owner->id, 'pengirim_role' => 'kantor', 'pesan' => 'Halo juga']);

    $this->actingAs($this->owner)
        ->get(route('komunikasi.show', $this->proyek))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Core/Komunikasi/Show')
            ->has('komunikasiLogs', 2)
            ->where('komunikasiLogs.0.pengirim_role', 'kontraktor')
            ->where('komunikasiLogs.1.pengirim_role', 'kantor')
        );
});