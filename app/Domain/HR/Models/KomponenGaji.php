<?php

namespace App\Domain\HR\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KomponenGaji extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'komponen_gajis';
    protected $fillable = ['gaji_periode_id', 'jenis', 'jumlah', 'keterangan'];
    protected $casts = ['jumlah' => 'float'];

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
