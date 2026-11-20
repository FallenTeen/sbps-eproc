<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Core\Models\Proyek;
use App\Domain\Finance\Models\InvoiceItem;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SewaAlatJam extends Model
{
    use HasUuids;

    protected $table = 'sewa_alat_jams';

    protected $fillable = [
        'armada_id',
        'tipe_sewa',
        'proyek_id',
        'penyewa_eksternal',
        'penyewa_nama',
        'penyewa_pt',
        'penyewa_alamat',
        'penyewa_penanggung_jawab',
        'penyewa_no_hp',
        'lokasi_pekerjaan',
        'harga_per_jam_snapshot',
        'tanggal',
        'hm_awal',
        'hm_akhir',
        'jumlah_jam',
        'status',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'harga_per_jam_snapshot' => 'float',
        'hm_awal' => 'float',
        'hm_akhir' => 'float',
        'jumlah_jam' => 'float',
    ];

    // Relasi
    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function invoiceItems()
    {
        return $this->morphMany(InvoiceItem::class, 'referensi');
    }

    public function checklists()
    {
        return $this->hasMany(ChecklistSerahTerima::class, 'sewa_alat_jam_id');
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

    public function scopeByArmada($query, $armadaId)
    {
        return $query->where('armada_id', $armadaId);
    }
}
