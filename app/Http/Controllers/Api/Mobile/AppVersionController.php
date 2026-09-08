<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\AppVersion;
use Illuminate\Http\Request;

class AppVersionController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/app-version?app={presensi|proyek}&platform={android|ios}
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'app' => 'required|string|in:presensi,proyek,mobile',
            'platform' => 'required|string|in:android,ios',
        ]);

        $version = AppVersion::query()
            ->where(function ($q) use ($validated) {
                $q->where('app', $validated['app']);
                if ($validated['app'] === 'mobile') {
                    $q->orWhere('app', 'presensi');
                }
            })
            ->where('platform', $validated['platform'])
            ->first();

        if (! $version) {
            return $this->error('Konfigurasi versi aplikasi belum tersedia.', 404);
        }

        return $this->success([
            'min_version' => $version->min_version,
            'latest_version' => $version->latest_version,
            'force_update' => $version->force_update,
            'update_url' => $version->update_url,
            'changelog' => $version->changelog,
        ], 'Konfigurasi versi aplikasi.');
    }
}
