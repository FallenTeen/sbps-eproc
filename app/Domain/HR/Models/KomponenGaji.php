<?php

namespace App\Domain\HR\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KomponenGaji extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'komponen_gajis';

    protected $fillable = [
        'gaji_periode_id',
        'jenis',
        'jumlah',
        'keterangan',
        'lembur_tanggal',
        'lembur_jam_menit',
        'lembur_tarif_jam',
        'diedit_manual',
    ];

    protected $casts = [
        'jumlah' => 'float',
        'lembur_tanggal' => 'date',
        'lembur_jam_menit' => 'integer',
        'lembur_tarif_jam' => 'float',
        'diedit_manual' => 'boolean',
    ];

    // Relasi
    public function gajiPeriode()
    {
        return $this->belongsTo(GajiPeriode::class);
    }

    // Scope
    public function scopeByJenis($query, $jenis)
    {
        return $query->where('jenis', $jenis);
    }
}
