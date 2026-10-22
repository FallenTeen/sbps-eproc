<?php

use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->adminKeuangan = User::factory()->create();
    $this->adminKeuangan->assignRole('Admin Keuangan');

    $this->koordinatorSdm = User::factory()->create();
    $this->koordinatorSdm->assignRole('Koordinator SDM');

    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');
});

test('owner can view user management index', function () {
    $this->actingAs($this->owner)
        ->get(route('users.index'))
        ->assertStatus(200);
});

test('admin keuangan can view user management index', function () {
    $this->actingAs($this->adminKeuangan)
        ->get(route('users.index'))
        ->assertStatus(200);
});

test('normal user cannot view user management', function () {
    $this->actingAs($this->user)
        ->get(route('users.index'))
        ->assertStatus(403);
});

test('owner can create user with role', function () {
    $data = [
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'Koordinator GCS',
        'is_active' => true,
    ];

    $this->actingAs($this->owner)
        ->post(route('users.store'), $data)
        ->assertRedirect();

    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole('Koordinator GCS'))->toBeTrue();
});

test('owner can update user role', function () {
    $targetUser = User::factory()->create();
    $targetUser->assignRole('Kontraktor');

    $data = [
        'name' => $targetUser->name,
        'email' => $targetUser->email,
        'role' => 'Koordinator GCS',
        'is_active' => true,
    ];

    $this->actingAs($this->owner)
        ->put(route('users.update', $targetUser), $data)
        ->assertRedirect();

    $targetUser->refresh();
    expect($targetUser->hasRole('Koordinator GCS'))->toBeTrue();
});

test('owner cannot delete themselves', function () {
    $this->actingAs($this->owner)
        ->delete(route('users.destroy', $this->owner))
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('owner can delete other user', function () {
    $targetUser = User::factory()->create();

    $this->actingAs($this->owner)
        ->delete(route('users.destroy', $targetUser))
        ->assertRedirect();

    $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
});

test('admin keuangan can assign role to user', function () {
    $targetUser = User::factory()->create();

    $this->actingAs($this->adminKeuangan)
        ->post(route('users.assign-role', $targetUser), ['role' => 'Koordinator CBP'])
        ->assertRedirect();

    $targetUser->refresh();
    expect($targetUser->hasRole('Koordinator CBP'))->toBeTrue();
});

test('koordinator sdm can view user management index (manage user)', function () {
    $this->actingAs($this->koordinatorSdm)
        ->get(route('users.index'))
        ->assertStatus(200);
});

test('owner can create user linked to existing karyawan', function () {
    $karyawan = Karyawan::factory()->create();

    $this->actingAs($this->owner)
        ->post(route('users.store'), [
            'name' => 'Dengan Karyawan',
            'email' => 'karyawan-link@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'Koordinator GCS',
            'karyawan_id' => $karyawan->id,
        ])
        ->assertRedirect();

    $user = User::where('email', 'karyawan-link@example.com')->first();
    expect($user->karyawan()->whereKey($karyawan->id)->exists())->toBeTrue();

    $karyawan->refresh();
    expect((string) $karyawan->user_id)->toBe((string) $user->id);
});

test('owner can create user with new karyawan data', function () {
    $this->actingAs($this->owner)
        ->post(route('users.store'), [
            'name' => 'Buat Karyawan Baru',
            'email' => 'karyawan-baru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'Koordinator GCS',
            'new_karyawan' => [
                'nama' => 'Budi Santoso',
                'tipe' => 'harian',
                'jabatan' => 'Operator AMP',
            ],
        ])
        ->assertRedirect();

    $user = User::where('email', 'karyawan-baru@example.com')->first();

    $karyawan = Karyawan::where('user_id', $user->id)->first();
    expect($karyawan)->not->toBeNull();
    expect($karyawan->nama)->toBe('Budi Santoso');
    expect($karyawan->tipe)->toBe('harian');
});

test('cannot create user linking karyawan owned by another account', function () {
    $existingUser = User::factory()->create();
    $karyawan = Karyawan::factory()->create(['user_id' => $existingUser->id]);

    $this->actingAs($this->owner)
        ->post(route('users.store'), [
            'name' => 'Try Link',
            'email' => 'try-link@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'Koordinator GCS',
            'karyawan_id' => $karyawan->id,
        ])
        ->assertSessionHasErrors('karyawan_id');

    $karyawan->refresh();
    expect((string) $karyawan->user_id)->toBe((string) $existingUser->id);
});

test('owner can create user without karyawan data (karyawan tidak wajib punya akun)', function () {
    $this->actingAs($this->owner)
        ->post(route('users.store'), [
            'name' => 'Tanpa Karyawan',
            'email' => 'tanpa-karyawan@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'Koordinator GCS',
        ])
        ->assertRedirect();

    $user = User::where('email', 'tanpa-karyawan@example.com')->first();
    expect($user->karyawan()->exists())->toBeFalse();
    expect(Karyawan::where('user_id', $user->id)->exists())->toBeFalse();
});

test('link-karyawan requires karyawan_id or new_karyawan', function () {
    $this->actingAs($this->owner)
        ->post(route('users.link-karyawan', $this->owner), [])
        ->assertSessionHasErrors(['karyawan_id', 'new_karyawan']);
});

test('link-karyawan endpoint links existing karyawan to account', function () {
    $karyawan = Karyawan::factory()->create();

    $this->actingAs($this->owner)
        ->post(route('users.link-karyawan', $this->user), [
            'karyawan_id' => $karyawan->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $karyawan->refresh();
    expect((string) $karyawan->user_id)->toBe((string) $this->user->id);
});

test('link-karyawan endpoint can create new karyawan', function () {
    $this->actingAs($this->owner)
        ->post(route('users.link-karyawan', $this->user), [
            'new_karyawan' => [
                'nama' => 'Siti Aminah',
                'tipe' => 'tetap',
                'jabatan' => 'Admin',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $karyawan = Karyawan::where('user_id', $this->user->id)->first();
    expect($karyawan)->not->toBeNull();
    expect($karyawan->nama)->toBe('Siti Aminah');
});

test('unlink-karyawan detaches karyawan but keeps the karyawan record', function () {
    $karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->owner)
        ->post(route('users.unlink-karyawan', $this->user))
        ->assertRedirect()
        ->assertSessionHas('success');

    $karyawan->refresh();
    expect($karyawan->user_id)->toBeNull();
    expect(Karyawan::whereKey($karyawan->id)->exists())->toBeTrue();

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'user-management',
        'description' => "Melepas tautan karyawan '{$karyawan->nama}' dari akun '{$this->user->email}'",
    ]);
});

test('unlink-karyawan errors when account has no linked karyawan', function () {
    $this->actingAs($this->owner)
        ->post(route('users.unlink-karyawan', $this->user))
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('inactive user cannot login', function () {
    $inactiveUser = User::factory()->create(['is_active' => false]);

    $this->post('/login', [
        'email' => $inactiveUser->email,
        'password' => 'password',
    ])->assertRedirect();

    $this->assertGuest();
});
