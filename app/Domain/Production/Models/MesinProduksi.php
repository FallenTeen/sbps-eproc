<?php

namespace App\Domain\Production\Models;

use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\ServiceHistory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MesinProduksi extends Model
{
    use HasUuids;

    protected $table = 'mesin_produksis';

    protected $fillable = [
        'unit_bisnis_id',
        'nama',
        'jenis',
        'kapasitas',
        'status',
        'titik_id',
        'produk_id',
        'biaya_per_jam',
    ];

    protected $casts = [
        'biaya_per_jam' => 'float',
    ];

    // Relasi
    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function produkDefault()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    // Polymorphic (sama dengan armada)
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

    public function productionSessions()
    {
        return $this->hasMany(ProductionSession::class);
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
}
