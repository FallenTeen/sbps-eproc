<?php

namespace App\Domain\Finance\Models;

use App\Domain\Core\Models\UnitBisnis;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class AkunKasBank extends Model
{
    use HasUuids;

    protected $table = 'akun_kas_banks';
    protected $fillable = [
        'unit_bisnis_id',
        'nama',
        'jenis_kas',
        'akun_coa_id',
        'saldo_awal',
        'aktif'
    ];
    protected $casts = [
        'saldo_awal' => 'float',
        'aktif' => 'boolean',
    ];

    // Relasi
    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function akunCoa()
    {
        return $this->belongsTo(AkunCoa::class);
    }

    public function mutasis()
    {
        return $this->hasMany(MutasiKasBank::class);
    }

    // Scope dengan type hint
    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('aktif', true);
    }

    public function scopeByUnit(Builder $query, string $unitBisnisId): Builder
    {
        return $query->where('unit_bisnis_id', $unitBisnisId);
    }

    public function scopeByJenis(Builder $query, string $jenis): Builder
    {
        return $query->where('jenis_kas', $jenis);
    }
}
