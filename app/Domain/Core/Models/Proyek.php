<?php

namespace App\Domain\Core\Models;

use App\Domain\Finance\Models\Invoice;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\ProductionSession;
use App\Models\User;
use Database\Factories\ProyekFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Proyek extends Model
{
    use HasFactory, HasUuids, LogsActivity;

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
        'created_by',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai_rencana' => 'date',
        'tanggal_selesai_aktual' => 'date',
    ];

    protected static function newFactory()
    {
        return ProyekFactory::new();
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

    public function komunikasiLogs()
    {
        return $this->hasMany(KomunikasiLog::class);
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

    /**
     * User yang diberikan akses object-level ke proyek ini (pivot proyek_user).
     * Kelompok utama: role eksternal Kontraktor.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'proyek_user');
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

    /**
     * Batasi query hanya ke proyek yang boleh dilihat user (object-level scoping).
     *
     * Urutan:
     *  1. Owner → lihat semua.
     *  2. Role eksternal Kontraktor → hanya proyek yang ditautkan di pivot proyek_user.
     *  3. User dengan unit_bisnis_id → hanya unit-nya.
     *  4. Selain itu (karyawan internal lain) → semua (diatur permission).
     */
    public function scopeVisibleFor($query, User $user)
    {
        if ($user->hasRole('Owner')) {
            return $query;
        }

        if ($user->hasRole('Kontraktor')) {
            return $query->whereHas('users', fn ($q) => $q->where('users.id', $user->id));
        }

        if ($user->unit_bisnis_id) {
            return $query->where('unit_bisnis_id', $user->unit_bisnis_id);
        }

        return $query;
    }

    /**
     * Kumpulan ID proyek yang boleh diakses user; null berarti tanpa pembatasan.
     *
     * @return array<int, string>|null
     */
    public static function visibleForUserIds(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        if ($user->hasRole('Owner')) {
            return null;
        }

        if ($user->hasRole('Kontraktor')) {
            $ids = $user->proyeks()->pluck('proyeks.id')->all();

            return $ids === [] ? [''] : $ids;
        }

        if ($user->unit_bisnis_id) {
            return static::where('unit_bisnis_id', $user->unit_bisnis_id)->pluck('id')->all();
        }

        return null;
    }
}
