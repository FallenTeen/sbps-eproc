<?php

namespace App\Domain\Production\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Pengiriman extends Model
{
    use HasUuids;

    protected $table = 'pengirimans';

    protected $fillable = [
        'production_session_id',
        'armada_id',
        'driver_karyawan_id',
        'tujuan_alamat',
        'waktu_muat',
        'waktu_tiba_tujuan',
        'waktu_selesai_tuang',
        'status',
        'catatan',
    ];

    protected $casts = [
        'waktu_muat' => 'datetime',
        'waktu_tiba_tujuan' => 'datetime',
        'waktu_selesai_tuang' => 'datetime',
    ];

    // Relasi
    public function session()
    {
        return $this->belongsTo(ProductionSession::class, 'production_session_id');
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function driver()
    {
        return $this->belongsTo(Karyawan::class, 'driver_karyawan_id');
    }

    // Scope
    public function scopeDijadwalkan($query)
    {
        return $query->where('status', 'dijadwalkan');
    }

    public function scopeDalamPerjalanan($query)
    {
        return $query->where('status', 'dalam_perjalanan');
    }

    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }
}
