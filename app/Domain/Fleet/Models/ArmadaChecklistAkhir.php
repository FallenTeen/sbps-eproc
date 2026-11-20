<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Fleet\Enums\StokSolar;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * Checklist Akhir (sore). Terpisah dari checklist awal, 1 baris per checklist
 * awal. Final: setelah disubmit tidak dapat diubah (lihat RecordChecklistAkhirAction).
 */
class ArmadaChecklistAkhir extends Model
{
    use HasUuids;

    protected $table = 'armada_checklist_akhirs';

    protected $fillable = [
        'armada_id',
        'checklist_awal_id',
        'tanggal',
        'items',
        'kondisi_baik',
        'item_bermasalah',
        'stok_solar',
        'foto_stok_solar',
        'foto_stok_solar_metadata',
        'odo_akhir',
        'foto_odo_akhir',
        'foto_odo_akhir_metadata',
        'jam_selesai_operasi',
        'hm_akhir',
        'odo_anomali',
        'dicatat_oleh_karyawan_id',
        'client_uuid',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'items' => 'array',
        'kondisi_baik' => 'boolean',
        'stok_solar' => StokSolar::class,
        'foto_stok_solar_metadata' => 'array',
        'foto_odo_akhir_metadata' => 'array',
        'odo_akhir' => 'float',
        'hm_akhir' => 'float',
        'odo_anomali' => 'boolean',
    ];

    /** URL foto ikut terkirim ke web tanpa perlu dipanggil manual. */
    protected $appends = ['foto_odo_akhir_url', 'foto_stok_solar_url'];

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function awal()
    {
        return $this->belongsTo(ArmadaChecklistHarian::class, 'checklist_awal_id');
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(Karyawan::class, 'dicatat_oleh_karyawan_id');
    }

    public function getFotoOdoAkhirUrlAttribute(): ?string
    {
        return $this->foto_odo_akhir ? Storage::disk('public')->url($this->foto_odo_akhir) : null;
    }

    public function getFotoStokSolarUrlAttribute(): ?string
    {
        return $this->foto_stok_solar ? Storage::disk('public')->url($this->foto_stok_solar) : null;
    }
}
