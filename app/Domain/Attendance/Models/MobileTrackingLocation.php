<?php

namespace App\Domain\Attendance\Models;

use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MobileTrackingLocation extends Model
{
    use HasUuids;

    protected $table = 'mobile_tracking_locations';

    protected $fillable = [
        'karyawan_id',
        'presensi_id',
        'latitude',
        'longitude',
        'recorded_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'recorded_at' => 'datetime',
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function presensi()
    {
        return $this->belongsTo(Presensi::class);
    }
}
