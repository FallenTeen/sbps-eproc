<?php

namespace App\Domain\Core\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnitBisnis extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'unit_bisnis';
    protected $fillable = ['kode', 'nama', 'deskripsi', 'aktif'];
    protected $casts = ['aktif' => 'boolean'];

    // Tentukan factory yang digunakan
    protected static function newFactory()
    {
        return \Database\Factories\UnitBisnisFactory::new();
    }

    public function proyeks()
    {
        return $this->hasMany(Proyek::class);
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
