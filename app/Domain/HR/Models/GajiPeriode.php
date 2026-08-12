<?php

namespace App\Domain\HR\Models;

use App\Domain\Finance\Models\AkunKasBank;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GajiPeriode extends Model
{
    use HasUuids;

    protected $table = 'gaji_periodes';
    protected $fillable = [
        'karyawan_id',
        'periode_bulan',
        'periode_tahun',
        'jumlah_hadir',
        'status',
        'tanggal_dibayar',
        'akun_kas_bank_id'
    ];
    protected $casts = [
        'periode_bulan' => 'integer',
        'periode_tahun' => 'integer',
        'jumlah_hadir' => 'integer',
        'tanggal_dibayar' => 'date',
    ];

    // Relasi
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function komponen()
    {
        return $this->hasMany(KomponenGaji::class);
    }

    public function akunKasBank()
    {
        return $this->belongsTo(AkunKasBank::class);
    }

    // Scope
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeDibayar($query)
    {
        return $query->where('status', 'dibayar');
    }

    public function scopeByPeriode($query, $bulan, $tahun)
    {
        return $query->where('periode_bulan', $bulan)->where('periode_tahun', $tahun);
    }

    public function scopeByKaryawan($query, $karyawanId)
    {
        return $query->where('karyawan_id', $karyawanId);
    }
}
