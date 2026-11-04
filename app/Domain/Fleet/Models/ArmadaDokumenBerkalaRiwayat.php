<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArmadaDokumenBerkalaRiwayat extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'armada_dokumen_berkala_riwayats';

    protected $fillable = [
        'dokumen_berkala_id',
        'tanggal_jatuh_tempo_lama',
        'tanggal_jatuh_tempo_baru',
        'nominal_biaya',
        'nomor_dokumen_baru',
        'diperpanjang_oleh',
        'catatan',
    ];

    protected $casts = [
        'tanggal_jatuh_tempo_lama' => 'date',
        'tanggal_jatuh_tempo_baru' => 'date',
        'nominal_biaya' => 'float',
    ];

    public function dokumenBerkala()
    {
        return $this->belongsTo(ArmadaDokumenBerkala::class, 'dokumen_berkala_id');
    }

    public function diperpanjangOleh()
    {
        return $this->belongsTo(User::class, 'diperpanjang_oleh');
    }
}
