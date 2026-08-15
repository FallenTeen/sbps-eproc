<?php

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    [$this->user, $this->token] = createMobileUserWithToken('SDM Lapangan Kondisional');
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
});

test('batch menyimpan lokasi saat check-in aktif', function () {
    config(['mobile.tracking.auto_cutoff' => '23:59']);

    Presensi::create([
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->subHour(),
        'status_validasi' => 'valid',
    ]);

    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/tracking/batch', [
            'locations' => [
                ['lat' => -7.1, 'lng' => 110.2, 'timestamp' => now()->subMinutes(5)->toIso8601String()],
                ['lat' => -7.11, 'lng' => 110.21, 'timestamp' => now()->subMinutes(3)->toIso8601String()],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.saved', 2);

    $this->assertDatabaseHas('mobile_tracking_locations', [
        'karyawan_id' => $this->karyawan->id,
    ]);
    expect(MobileTrackingLocation::count())->toBe(2);
});

test('batch tanpa check-in ditolak', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/tracking/batch', [
            'locations' => [
                ['lat' => -7.1, 'lng' => 110.2, 'timestamp' => now()->toIso8601String()],
            ],
        ])
        ->assertStatus(422);
});

test('hari ini tracking dibatasi owner/admin', function () {
    [$owner, $ownerToken] = createMobileUserWithToken('Owner');

    $targetUser = \App\Models\User::factory()->create();
    $targetUser->assignRole('Mandor Titik');
    $targetKaryawan = Karyawan::factory()->create(['user_id' => $targetUser->id]);

    MobileTrackingLocation::create([
        'karyawan_id' => $targetKaryawan->id,
        'latitude' => -7.1,
        'longitude' => 110.2,
        'recorded_at' => now(),
    ]);

    $this->withToken($ownerToken)
        ->withHeaders(mobileAuthHeaders())
        ->getJson("/api/mobile/tracking/hari-ini/{$targetUser->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data.items');
});

test('hari ini tracking ditolak untuk user biasa', function () {
    [$otherUser, $otherToken] = createMobileUserWithToken('Mandor Titik');
    $otherKaryawan = Karyawan::factory()->create(['user_id' => $otherUser->id]);

    MobileTrackingLocation::create([
        'karyawan_id' => $otherKaryawan->id,
        'latitude' => -7.1,
        'longitude' => 110.2,
        'recorded_at' => now(),
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson("/api/mobile/tracking/hari-ini/{$otherUser->id}")
        ->assertStatus(403);
});
