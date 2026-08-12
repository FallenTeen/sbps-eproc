<?php

namespace App\Domain\Fleet\Models;

use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ArmadaDriver extends Model
{
    use HasUuids;

    protected $table = 'armada_drivers';
    protected $fillable = [
        'armada_id',
        'karyawan_id',
        'tipe',
        'tanggal_mulai',
        'tanggal_selesai',
        'status'
    ];
    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    // Relasi
    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeByArmada($query, $armadaId)
    {
        return $query->where('armada_id', $armadaId);
    }
}
