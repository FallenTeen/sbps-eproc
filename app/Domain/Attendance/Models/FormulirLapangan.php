<?php

namespace App\Domain\Attendance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FormulirLapangan extends Model
{
    use HasUuids;

    protected $table = 'formulir_lapangans';

    protected $fillable = [
        'presensi_id',
        'kondisi_area',
        'aktivitas_dilakukan',
        'kendala',
        'foto',
        'catatan_tambahan',
    ];

    // Relasi
    public function presensi()
    {
        return $this->belongsTo(Presensi::class);
    }
}
