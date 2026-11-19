<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Domain\Fleet\Services\RitaseTimelineService;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->for($this->unit)->create([
        'plat_nomor' => 'B 1234 ABC',
    ]);
    $this->driver = Karyawan::factory()->create([
        'status' => 'aktif',
        'nama' => 'Pak Sopir',
    ]);

    $this->ritase = Ritase::factory()->for($this->armada)->create([
        'status' => 'draft',
        'driver_karyawan_id' => $this->driver->id,
        'tanggal' => now()->toDateString(),
        'jumlah_rit' => 3,
        'satuan_volume' => 'ritase',
        'sumber_angka_resmi' => 'logistik',
        'catatan' => 'Ritase uji timeline.',
    ]);

    Permission::findOrCreate('manage fleet', 'web');
    Permission::findOrCreate('view fleet', 'web');
    Permission::findOrCreate('verify ritase logistik', 'web');
    Permission::findOrCreate('manage timbang', 'web');
    Permission::findOrCreate('verify ritase security', 'web');

    $ownerRole = Role::findOrCreate('Owner', 'web');
    $ownerRole->syncPermissions(['manage fleet']);
    $this->owner = User::factory()->create([
        'is_active' => true,
        'unit_bisnis_id' => $this->unit->id,
    ]);
    $this->owner->assignRole($ownerRole);

    $logistikRole = Role::findOrCreate('Logistik', 'web');
    $logistikRole->syncPermissions(['view fleet', 'verify ritase logistik', 'manage timbang']);
    $this->logistik = User::factory()->create([
        'is_active' => true,
        'unit_bisnis_id' => $this->unit->id,
    ]);
    $this->logistik->assignRole($logistikRole);

    $securityRole = Role::findOrCreate('Security', 'web');
    $securityRole->syncPermissions(['view fleet', 'verify ritase security']);
    $this->security = User::factory()->create([
        'is_active' => true,
        'unit_bisnis_id' => $this->unit->id,
    ]);
    $this->security->assignRole($securityRole);
});

function timelineFor(Ritase $ritase, ?User $actor = null): array
{
    return app(RitaseTimelineService::class)->for($ritase->fresh(), $actor);
}

test('persetujuan owner hanya menandai step owner', function () {
    $this->actingAs($this->owner)
        ->post(route('fleet.ritase.approve-step', [$this->ritase->id, 'owner']))
        ->assertRedirect();

    expect($this->ritase->fresh()->status)->toBe('disetujui');

    $events = timelineFor($this->ritase, $this->owner);

    expect($events[1]['state'])->toBe('current');
    expect($events[2]['state'])->toBe('current');
    expect($events[3]['state'])->toBe('done');
    expect($events[3]['actor'])->toBe($this->owner->name);
    expect($events[3]['state'])->not->toBe('skipped');
});

test('owner dapat menyetujui semua step', function () {
    $this->actingAs($this->owner)
        ->post(route('fleet.ritase.approve-step', [$this->ritase->id, 'logistik']), [
            'catatan' => 'Owner verifikasi logistik.',
        ])
        ->assertRedirect();

    $this->actingAs($this->owner)
        ->post(route('fleet.ritase.approve-step', [$this->ritase->id, 'security']), [
            'catatan' => 'Owner verifikasi security.',
        ])
        ->assertRedirect();

    expect(RitaseVerifikasi::where('ritase_id', $this->ritase->id)
        ->where('tahap', 'logistik')
        ->firstOrFail()->diverifikasi_oleh)->toBe($this->owner->id);

    expect(RitaseVerifikasi::where('ritase_id', $this->ritase->id)
        ->where('tahap', 'security')
        ->firstOrFail()->diverifikasi_oleh)->toBe($this->owner->id);

    expect($this->ritase->fresh()->status)->toBe('draft');
});

test('persetujuan logistik dan security dibuat per step', function () {
    $this->actingAs($this->logistik)
        ->post(route('fleet.ritase.approve-step', [$this->ritase->id, 'logistik']), [
            'catatan' => 'Jumlah sesuai timbangan.',
        ])
        ->assertRedirect();

    $logistik = RitaseVerifikasi::where('ritase_id', $this->ritase->id)
        ->where('tahap', 'logistik')
        ->firstOrFail();

    expect($logistik->status)->toBe('terverifikasi');
    expect($logistik->diverifikasi_oleh)->toBe($this->logistik->id);
    expect($logistik->catatan)->toBe('Jumlah sesuai timbangan.');

    $this->actingAs($this->security)
        ->post(route('fleet.ritase.approve-step', [$this->ritase->id, 'security']), [
            'catatan' => 'Checklist gate aman.',
        ])
        ->assertRedirect();

    $security = RitaseVerifikasi::where('ritase_id', $this->ritase->id)
        ->where('tahap', 'security')
        ->firstOrFail();

    expect($security->status)->toBe('terverifikasi');
    expect($security->diverifikasi_oleh)->toBe($this->security->id);

    $events = timelineFor($this->ritase, $this->owner);

    expect($events[1]['state'])->toBe('done');
    expect($events[2]['state'])->toBe('done');
    expect($this->ritase->fresh()->status)->toBe('draft');
});

test('timeline memuat detail informasi per step', function () {
    RitaseVerifikasi::create([
        'ritase_id' => $this->ritase->id,
        'tahap' => 'logistik',
        'status' => 'terverifikasi',
        'jumlah_verifikasi' => 3.5,
        'checklist' => ['Timbangan sesuai', 'Foto tersedia'],
        'catatan' => 'Angka disetujui logistik.',
        'foto' => 'verifikasi/logistik.jpg',
        'diverifikasi_oleh' => $this->logistik->id,
        'diverifikasi_pada' => now()->subHour(),
    ]);

    $events = timelineFor($this->ritase, $this->logistik);

    expect($events[0]['details'])->toBeArray();
    expect(collect($events[0]['details'])->pluck('label'))->toContain('Driver');
    expect(collect($events[0]['details'])->firstWhere('label', 'Driver')['value'])->toBe('Pak Sopir');
    expect(collect($events[0]['details'])->firstWhere('label', 'Armada')['value'])->toBe('B 1234 ABC');

    $logistikDetails = collect($events[1]['details']);
    expect($logistikDetails->firstWhere('label', 'Jumlah verifikasi')['value'])->toBe('3,5');
    expect($logistikDetails->firstWhere('label', 'Catatan')['value'])->toBe('Angka disetujui logistik.');
    expect($logistikDetails->firstWhere('label', 'Checklist')['value'])->toBe('Timbangan sesuai, Foto tersedia');
    expect($logistikDetails->firstWhere('label', 'Foto')['url'])->toContain('verifikasi/logistik.jpg');
});

test('halaman detail menawarkan tombol persetujuan sesuai role', function () {
    $this->actingAs($this->owner)
        ->get(route('fleet.ritase.show', $this->ritase))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/Ritase/Show')
            ->where('timeline.0.action', null)
            ->where('timeline.1.action.step', 'logistik')
            ->where('timeline.2.action.step', 'security')
            ->where('timeline.3.action.step', 'owner')
            ->where('timeline.3.action.route', route('fleet.ritase.approve-step', [$this->ritase->id, 'owner'])));

    $this->actingAs($this->logistik)
        ->get(route('fleet.ritase.show', $this->ritase))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('timeline.1.action.step', 'logistik')
            ->where('timeline.3.action', null));
});
