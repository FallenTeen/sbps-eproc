<?php

namespace App\Domain\Production\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class QCSample extends Model
{
    use HasUuids;

    protected $table = 'qc_samples';

    protected $fillable = [
        'production_session_id',
        'client_uuid',
        'jenis_uji',
        'nilai_slump',
        'tanggal_uji_tekan_rencana',
        'hasil_uji_tekan',
        'status',
        'catatan',
    ];

    protected $casts = [
        'nilai_slump' => 'float',
        'tanggal_uji_tekan_rencana' => 'date',
        'hasil_uji_tekan' => 'float',
    ];

    // Relasi
    public function session()
    {
        return $this->belongsTo(ProductionSession::class, 'production_session_id');
    }

    // Scope
    public function scopeMenunggu($query)
    {
        return $query->where('status', 'menunggu_hasil');
    }

    public function scopeLolos($query)
    {
        return $query->where('status', 'lolos');
    }

    public function scopeTidakLolos($query)
    {
        return $query->where('status', 'tidak_lolos');
    }
}
