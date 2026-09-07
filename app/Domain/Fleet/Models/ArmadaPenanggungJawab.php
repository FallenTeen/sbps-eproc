<?php

namespace App\Domain\Fleet\Models;

use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArmadaPenanggungJawab extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'armada_penanggung_jawabs';

    protected $fillable = [
        'armada_id',
        'karyawan_id',
        'peran',
        'mulai_dari',
        'sampai',
        'alasan',
        'created_by',
    ];

    protected $casts = [
        'mulai_dari' => 'date',
        'sampai' => 'date',
    ];

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id');
    }

    public function scopeAktif($query)
    {
        return $query->whereNull('sampai');
    }
}
