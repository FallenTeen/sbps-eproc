<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Finance\Models\InvoiceItem;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ritase extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ritases';

    protected $fillable = [
        'armada_id',
        'driver_karyawan_id',
        'tanggal',
        'rute_tarif_id',
        'kategori',
        'material',
        'jumlah_rit',
        'satuan_volume',
        'jumlah_volume',
        'tarif_per_rit_snapshot',
        'nominal',
        'total_upah_rit',
        'proyek_id',
        'titik_id',
        'customer',
        'status',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jumlah_rit' => 'integer',
        'jumlah_volume' => 'float',
        'tarif_per_rit_snapshot' => 'float',
        'nominal' => 'float',
        'total_upah_rit' => 'float',
    ];

    public function getTotalUpahRitAttribute(): float
    {
        // Kolom sudah berisi nilai efektif (dari RecordRitaseAction).
        return (float) ($this->attributes['total_upah_rit'] ?? 0);
    }

    // Relasi
    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function driver()
    {
        return $this->belongsTo(Karyawan::class, 'driver_karyawan_id');
    }

    public function ruteTarif()
    {
        return $this->belongsTo(RuteTarif::class);
    }

    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function biayaLain()
    {
        return $this->hasMany(RitaseBiayaLain::class);
    }

    public function invoiceItems()
    {
        return $this->morphMany(InvoiceItem::class, 'referensi');
    }

    // Scope
    public function scopeDisetujui($query)
    {
        return $query->where('status', 'disetujui');
    }

    public function scopeDitagih($query)
    {
        return $query->where('status', 'ditagih');
    }

    public function scopeByDriver($query, $karyawanId)
    {
        return $query->where('driver_karyawan_id', $karyawanId);
    }

    public function scopeByArmada($query, $armadaId)
    {
        return $query->where('armada_id', $armadaId);
    }

    public function scopeByPeriode($query, $bulan, $tahun)
    {
        return $query->whereYear('tanggal', $tahun)->whereMonth('tanggal', $bulan);
    }
}
