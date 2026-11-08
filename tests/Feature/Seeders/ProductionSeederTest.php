<?php

use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\ProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('production seeder membuat akun operasional esensial tanpa menimpa password user yang sudah ada', function () {
    app()->instance('env', 'production');

    $existingOwner = User::factory()->create([
        'email' => 'owner@real.com',
        'password' => Hash::make('existing-secret'),
    ]);

    app(ProductionSeeder::class)->run();

    expect(Hash::check('existing-secret', $existingOwner->fresh()->password))->toBeTrue();

    foreach ([
        'owner@real.com' => 'Owner',
        'procurement@real.com' => 'Koordinator Procurement',
        'security@real.com' => 'Security',
        'logistik@real.com' => 'Logistik',
        'operator.berat@real.com' => 'Operator Alat Berat',
    ] as $email => $role) {
        expect(User::where('email', $email)->first()?->hasRole($role))->toBeTrue();
    }

    expect(Karyawan::whereHas('user', fn ($query) => $query->whereIn('email', [
        'security@real.com',
        'logistik@real.com',
        'operator.berat@real.com',
    ]))->count())->toBe(3)
        ->and(User::where('email', 'mandor.titik@dummy.com')->exists())->toBeFalse();
});

test('production seeder dan demo seeder menolak dijalankan pada environment yang salah', function () {
    expect(fn () => app(ProductionSeeder::class)->run())
        ->toThrow(RuntimeException::class);

    app()->instance('env', 'production');

    expect(fn () => app(DemoSeeder::class)->run())
        ->toThrow(RuntimeException::class);
});
