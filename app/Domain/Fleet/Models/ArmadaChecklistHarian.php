<?php

namespace App\Domain\Fleet\Models;

use App\Domain\HR\Models\Karyawan;
use Database\Factories\Domain\Fleet\Models\ArmadaChecklistHarianFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'dicatat_oleh_karyawan_id',
        'status',
        'solar_liter',
        'solar_harga_rp',
        'odo_pagi',
        'foto_odo_pagi',
        'odo_sore',
        'foto_odo_sore',
        'jam_mulai_operasi',
        'jam_selesai_operasi',
        'hm_odo',
        'odo_anomali',
        'client_uuid',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'kondisi_baik' => 'boolean',
        'solar_liter' => 'float',
        'solar_harga_rp' => 'float',
        'odo_pagi' => 'float',
        'odo_sore' => 'float',
        'hm_odo' => 'float',
        'odo_anomali' => 'boolean',
    ];

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
