<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Konfigurasi versi minimum & terbaru per aplikasi mobile per platform.
 * Diubah via database (tanpa deploy) untuk mengendalikan force update.
 */
class AppVersion extends Model
{
    use HasUuids;

    protected $fillable = [
        'app',
        'platform',
        'min_version',
        'latest_version',
        'force_update',
        'update_url',
        'changelog',
    ];

    protected $casts = [
        'force_update' => 'boolean',
    ];
}
