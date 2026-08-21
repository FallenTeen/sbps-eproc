<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Core\Models\UnitBisnis;
use Database\Factories\Domain\Fleet\Models\RuteTarifFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RuteTarif extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rute_tarifs';

    protected $fillable = [
        'unit_bisnis_id',
        'lokasi_asal',
        'lokasi_tujuan',
        'jarak_km',
        'tarif_per_rit',
        'indeks_liter_solar_per_km',
        'berlaku_dari',
        'berlaku_sampai',
    ];

    protected static function newFactory()
    {
        return RuteTarifFactory::new();
    }

    protected $casts = [
        'jarak_km' => 'float',
        'tarif_per_rit' => 'float',
        'indeks_liter_solar_per_km' => 'float',
        'berlaku_dari' => 'date',
        'berlaku_sampai' => 'date',
    ];

    // Relasi
    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function ritases()
    {
        return $this->hasMany(Ritase::class);
    }

    // Scope
    public function scopeAktif($query, $tanggal = null)
    {
        $tanggal = $tanggal ?? now();

        return $query->where('berlaku_dari', '<=', $tanggal)
            ->where(function ($q) use ($tanggal) {
                $q->whereNull('berlaku_sampai')
                    ->orWhere('berlaku_sampai', '>=', $tanggal);
            });
    }

    public function scopeByAsalTujuan($query, $asal, $tujuan)
    {
        return $query->where('lokasi_asal', $asal)->where('lokasi_tujuan', $tujuan);
    }
}
