<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Fleet\Enums\StokSolar;
use App\Domain\HR\Models\Karyawan;
use Database\Factories\Domain\Fleet\Models\ArmadaChecklistHarianFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ArmadaChecklistHarian extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'armada_checklist_harians';

    protected $fillable = [
        'checkable_type',
        'checkable_id',
        'tanggal',
        'kondisi_baik',
        'item_bermasalah',
        'items',
        'stok_solar',
        'foto_stok_solar',
        'foto_stok_solar_metadata',
        'dicatat_oleh_karyawan_id',
        'odo_pagi',
        'foto_odo_pagi',
        'foto_odo_pagi_metadata',
        'jam_mulai_operasi',
        'hm_odo',
        'client_uuid',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'kondisi_baik' => 'boolean',
        'items' => 'array',
        'stok_solar' => StokSolar::class,
        'foto_stok_solar_metadata' => 'array',
        'foto_odo_pagi_metadata' => 'array',
        'odo_pagi' => 'float',
        'hm_odo' => 'float',
    ];

    /** URL foto ikut terkirim ke web tanpa perlu dipanggil manual. */
    protected $appends = ['foto_odo_pagi_url', 'foto_stok_solar_url'];

    protected static function newFactory()
    {
        return ArmadaChecklistHarianFactory::new();
    }

    // Relasi polymorphic
    public function checkable()
    {
        return $this->morphTo();
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(Karyawan::class, 'dicatat_oleh_karyawan_id');
    }

    /** Checklist akhir hari itu (1:1). */
    public function akhir()
    {
        return $this->hasOne(ArmadaChecklistAkhir::class, 'checklist_awal_id');
    }

    /** Status turunan: `selesai` bila checklist akhir sudah ada. */
    public function getStatusAttribute(): string
    {
        return $this->akhir ? 'selesai' : 'berjalan';
    }

    public function getFotoOdoPagiUrlAttribute(): ?string
    {
        return $this->foto_odo_pagi ? Storage::disk('public')->url($this->foto_odo_pagi) : null;
    }

    public function getFotoStokSolarUrlAttribute(): ?string
    {
        return $this->foto_stok_solar ? Storage::disk('public')->url($this->foto_stok_solar) : null;
    }

    // Scope
    public function scopeByTanggal($query, $tanggal)
    {
        return $query->whereDate('tanggal', $tanggal);
    }

    public function scopeKondisiBaik($query)
    {
        return $query->where('kondisi_baik', true);
    }

    public function scopeKondisiBuruk($query)
    {
        return $query->where('kondisi_baik', false);
    }
}
