<?php

use App\Models\User;
use Illuminate\Support\Str;

/*
|--------------------------------------------------------------------------
| Pest Helpers untuk Mobile API Tests
|--------------------------------------------------------------------------
*/

/**
 * Buat user + token Sanctum untuk endpoint /api/mobile/*.
 * Token diberi nama "mobile-..." agar lolos middleware EnsureMobileToken.
 *
 * @return array{0: User, 1: string} [user, plainTextToken]
 */
function createMobileUserWithToken(string $role = 'SDM Lapangan Kondisional'): array
{
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole($role);

    $token = $user->createToken('mobile-test')->plainTextToken;

    return [$user, $token];
}

/**
 * Header wajib untuk semua request mobile.
 */
function mobileAuthHeaders(array $extra = []): array
{
    return array_merge([
        'X-Device-Type' => 'android',
        'X-Device-Name' => 'Pixel Test',
    ], $extra);
}

/**
 * Header untuk endpoint wajib Idempotency-Key (check-in/check-out/formulir).
 * Setiap panggilan menghasilkan key baru.
 */
function mobileIdemHeaders(?string $key = null): array
{
    return mobileAuthHeaders(['Idempotency-Key' => $key ?? (string) Str::uuid()]);
}
