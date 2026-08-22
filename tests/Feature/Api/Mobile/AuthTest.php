<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('register membuat user dengan token dan role default', function () {
    $response = $this->postJson('/api/mobile/register', [
        'name' => 'Ahmad Field',
        'email' => 'ahmad@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'phone' => '08123456789',
        'device_name' => 'pixel',
        'device_token' => 'fcm-token-abc',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'status', 'message',
            'data' => ['token', 'token_type', 'user' => ['id', 'name', 'email', 'roles']],
        ]);

    $this->assertDatabaseHas('users', ['email' => 'ahmad@example.com']);

    $user = User::where('email', 'ahmad@example.com')->first();
    expect($user->hasRole('SDM Lapangan Kondisional'))->toBeTrue();
    expect($user->device_token)->toBe('fcm-token-abc');
});

test('register dengan role Kontraktor eksplisit', function () {
    $response = $this->postJson('/api/mobile/register', [
        'name' => 'Budi Kontraktor',
        'email' => 'budi@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'Kontraktor',
    ]);

    $response->assertStatus(201);

    $user = User::where('email', 'budi@example.com')->first();
    expect($user->hasRole('Kontraktor'))->toBeTrue();
});

test('register menolak role di luar whitelist config', function () {
    $response = $this->postJson('/api/mobile/register', [
        'name' => 'Cici',
        'email' => 'cici@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'Owner',
    ]);

    $response->assertStatus(422);
});

test('login mengembalikan token', function () {
    $user = User::factory()->create([
        'email' => 'login@example.com',
        'password' => 'password',
    ]);
    $user->assignRole('Mandor Titik');

    $response = $this->postJson('/api/mobile/login', [
        'email' => 'login@example.com',
        'password' => 'password',
        'device_name' => 'pixel',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['token', 'token_type', 'user' => ['id', 'roles']]]);
});

test('login dengan password salah ditolak', function () {
    User::factory()->create([
        'email' => 'wrong@example.com',
        'password' => 'password',
    ])->assignRole('Mandor Titik');

    $this->postJson('/api/mobile/login', [
        'email' => 'wrong@example.com',
        'password' => 'salah123',
    ])->assertStatus(401);
});

test('endpoint mobile menolak request tanpa header device', function () {
    [$user, $token] = createMobileUserWithToken();

    $this->withToken($token)
        ->getJson('/api/mobile/user')
        ->assertStatus(403);
});

test('endpoint mobile menolak token web', function () {
    $user = User::factory()->create();
    $user->assignRole('Mandor Titik');

    $webToken = $user->createToken('web-session')->plainTextToken;

    $this->withToken($webToken)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/user')
        ->assertStatus(403);
});

test('endpoint mobile tanpa autentikasi ditolak', function () {
    $this->getJson('/api/mobile/user')->assertStatus(401);
});

test('user endpoint mengembalikan data user', function () {
    [$user, $token] = createMobileUserWithToken();

    $response = $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/user');

    $response->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.roles.0', 'SDM Lapangan Kondisional');
});

test('logout mencabut token', function () {
    [$user, $token] = createMobileUserWithToken();

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/logout')
        ->assertOk();

    expect($user->tokens()->count())->toBe(0);
});

test('logout-all-devices mencabut semua token mobile tapi menyimpan token web', function () {
    [$user, $token] = createMobileUserWithToken();
    $mobileLain = $user->createToken('mobile-tablet')->plainTextToken;
    $webToken = $user->createToken('web-session')->plainTextToken;

    $response = $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/logout-all-devices');

    $response->assertOk()
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.revoked', 2);

    // Semua token mobile habis — termasuk yang dipakai request ini.
    expect($user->tokens()->where('name', 'like', 'mobile%')->count())->toBe(0);

    // Token web tetap ada dan masih valid untuk endpoint web.
    expect($user->tokens()->where('name', 'like', 'web%')->count())->toBe(1);

    // Guard sanctum ter-cache antar request dalam satu test; reset agar
    // pencabutan token benar-benar terasa pada request berikutnya.
    $this->app->make('auth')->forgetGuards();

    $this->withToken($mobileLain)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/user')
        ->assertStatus(401);
});

test('logout-all-devices tanpa token lain hanya mencabut satu', function () {
    [$user, $token] = createMobileUserWithToken();

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/logout-all-devices')
        ->assertOk()
        ->assertJsonPath('data.revoked', 1);

    expect($user->tokens()->count())->toBe(0);
});

test('update-profile memperbarui data user', function () {
    [$user, $token] = createMobileUserWithToken();

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/update-profile', [
            'name' => 'Nama Baru',
            'phone' => '08129998888',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Nama Baru');

    expect($user->fresh()->phone)->toBe('08129998888');
});
