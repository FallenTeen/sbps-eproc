<?php

namespace App\Domain\Fleet\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RitaseBiayaLain extends Model
{
    use HasUuids;

    protected $table = 'ritase_biaya_lains';
    protected $fillable = ['ritase_id', 'jenis', 'jumlah', 'catatan'];
    protected $casts = ['jumlah' => 'float'];

    // Relasi
    public function ritase()
    {
        return $this->belongsTo(Ritase::class);
    }
}
