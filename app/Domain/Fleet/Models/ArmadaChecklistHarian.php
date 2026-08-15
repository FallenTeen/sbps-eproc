<?php

namespace App\Domain\Fleet\Models;

use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArmadaChecklistHarian extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'armada_checklist_harians';
    protected $fillable = [
        'checkable_type',
        'checkable_id',
        'tanggal',
        'kondisi_baik',
        'item_bermasalah',
        'dicatat_oleh_karyawan_id'
    ];
    protected $casts = [
        'tanggal' => 'date',
        'kondisi_baik' => 'boolean',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Domain\Fleet\Models\ArmadaChecklistHarianFactory::new();
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
