<?php

namespace App\Domain\Core\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Production\Models\MesinProduksi;
use Database\Factories\TitikFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Titik extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'titiks';

    protected $fillable = [
        'proyek_id',
        'nama',
        'latitude',
        'longitude',
        'radius_presensi_meter',
        'status',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'radius_presensi_meter' => 'integer',
    ];

    protected static function newFactory()
    {
        return TitikFactory::new();
    }

    // Relasi
    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function rab()
    {
        return $this->hasMany(Rab::class);
    }

    public function armadas()
    {
        return $this->hasMany(Armada::class);
    }

    public function mesinProduksis()
    {
        return $this->hasMany(MesinProduksi::class);
    }

    public function stokMutasis()
    {
        return $this->hasMany(StokMutasi::class);
    }

    public function karyawanAssignments()
    {
        return $this->hasMany(KaryawanTitikAssignment::class);
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeByProyek($query, $proyekId)
    {
        return $query->where('proyek_id', $proyekId);
    }
}
