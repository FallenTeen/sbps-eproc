<?php

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Services\TrackingTimelineService;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->ownerUser = User::factory()->create();
    $this->ownerUser->assignRole('Owner');

    // Non-Owner tapi boleh melihat presensi (punya 'manage presensi').
    $this->manager = User::factory()->create();
    $this->manager->givePermissionTo('manage presensi');

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->ownerUser->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);

    $this->karyawan = Karyawan::factory()->create(['nama' => 'Ahmad Driver']);

    $this->presensi = Presensi::create([
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->startOfDay()->addHours(8),
        'check_in_lat' => -7.100000,
        'check_in_lng' => 110.200000,
        'check_out' => now()->startOfDay()->addHours(12),
        'check_out_lat' => -7.110000,
        'check_out_lng' => 110.210000,
        'status_validasi' => 'valid',
    ]);

    // 8:05 & 8:20 berada di bucket 30-menit yang sama (8:00–8:30) → hanya
    // titik pertama yang diambil. 9:10 bucket terpisah.
    foreach ([
        [now()->startOfDay()->addHours(8)->addMinutes(5), -7.101, 110.201],
        [now()->startOfDay()->addHours(8)->addMinutes(20), -7.102, 110.202],
        [now()->startOfDay()->addHours(9)->addMinutes(10), -7.103, 110.203],
    ] as [$at, $lat, $lng]) {
        MobileTrackingLocation::create([
            'karyawan_id' => $this->karyawan->id,
            'presensi_id' => $this->presensi->id,
            'latitude' => $lat,
            'longitude' => $lng,
            'recorded_at' => $at,
        ]);
    }
});

test('service menyampling per bucket dan menyertakan check-in/check-out', function () {
    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi);

    expect($timeline['raw_count'])->toBe(3);

    $points = $timeline['points'];

    // 2 titik hasil sampling + check-in + check-out = 4.
    expect($points)->toHaveCount(4);
    expect($points[0]['jenis'])->toBe('check_in');
    expect($points[array_key_last($points)]['jenis'])->toBe('check_out');
});

test('service fallback mengambil lokasi karyawan saat presensi_id tidak ada', function () {
    MobileTrackingLocation::query()->delete();

    MobileTrackingLocation::create([
        'karyawan_id' => $this->karyawan->id,
        'presensi_id' => null,
        'latitude' => -7.105,
        'longitude' => 110.205,
        'recorded_at' => now()->startOfDay()->addHours(10),
    ]);

    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi);

    expect($timeline['raw_count'])->toBe(1);
});

test('Owner menerima prop tracking pada detail presensi', function () {
    $this->actingAs($this->ownerUser);

    $this->getJson(route('attendance.presensi.show', $this->presensi->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Attendance/Presensi/Show')
            ->has('tracking')
            ->where('tracking.raw_count', 3)
            ->where('tracking.points', fn (Collection $points) => $points->count() === 4)
            ->where('tracking.points.0.jenis', 'check_in'));
});

test('non-Owner tidak menerima prop tracking pada detail presensi', function () {
    $this->actingAs($this->manager);

    $this->getJson(route('attendance.presensi.show', $this->presensi->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Attendance/Presensi/Show')->missing('tracking'));
});

test('Owner dapat membuka halaman tracking linimasa', function () {
    $this->actingAs($this->ownerUser);

    $this->getJson(route('attendance.tracking.index', ['tanggal' => now()->toDateString()]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Attendance/Tracking/Index')
            ->has('rows', 1)
            ->where('rows.0.nama', 'Ahmad Driver')
            ->where('rows.0.point_count', 3));
});

test('non-Owner ditolak membuka halaman tracking linimasa', function () {
    $this->actingAs($this->manager);

    $this->getJson(route('attendance.tracking.index'))->assertForbidden();
});
