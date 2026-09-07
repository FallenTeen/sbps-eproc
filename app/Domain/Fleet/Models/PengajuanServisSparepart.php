<?php

namespace App\Domain\Fleet\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PengajuanServisSparepart extends Model
{
    use HasUuids;

    protected $table = 'pengajuan_servis_spareparts';

    protected $fillable = [
        'pengajuan_servis_armada_id',
        'nama_item',
        'jumlah',
        'satuan',
        'nominal',
        'tanggal',
        'foto_nota',
        'status',
        'catatan',
    ];

    protected $casts = [
        'jumlah' => 'float',
        'nominal' => 'float',
        'tanggal' => 'date',
    ];

    public function pengajuan()
    {
        return $this->belongsTo(PengajuanServisArmada::class, 'pengajuan_servis_armada_id');
    }
}
