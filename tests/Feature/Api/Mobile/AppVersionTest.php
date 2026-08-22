<?php

use App\Models\AppVersion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function createAppVersion(array $overrides = []): AppVersion
{
    return AppVersion::create(array_merge([
        'app' => 'presensi',
        'platform' => 'android',
        'min_version' => '1.2.0',
        'latest_version' => '2.0.0',
        'force_update' => true,
        'update_url' => 'https://play.google.com/store/apps/details?id=com.sbps.presensi',
        'changelog' => "Perbaikan bug check-in\nFitur baru: rekap bulanan",
    ], $overrides));
}

test('mengembalikan konfigurasi versi tanpa perlu token', function () {
    createAppVersion();

    $this->getJson('/api/mobile/app-version?app=presensi&platform=android')
        ->assertStatus(200)
        ->assertJson([
            'status' => 'success',
            'message' => 'Konfigurasi versi aplikasi.',
            'data' => [
                'min_version' => '1.2.0',
                'latest_version' => '2.0.0',
                'force_update' => true,
                'update_url' => 'https://play.google.com/store/apps/details?id=com.sbps.presensi',
                'changelog' => "Perbaikan bug check-in\nFitur baru: rekap bulanan",
            ],
        ]);
});

test('force_update dikembalikan sebagai boolean dan changelog boleh null', function () {
    createAppVersion(['app' => 'proyek', 'platform' => 'ios', 'force_update' => false, 'changelog' => null]);

    $this->getJson('/api/mobile/app-version?app=proyek&platform=ios')
        ->assertStatus(200)
        ->assertJsonPath('data.force_update', false)
        ->assertJsonPath('data.changelog', null);
});

test('konfigurasi dipilih sesuai kombinasi app dan platform', function () {
    createAppVersion(['platform' => 'android', 'min_version' => '1.0.0']);
    createAppVersion(['platform' => 'ios', 'min_version' => '3.1.4']);

    $this->getJson('/api/mobile/app-version?app=presensi&platform=ios')
        ->assertStatus(200)
        ->assertJsonPath('data.min_version', '3.1.4');
});

test('404 jika kombinasi app dan platform belum dikonfigurasi', function () {
    createAppVersion(['app' => 'presensi', 'platform' => 'android']);

    $this->getJson('/api/mobile/app-version?app=proyek&platform=android')
        ->assertStatus(404)
        ->assertJson(['status' => 'error']);
});

test('validasi query parameter wajib dan bernilai benar', function () {
    // Parameter hilang
    $this->getJson('/api/mobile/app-version')->assertStatus(422);
    $this->getJson('/api/mobile/app-version?app=presensi')->assertStatus(422);
    $this->getJson('/api/mobile/app-version?platform=android')->assertStatus(422);

    // Nilai di luar daftar
    $this->getJson('/api/mobile/app-version?app=lainnya&platform=android')->assertStatus(422);
    $this->getJson('/api/mobile/app-version?app=presensi&platform=windows')->assertStatus(422);
});
