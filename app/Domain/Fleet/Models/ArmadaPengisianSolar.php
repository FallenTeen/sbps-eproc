<?php

namespace App\Domain\Fleet\Models;

use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * Pengisian bahan bakar oleh driver (step 02 mobile). Sinkron dengan 1 BbmLog.
 */
class ArmadaPengisianSolar extends Model
{
    use HasUuids;

    protected $table = 'armada_pengisian_solars';

    protected $fillable = [
        'armada_id',
        'checklist_awal_id',
        'karyawan_id',
        'dicatat_oleh',
        'bbm_log_id',
        'tanggal',
        'waktu',
        'odo_atau_hm',
        'foto_odo',
        'foto_odo_metadata',
        'liter',
        'nominal_rp',
        'harga_per_liter',
        'foto_nota',
        'foto_nota_metadata',
        'catatan',
        'client_uuid',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'foto_odo_metadata' => 'array',
        'foto_nota_metadata' => 'array',
        'odo_atau_hm' => 'float',
        'liter' => 'float',
        'nominal_rp' => 'float',
        'harga_per_liter' => 'float',
    ];

    /** URL foto ikut terkirim ke web tanpa perlu dipanggil manual. */
    protected $appends = ['foto_odo_url', 'foto_nota_url'];

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function bbmLog()
    {
        return $this->belongsTo(BbmLog::class);
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }

    public function getFotoOdoUrlAttribute(): ?string
    {
        return $this->foto_odo ? Storage::disk('public')->url($this->foto_odo) : null;
    }

    public function getFotoNotaUrlAttribute(): ?string
    {
        return $this->foto_nota ? Storage::disk('public')->url($this->foto_nota) : null;
    }
}
