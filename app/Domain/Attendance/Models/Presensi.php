<?php

namespace App\Domain\Attendance\Models;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Presensi extends Model
{
    use HasUuids;

    protected $table = 'presensis';
    protected $fillable = [
        'karyawan_id',
        'titik_id',
        'check_in',
        'check_in_lat',
        'check_in_lng',
        'check_out',
        'check_out_lat',
        'check_out_lng',
        'status_validasi',
        'catatan_override'
    ];
    protected $casts = [
        'check_in' => 'datetime',
        'check_out' => 'datetime',
        'check_in_lat' => 'float',
        'check_in_lng' => 'float',
        'check_out_lat' => 'float',
        'check_out_lng' => 'float',
    ];

    // Relasi
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function formulir()
    {
        return $this->hasOne(FormulirLapangan::class);
    }

    // Scope dengan type hint
    public function scopeValid(Builder $query): Builder
    {
        return $query->where('status_validasi', 'valid');
    }

    public function scopeLuarRadius(Builder $query): Builder
    {
        return $query->where('status_validasi', 'luar_radius');
    }

    public function scopeByTanggal(Builder $query, string $tanggal): Builder
    {
        return $query->whereDate('check_in', $tanggal);
    }

    public function scopeByKaryawan(Builder $query, string $karyawanId): Builder
    {
        return $query->where('karyawan_id', $karyawanId);
    }
}
