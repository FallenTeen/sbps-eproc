<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Bagian 21.10 — header checklist serah terima (major) sewa alat.
 * Dua baris per transaksi sewa: `berangkat` & `kembali`.
 */
class ChecklistSerahTerima extends Model
{
    use HasUuids;

    protected $table = 'checklist_serah_terima_armada';

    /**
     * Item pengecekan default — reuse kondisi checklist harian (21.3)
     * tapi lebih lengkap (major/serah terima).
     */
    public const DEFAULT_ITEMS = [
        'Kondisi Mesin & Getaran',
        'Rem / Hydraulic',
        'Ban & Velg',
        'Aki & Kelistrikan',
        'Lampu & Klakson',
        'Dashboard & Instrumen (ODO/HM)',
        'Kebocoran Oli / Solar',
        'Sabuk, Radiator & Pendingin',
        'Perlengkapan (Kunci, Dongkrak, Ban Cadangan)',
        'Kebersihan Kabin / Unit',
    ];

    protected $fillable = [
        'sewa_alat_jam_id',
        'armada_id',
        'tipe',
        'data_penyewa',
        'odo_atau_hm',
        'foto_kondisi',
        'catatan',
        'ditandatangani_oleh',
        'tanggal',
        'dicatat_oleh_id',
    ];

    protected $casts = [
        'data_penyewa' => 'array',
        'foto_kondisi' => 'array',
        'odo_atau_hm' => 'float',
        'tanggal' => 'date',
    ];

    public function sewa()
    {
        return $this->belongsTo(SewaAlatJam::class, 'sewa_alat_jam_id');
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function details()
    {
        return $this->hasMany(ChecklistSerahTerimaDetail::class, 'checklist_serah_terima_armada_id');
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh_id');
    }

    public function scopeByTipe($query, string $tipe)
    {
        return $query->where('tipe', $tipe);
    }
}