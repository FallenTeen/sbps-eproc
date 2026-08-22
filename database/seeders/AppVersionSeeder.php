<?php

namespace Database\Seeders;

use App\Models\AppVersion;
use Illuminate\Database\Seeder;

class AppVersionSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['app' => 'presensi', 'platform' => 'android'],
            ['app' => 'presensi', 'platform' => 'ios'],
            ['app' => 'proyek', 'platform' => 'android'],
            ['app' => 'proyek', 'platform' => 'ios'],
        ];

        foreach ($rows as ['app' => $app, 'platform' => $platform]) {
            AppVersion::updateOrCreate(
                ['app' => $app, 'platform' => $platform],
                [
                    'min_version' => '1.0.0',
                    'latest_version' => '1.0.0',
                    'force_update' => false,
                    'update_url' => "https://sistem.sbpscorp.com/downloads/{$app}-{$platform}/latest",
                    'changelog' => null,
                ],
            );
        }
    }
}
