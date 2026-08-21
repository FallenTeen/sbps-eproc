<?php

namespace App\Domain\Finance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PembayaranKlien extends Model
{
    use HasUuids;

    protected $table = 'pembayaran_kliens';

    protected $fillable = [
        'invoice_id',
        'tanggal',
        'jumlah',
        'metode',
        'akun_kas_bank_id',
        'dicatat_oleh',
        'dokumen_bukti',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jumlah' => 'float',
    ];

    // Relasi
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function akunKasBank()
    {
        return $this->belongsTo(AkunKasBank::class);
    }
}
