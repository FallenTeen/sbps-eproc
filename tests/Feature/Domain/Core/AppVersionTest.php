<?php

use App\Models\AppVersion;
use App\Models\User;
use App\Support\RoleMatrix;
use Database\Seeders\AppVersionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AppVersionSeeder::class);

    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->hr = User::factory()->create();
    $this->hr->assignRole('Koordinator SDM');

    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');
});

test('owner dapat melihat index versi aplikasi', function () {
    $this->actingAs($this->owner)
        ->get(route('core.app-version.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Core/AppVersion/Index')
            ->has('appVersions.data', 6));
});

test('koordinator sdm dapat melihat index versi aplikasi (manage app version)', function () {
    $this->actingAs($this->hr)
        ->get(route('core.app-version.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Core/AppVersion/Index')
            ->where('appVersions.data.0.app', 'mobile'));
});

test('role selain Owner dan Koordinator SDM tidak punya manage app version', function () {
    foreach (RoleMatrix::ROLES as $role => $permissions) {
        $hasPermission = in_array('manage app version', $permissions, true);

        expect($hasPermission)->toBe(in_array($role, ['Owner', 'Koordinator SDM'], true));
    }
});

test('user tanpa permission manage app version ditolak 403', function () {
    $this->actingAs($this->user)
        ->get(route('core.app-version.index'))
        ->assertStatus(403);
});

test('filter force_update berfungsi', function () {
    $this->actingAs($this->owner)
        ->get(route('core.app-version.index', ['filters' => ['force_update' => '1']]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('appVersions.data', 0));

    AppVersion::first()->update(['force_update' => true]);

    $this->actingAs($this->owner)
        ->get(route('core.app-version.index', ['filters' => ['force_update' => '1']]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('appVersions.data', 1));
});

test('owner dapat update konfigurasi versi', function () {
    $version = AppVersion::first();

    $payload = [
        'latest_version' => '2.1.0',
        'min_version' => '1.5.0',
        'force_update' => true,
        'update_url' => 'https://sistem.sbpscorp.com/downloads/app',
        'changelog' => 'Perbaikan bug',
    ];

    $this->actingAs($this->owner)
        ->put(route('core.app-version.update', $version), $payload)
        ->assertRedirect(route('core.app-version.index'));

    $this->assertDatabaseHas('app_versions', [
        'id' => $version->id,
        'latest_version' => '2.1.0',
        'min_version' => '1.5.0',
        'force_update' => true,
        'changelog' => 'Perbaikan bug',
    ]);
});

test('koordinator sdm dapat update konfigurasi versi', function () {
    $version = AppVersion::first();

    $this->actingAs($this->hr)
        ->put(route('core.app-version.update', $version), [
            'latest_version' => '1.2.0+3',
            'min_version' => '1.0.0',
            'update_url' => $version->update_url,
        ])
        ->assertRedirect(route('core.app-version.index'));

    $this->assertDatabaseHas('app_versions', ['id' => $version->id, 'latest_version' => '1.2.0+3']);
});

test('user tanpa permission tidak dapat update konfigurasi versi', function () {
    $version = AppVersion::first();

    $this->actingAs($this->user)
        ->put(route('core.app-version.update', $version), [
            'latest_version' => '9.9.9',
            'min_version' => '1.0.0',
            'update_url' => $version->update_url,
        ])
        ->assertStatus(403);

    $this->assertDatabaseMissing('app_versions', ['id' => $version->id, 'latest_version' => '9.9.9']);
});

test('update perubahan tercatat di audit log dengan diff lama → baru', function () {
    $version = AppVersion::first();

    $this->actingAs($this->owner)
        ->put(route('core.app-version.update', $version), [
            'latest_version' => '2.0.0',
            'min_version' => '2.0.0',
            'force_update' => true,
            'update_url' => $version->update_url,
        ])
        ->assertRedirect(route('core.app-version.index'));

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'app-version',
        'description' => "Memperbarui konfigurasi versi {$version->app} ({$version->platform}): versi terbaru '{$version->latest_version}' → '2.0.0'; versi minimal '{$version->min_version}' → '2.0.0'; wajib update 'Tidak' → 'Aktif'",
    ]);

    $activity = \Spatie\Activitylog\Models\Activity::latest('id')->first();

    expect($activity->properties['app'])->toBe($version->app)
        ->and($activity->properties['platform'])->toBe($version->platform)
        ->and($activity->properties['diff']['force_update']['old'])->toBeFalse()
        ->and($activity->properties['diff']['force_update']['new'])->toBeTrue();
});

test('tanpa perubahan tidak menulis audit log', function () {
    $version = AppVersion::first();

    $this->actingAs($this->owner)
        ->put(route('core.app-version.update', $version), [
            'latest_version' => $version->latest_version,
            'min_version' => $version->min_version,
            'update_url' => $version->update_url,
        ])
        ->assertRedirect(route('core.app-version.index'));

    $this->assertDatabaseMissing('activity_log', ['log_name' => 'app-version']);
});

test('validasi update menolak versi tidak valid / url tidak valid', function () {
    $version = AppVersion::first();

    $this->actingAs($this->owner)
        ->put(route('core.app-version.update', $version), [
            'latest_version' => 'abc',
            'min_version' => '1.0.0',
            'update_url' => $version->update_url,
        ])
        ->assertSessionHasErrors(['latest_version']);

    $this->actingAs($this->owner)
        ->put(route('core.app-version.update', $version), [
            'latest_version' => '2.0.0',
            'min_version' => '1.0.0',
            'update_url' => 'bukan-url',
        ])
        ->assertSessionHasErrors(['update_url']);
});

test('force_update harus boolean', function () {
    $version = AppVersion::first();

    $this->actingAs($this->owner)
        ->put(route('core.app-version.update', $version), [
            'latest_version' => '2.0.0',
            'min_version' => '1.0.0',
            'force_update' => 'bukan-boolean',
            'update_url' => $version->update_url,
        ])
        ->assertSessionHasErrors(['force_update']);
});
