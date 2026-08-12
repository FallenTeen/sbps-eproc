<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Armada extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'armadas';
    protected $fillable = [
        'unit_bisnis_id',
        'plat_nomor',
        'kode_unit',
        'jenis',
        'model_tarif',
        'tahun',
        'kapasitas',
        'status',
        'titik_id',
        'tanggal_mulai_pakai',
        'tanggal_servis_terakhir'
    ];
    protected $casts = [
        'tahun' => 'integer',
        'tanggal_mulai_pakai' => 'date',
        'tanggal_servis_terakhir' => 'date',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\ArmadaFactory::new();
    }

    // Relasi
    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    // Polymorphic
    public function serviceHistories()
    {
        return $this->morphMany(ServiceHistory::class, 'serviceable');
    }

    public function checklists()
    {
        return $this->morphMany(ArmadaChecklistHarian::class, 'checkable');
    }

    public function bbmLogs()
    {
        return $this->morphMany(BbmLog::class, 'serviceable');
    }

    public function downtimes()
    {
        return $this->morphMany(DowntimeLog::class, 'serviceable');
    }

    // Relasi khusus armada
    public function ritases()
    {
        return $this->hasMany(Ritase::class);
    }

    public function sewaAlatJams()
    {
        return $this->hasMany(SewaAlatJam::class);
    }

    public function driverAssignments()
    {
        return $this->hasMany(ArmadaDriver::class);
    }

    public function currentDriver()
    {
        return $this->hasOne(ArmadaDriver::class)->where('status', 'aktif')->latestOfMany();
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeByUnit($query, $unitBisnisId)
    {
        return $query->where('unit_bisnis_id', $unitBisnisId);
    }

    public function scopeByTitik($query, $titikId)
    {
        return $query->where('titik_id', $titikId);
    }

    public function scopeByModelTarif($query, $model)
    {
        return $query->where('model_tarif', $model);
    }
}
