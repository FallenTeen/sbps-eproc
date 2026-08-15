<?php

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function presensiCheckInPayload(Titik $titik, string $file = 'checkin.jpg', bool $within = true): array
{
    return [
        'titik_id' => $titik->id,
        'latitude' => $within ? $titik->latitude : $titik->latitude + 0.5,
        'longitude' => $within ? $titik->longitude : $titik->longitude + 0.5,
        'photo' => UploadedFile::fake()->image($file),
        'photo_metadata' => ['latitude' => -7.0, 'longitude' => 110.0],
        'device_id' => 'device-123',
    ];
}

beforeEach(function () {
    Storage::fake('public');

    [$this->user, $this->token] = createMobileUserWithToken('SDM Lapangan Kondisional');
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
});

test('titik aktif mengembalikan daftar titik', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/titik-aktif')
        ->assertOk()
        ->assertJsonStructure(['data' => [
            '*' => ['id', 'nama', 'latitude', 'longitude', 'radius_presensi_meter'],
        ]])
        ->assertJsonPath('data.0.id', $this->titik->id);
});

test('check-in dalam radius tercatat status valid', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', presensiCheckInPayload($this->titik));

    $response->assertStatus(201)
        ->assertJsonPath('data.status_validasi', 'valid')
        ->assertJsonPath('data.status', 'menunggu_check_out');

    $this->assertDatabaseHas('presensis', [
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'status_validasi' => 'valid',
    ]);
});

test('check-in di luar radius tetap tercatat status luar_radius', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', presensiCheckInPayload($this->titik, 'jauh.jpg', false));

    $response->assertStatus(201)
        ->assertJsonPath('data.status_validasi', 'luar_radius');

    $this->assertDatabaseHas('presensis', [
        'karyawan_id' => $this->karyawan->id,
        'status_validasi' => 'luar_radius',
    ]);
});

test('check-in ganda dalam sehari ditolak', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', presensiCheckInPayload($this->titik));

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', presensiCheckInPayload($this->titik))
        ->assertStatus(422);
});

test('check-out menyelesaikan presensi', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', presensiCheckInPayload($this->titik));

    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-out', [
            'latitude' => $this->titik->latitude,
            'longitude' => $this->titik->longitude,
            'photo' => UploadedFile::fake()->image('checkout.jpg'),
            'photo_metadata' => ['latitude' => -7.0, 'longitude' => 110.0],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'selesai');

    expect(Presensi::where('karyawan_id', $this->karyawan->id)->first()->check_out)->not->toBeNull();
});

test('check-out tanpa check-in ditolak', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-out', [
            'latitude' => $this->titik->latitude,
            'longitude' => $this->titik->longitude,
            'photo' => UploadedFile::fake()->image('checkout.jpg'),
        ])
        ->assertStatus(422);
});

test('hari ini menunjukkan belum check-in', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/presensi/hari-ini')
        ->assertOk()
        ->assertJsonPath('data.status', 'belum_check_in');
});

test('hari ini menunjukkan presensi setelah check-in', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', presensiCheckInPayload($this->titik));

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/presensi/hari-ini')
        ->assertOk()
        ->assertJsonPath('data.status', 'menunggu_check_out')
        ->assertJsonPath('data.titik.id', $this->titik->id);
});

test('riwayat presensi terpaginate', function () {
    Presensi::create([
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->subDay(),
        'check_out' => now()->subDay()->addHours(8),
        'status_validasi' => 'valid',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/presensi/riwayat')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 1);
});
