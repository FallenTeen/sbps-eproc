<?php

namespace Database\Seeders;

use App\Models\AppVersion;
use Illuminate\Database\Seeder;

class AppVersionSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['app' => 'presensi', 'platform' => 'android', 'version' => '1.0.0'],
            ['app' => 'presensi', 'platform' => 'ios', 'version' => '1.0.0'],
            ['app' => 'proyek', 'platform' => 'android', 'version' => '1.0.0'],
            ['app' => 'proyek', 'platform' => 'ios', 'version' => '1.0.0'],
            // Aplikasi mobile terpadu: rilis ini 0.9 (sebelum v1.0).
            ['app' => 'mobile', 'platform' => 'android', 'version' => '0.9.0'],
            ['app' => 'mobile', 'platform' => 'ios', 'version' => '0.9.0'],
        ];

        foreach ($rows as ['app' => $app, 'platform' => $platform, 'version' => $version]) {
            AppVersion::updateOrCreate(
                ['app' => $app, 'platform' => $platform],
                [
                    'min_version' => $version,
                    'latest_version' => $version,
                    'force_update' => false,
                    'update_url' => "https://sistem.sbpscorp.com/downloads/{$app}-{$platform}/latest",
                    'changelog' => null,
                ],
            );
        }
    }
}
