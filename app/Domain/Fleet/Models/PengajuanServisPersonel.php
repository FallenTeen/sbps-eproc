<?php

namespace App\Domain\Fleet\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PengajuanServisPersonel extends Model
{
    use HasUuids;

    protected $table = 'pengajuan_servis_personels';

    protected $fillable = ['pengajuan_servis_armada_id', 'nama_personel', 'peran'];

    public function pengajuan()
    {
        return $this->belongsTo(PengajuanServisArmada::class, 'pengajuan_servis_armada_id');
    }
}
