<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Hapus user lama jika perlu (opsional)
        // User::where('email', 'admin@example.com')->delete();
        // User::where('email', 'procurement@example.com')->delete();

        $user = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin Utama',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $user->assignRole('Owner');

        $user2 = User::firstOrCreate(
            ['email' => 'procurement@example.com'],
            [
                'name' => 'Koordinator Procurement',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $user2->assignRole('Koordinator Procurement');
    }
}
