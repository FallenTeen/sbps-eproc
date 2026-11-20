<?php

namespace App\Domain\Finance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Penanda baris mutasi yang dibuat manual via menu
 * Rekap Pemasukan & Pengeluaran. Data keuangan sesungguhnya
 * tetap di MutasiKasBank (referensi morph → model ini).
 */
class RekapManual extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rekap_manuals';

    protected $fillable = [
        'created_by',
    ];

    public function createdBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function mutasi()
    {
        return $this->morphOne(MutasiKasBank::class, 'referensi');
    }
}
