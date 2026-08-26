<?php

namespace App\Domain\Finance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MutasiKasBank extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'mutasi_kas_banks';

    protected $fillable = [
        'akun_kas_bank_id',
        'kategori',
        'tipe',
        'jumlah',
        'referensi_type',
        'referensi_id',
        'tanggal',
        'catatan',
        'created_by',
    ];

    protected $casts = [
        'jumlah' => 'float',
        'tanggal' => 'date',
    ];

    // Relasi
    public function akunKasBank()
    {
        return $this->belongsTo(AkunKasBank::class);
    }

    public function referensi()
    {
        return $this->morphTo();
    }

    // Scope
    public function scopeMasuk($query)
    {
        return $query->where('tipe', 'masuk');
    }

    public function scopeKeluar($query)
    {
        return $query->where('tipe', 'keluar');
    }

    public function scopeByAkun($query, $akunId)
    {
        return $query->where('akun_kas_bank_id', $akunId);
    }

    public function scopeByPeriode($query, $bulan, $tahun)
    {
        return $query->whereYear('tanggal', $tahun)->whereMonth('tanggal', $bulan);
    }
}
