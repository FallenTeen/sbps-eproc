<?php

namespace Database\Seeders;

use App\Models\AppVersion;
use Illuminate\Database\Seeder;

class AppVersionSeeder extends Seeder
{
    public function run(): void
    {
        AppVersion::query()->delete();

        AppVersion::create([
            'app' => 'mobile',
            'platform' => 'android',
            'min_version' => '0.9.0',
            'latest_version' => '0.9.0',
            'force_update' => false,
            'update_url' => 'https://sistem.sbpscorp.com/downloads/mobile-android/latest',
            'changelog' => null,
        ]);
    }
}
