<?php

namespace App\Domain\Finance\Models;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Proyek;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Invoice extends Model
{
    use HasUuids;

    protected $table = 'invoices';
    protected $fillable = [
        'unit_bisnis_id',
        'proyek_id',
        'kode_invoice',
        'termin_pembayaran_hari',
        'tanggal_terbit',
        'tanggal_jatuh_tempo',
        'status',
        'catatan',
        'created_by'
    ];
    protected $casts = [
        'termin_pembayaran_hari' => 'integer',
        'tanggal_terbit' => 'date',
        'tanggal_jatuh_tempo' => 'date',
    ];

    // Relasi
    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function pembayaranKlien()
    {
        return $this->hasMany(PembayaranKlien::class);
    }

    // Scope dengan type hint
    public function scopeBelumLunas(Builder $query): Builder
    {
        return $query->whereIn('status', ['draft', 'terkirim', 'lunas_sebagian', 'jatuh_tempo']);
    }

    public function scopeByUnit(Builder $query, string $unitBisnisId): Builder
    {
        return $query->where('unit_bisnis_id', $unitBisnisId);
    }

    public function scopeByProyek(Builder $query, string $proyekId): Builder
    {
        return $query->where('proyek_id', $proyekId);
    }
}
