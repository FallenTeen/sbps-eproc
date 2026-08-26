<?php

namespace App\Domain\Core\Models;

use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Production\Models\MesinProduksi;
use Database\Factories\UnitBisnisFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnitBisnis extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'unit_bisnis';

    protected $fillable = ['kode', 'nama', 'deskripsi', 'aktif'];

    protected $casts = ['aktif' => 'boolean'];

    // Tentukan factory yang digunakan
    protected static function newFactory()
    {
        return UnitBisnisFactory::new();
    }

    public function proyeks()
    {
        return $this->hasMany(Proyek::class);
    }

    // Ditambahkan: relasi yang diperlukan untuk statistik & cek relasi
    // sebelum hapus di UnitBisnisController.
    public function armadas()
    {
        return $this->hasMany(Armada::class);
    }

    public function mesinProduksis()
    {
        return $this->hasMany(MesinProduksi::class);
    }

    public function akunKasBanks()
    {
        return $this->hasMany(AkunKasBank::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('aktif', true);
    }

    public function scopeByKode($query, $kode)
    {
        return $query->where('kode', $kode);
    }
}
