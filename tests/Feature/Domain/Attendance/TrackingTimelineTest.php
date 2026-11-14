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

    // 8:05 & 8:20 berada di bucket 30-menit yang sama (8:00-8:30) → hanya
    // titik pertama yang diambil. 9:10 bucket terpisah. Jarak antar titik
    // (8:05→9:10 = 65 mnt, 9:10→12:00 = 170 mnt) melewati gap threshold
    // default 30 menit → 2 gap disisipkan.
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

    // 2 titik hasil sampling + check-in + check-out + 2 gap (jeda > 30 mnt)
    // = 6. Entri gap muncul tepat setelah titik pada jam "sampai" gap
    // (recorded_at gap = sampai) — perilaku sisipkanGap.
    expect($points)->toHaveCount(6);
    expect($points[0]['jenis'])->toBe('check_in');
    expect(collect($points)->pluck('jenis')->all())->toContain('check_out')->toContain('gap');
    expect($timeline['gap_count'])->toBe(2);
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
            ->where('tracking.points', fn (Collection $points) => $points->count() === 6)
            ->where('tracking.points.0.jenis', 'check_in')
            ->has('tracking.durasi_menit')
            ->has('tracking.jarak_meter')
            ->has('tracking.gap_count')
            ->has('tracking.interval_menit'));
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

test('dedupe membuang duplikat recorded_at & koordinat identik', function () {
    // Duplikat batch upload mobile: recorded_at & koordinat sama persis
    // dengan titik 8:05.
    MobileTrackingLocation::create([
        'karyawan_id' => $this->karyawan->id,
        'presensi_id' => $this->presensi->id,
        'latitude' => -7.101,
        'longitude' => 110.201,
        'recorded_at' => now()->startOfDay()->addHours(8)->addMinutes(5),
    ]);

    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi, 'all');

    // raw_count tetap menghitung titik mentah valid (sebelum dedupe).
    expect($timeline['raw_count'])->toBe(4);

    $track = array_values(array_filter(
        $timeline['points'],
        fn ($p) => $p['jenis'] === 'track'
    ));

    expect($track)->toHaveCount(3);
});

test('dedupe menoleransi beda koordinat di bawah epsilon 1e-6', function () {
    MobileTrackingLocation::create([
        'karyawan_id' => $this->karyawan->id,
        'presensi_id' => $this->presensi->id,
        'latitude' => -7.101000001,
        'longitude' => 110.201000001,
        'recorded_at' => now()->startOfDay()->addHours(8)->addMinutes(5),
    ]);

    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi, 'all');

    expect($timeline['raw_count'])->toBe(4);

    $track = array_values(array_filter(
        $timeline['points'],
        fn ($p) => $p['jenis'] === 'track'
    ));

    expect($track)->toHaveCount(3);
});

test('sampling bucket menyertakan bucket_label dan bucket_menit', function () {
    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi, 30);

    $track = array_values(array_filter(
        $timeline['points'],
        fn ($p) => $p['jenis'] === 'track'
    ));

    expect($track)->toHaveCount(2);
    expect($track[0]['bucket_label'])->toBe('08:00');
    expect($track[0]['label_jam'])->toBe('08:05:00');
    expect($track[0]['bucket_menit'])->toBe(30);
    expect($track[1]['bucket_label'])->toBe('09:00');
    expect($timeline['interval_menit'])->toBe(30);
});

test('titik check-in/out dan gap tidak punya key bucket', function () {
    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi, 30);

    $nonTrack = array_filter($timeline['points'], fn ($p) => $p['jenis'] !== 'track');

    foreach ($nonTrack as $p) {
        expect(array_key_exists('bucket_label', $p))->toBeFalse();
        expect(array_key_exists('bucket_menit', $p))->toBeFalse();
    }
});

test('mode all tidak menyertakan info bucket dan interval null', function () {
    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi, 'all');

    foreach ($timeline['points'] as $p) {
        expect(array_key_exists('bucket_label', $p))->toBeFalse();
    }

    expect($timeline['interval_menit'])->toBeNull();
});

test('ringkasan durasi, jarak, dan gap dihitung dari data valid', function () {
    $timeline = app(TrackingTimelineService::class)->forPresensi($this->presensi, 'all');

    // check-in 08:00 → check-out 12:00.
    expect($timeline['durasi_menit'])->toBe(240);
    expect($timeline['jarak_meter'])->toBeGreaterThan(0);
    expect($timeline['gap_count'])->toBe(2);
});

test('durasi memakai titik GPS terakhir saat belum check-out', function () {
    $presensi = Presensi::create([
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->startOfDay()->addHours(13),
        'check_in_lat' => -7.100000,
        'check_in_lng' => 110.200000,
        'status_validasi' => 'valid',
    ]);

    MobileTrackingLocation::create([
        'karyawan_id' => $this->karyawan->id,
        'presensi_id' => $presensi->id,
        'latitude' => -7.100,
        'longitude' => 110.200,
        'recorded_at' => now()->startOfDay()->addHours(13)->addMinutes(40),
    ]);

    $timeline = app(TrackingTimelineService::class)->forPresensi($presensi, 'all');

    expect($timeline['durasi_menit'])->toBe(40);
    expect($timeline['gap_count'])->toBe(0);
    expect($timeline['jarak_meter'])->toBe(0.0);
});
