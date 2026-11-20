<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('update push token memperbarui device_token user', function () {
    [$user, $token] = createMobileUserWithToken();

    $response = $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/push-token', [
            'device_token' => 'fcm-token-baru-123',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.device_token', 'fcm-token-baru-123');

    expect($user->fresh()->device_token)->toBe('fcm-token-baru-123');
});

test('update push token menolak payload tidak valid', function (array $payload) {
    [$user, $token] = createMobileUserWithToken();

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/push-token', $payload)
        ->assertStatus(422);

    expect($user->fresh()->device_token)->toBeNull();
})->with([
    'token kosong' => [[]],
    'token lebih dari 255 karakter' => [['device_token' => str_repeat('x', 256)]],
]);

test('update push token menolak tanpa autentikasi', function () {
    $this->postJson('/api/mobile/push-token', ['device_token' => 'abc'])
        ->assertStatus(401);
});
