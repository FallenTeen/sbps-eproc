<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Driver Standby');
});

test('mobile user can change password successfully', function () {
    $user = User::factory()->create([
        'password' => Hash::make('old-password-123'),
        'is_active' => true,
    ]);
    $user->assignRole('Driver Standby');

    $token = $user->createToken('mobile-test')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
        'X-Device-Type' => 'android',
        'X-Active-Role' => 'Driver Standby',
    ])->postJson('/api/mobile/change-password', [
        'current_password' => 'old-password-123',
        'password' => 'new-password-456',
        'password_confirmation' => 'new-password-456',
        'logout_other_devices' => true,
    ]);

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'Password berhasil diubah.',
        ]);

    $user->refresh();
    expect(Hash::check('new-password-456', $user->password))->toBeTrue();
});

test('mobile user cannot change password with invalid current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('old-password-123'),
        'is_active' => true,
    ]);
    $user->assignRole('Driver Standby');

    $token = $user->createToken('mobile-test')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
        'X-Device-Type' => 'android',
        'X-Active-Role' => 'Driver Standby',
    ])->postJson('/api/mobile/change-password', [
        'current_password' => 'wrong-password',
        'password' => 'new-password-456',
        'password_confirmation' => 'new-password-456',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['current_password']);
});
