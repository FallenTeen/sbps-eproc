<?php

namespace App\Domain\Production\Models;

use App\Domain\Core\Models\Titik;
use App\Domain\Finance\Models\InvoiceItem;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\StokMutasi;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductionSession extends Model
{
    use HasUuids;

    protected $table = 'production_sessions';

    protected $fillable = [
        'mesin_id',
        'titik_id',
        'produk_id',
        'operator_karyawan_id',
        'client_uuid',
        'mulai',
        'selesai',
        'hasil_output',
        'status',
        'catatan',
    ];

    protected $casts = [
        'mulai' => 'datetime',
        'selesai' => 'datetime',
        'hasil_output' => 'float',
    ];

    // Relasi
    public function mesin()
    {
        return $this->belongsTo(MesinProduksi::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class);
    }

    public function operator()
    {
        return $this->belongsTo(Karyawan::class, 'operator_karyawan_id');
    }

    public function items()
    {
        return $this->hasMany(ProductionSessionItem::class);
    }

    public function qcSamples()
    {
        return $this->hasMany(QCSample::class);
    }

    public function pengirimans()
    {
        return $this->hasMany(Pengiriman::class);
    }

    public function invoiceItems()
    {
        return $this->morphMany(InvoiceItem::class, 'referensi');
    }

    public function stokMutasis()
    {
        return $this->morphMany(StokMutasi::class, 'referensi');
    }

    // Scope
    public function scopeBerjalan($query)
    {
        return $query->where('status', 'berjalan');
    }

    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }

    public function scopeByProduk($query, $produkId)
    {
        return $query->where('produk_id', $produkId);
    }

    public function scopeByTitik($query, $titikId)
    {
        return $query->where('titik_id', $titikId);
    }
}
