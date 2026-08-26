<?php

namespace App\Domain\Finance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TransferAntarKas extends Model
{
    use HasUuids;

    protected $table = 'transfer_antar_kas';

    protected $fillable = [
        'dari_akun_kas_bank_id',
        'ke_akun_kas_bank_id',
        'jumlah',
        'tanggal',
        'catatan',
        'created_by',
    ];

    protected $casts = [
        'jumlah' => 'float',
        'tanggal' => 'date',
    ];

    // Relasi
    public function dariAkun()
    {
        return $this->belongsTo(AkunKasBank::class, 'dari_akun_kas_bank_id');
    }

    public function keAkun()
    {
        return $this->belongsTo(AkunKasBank::class, 'ke_akun_kas_bank_id');
    }
}
