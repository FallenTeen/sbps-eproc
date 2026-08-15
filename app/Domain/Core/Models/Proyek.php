<?php

namespace App\Domain\Core\Models;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Finance\Models\Invoice;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Proyek extends Model
{
    use HasUuids, HasFactory, LogsActivity;

    protected $table = 'proyeks';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nama', 'status', 'client', 'lokasi'])
            ->logOnlyDirty();
    }
    protected $fillable = [
        'unit_bisnis_id',
        'kode_proyek',
        'nama',
        'tipe_proyek',
        'client',
        'lokasi',
        'tanggal_mulai',
        'tanggal_selesai_rencana',
        'tanggal_selesai_aktual',
        'status',
        'catatan',
        'created_by'
    ];
    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai_rencana' => 'date',
        'tanggal_selesai_aktual' => 'date',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\ProyekFactory::new();
    }

    // Relasi
    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function titik()
    {
        return $this->hasMany(Titik::class);
    }

    public function rab()
    {
        return $this->hasMany(Rab::class);
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function ritases()
    {
        return $this->hasMany(Ritase::class);
    }

    public function productionSessions()
    {
        return $this->hasMany(ProductionSession::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
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

    public function scopeKontrakKlien($query)
    {
        return $query->where('tipe_proyek', 'kontrak_klien');
    }
}
