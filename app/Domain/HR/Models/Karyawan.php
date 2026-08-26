<?php

namespace App\Domain\HR\Models;

use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Production\Models\Pengiriman;
use App\Domain\Production\Models\ProductionSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Karyawan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'karyawans';

    protected $fillable = [
        'user_id',
        'nama',
        'tipe',
        'jabatan',
        'rate_gaji_pokok',
        'rate_harian',
        'npwp',
        'no_bpjs_kesehatan',
        'no_bpjs_ketenagakerjaan',
        'status_ptkp',
        'status',
    ];

    protected $casts = [
        'rate_gaji_pokok' => 'float',
        'rate_harian' => 'float',
    ];

    // Relasi
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignments()
    {
        return $this->hasMany(KaryawanTitikAssignment::class);
    }

    public function cutis()
    {
        return $this->hasMany(Cuti::class);
    }

    public function gajiPeriodes()
    {
        return $this->hasMany(GajiPeriode::class);
    }

    // Sebagai driver
    public function armadaDrivers()
    {
        return $this->hasMany(ArmadaDriver::class);
    }

    public function ritases()
    {
        return $this->hasMany(Ritase::class, 'driver_karyawan_id');
    }

    public function productionSessions()
    {
        return $this->hasMany(ProductionSession::class, 'operator_karyawan_id');
    }

    public function pengirimans()
    {
        return $this->hasMany(Pengiriman::class, 'driver_karyawan_id');
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeByTipe($query, $tipe)
    {
        return $query->where('tipe', $tipe);
    }
}
