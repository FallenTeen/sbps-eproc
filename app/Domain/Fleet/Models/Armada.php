<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use Database\Factories\ArmadaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Armada extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'armadas';

    protected $fillable = [
        'unit_bisnis_id',
        'plat_nomor',
        'kode_unit',
        'jenis',
        'tipe_unit',
        'model_tarif',
        'tahun',
        'kapasitas',
        'status',
        'titik_id',
        'tanggal_mulai_pakai',
        'tanggal_servis_terakhir',
    ];

    protected $casts = [
        'tahun' => 'integer',
        'tanggal_mulai_pakai' => 'date',
        'tanggal_servis_terakhir' => 'date',
    ];

    protected static function newFactory()
    {
        return ArmadaFactory::new();
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

    public function odoAwalProyeks()
    {
        return $this->hasMany(ArmadaOdoAwalProyek::class);
    }

    public function helperArmadas()
    {
        return $this->hasMany(HelperArmada::class);
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

    // v6 (21.2) — riwayat penanggung jawab (utama & cadangan)
    public function penanggungJawabs()
    {
        return $this->hasMany(ArmadaPenanggungJawab::class);
    }

    /**
     * PIC aktif = baris peran=utama yang `sampai` null; fallback ke cadangan aktif.
     * (spec Bagian 21.2 — utama menang, cadangan dipakai kalau utama sedang non-aktif)
     */
    public function getActivePenanggungJawabAttribute()
    {
        $utama = $this->penanggungJawabs()
            ->where('peran', 'utama')
            ->whereNull('sampai')
            ->latest('mulai_dari')
            ->first();

        if ($utama) {
            return $utama;
        }

        return $this->penanggungJawabs()
            ->where('peran', 'cadangan')
            ->whereNull('sampai')
            ->latest('mulai_dari')
            ->first();
    }

    /**
     * v6 (21.6) — apakah karyawan ini PIC aktif (utama/cadangan) armada saat ini.
     */
    public function isActivePicFor($karyawan): bool
    {
        if (! $karyawan) {
            return false;
        }

        $pic = $this->getActivePenanggungJawabAttribute();

        return $pic && $pic->karyawan_id === $karyawan->id;
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
