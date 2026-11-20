<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ServisEksternalDetail extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'servis_eksternal_detail';

    protected $fillable = [
        'pengajuan_id',
        'nama_bengkel',
        'alamat_bengkel',
        'latitude',
        'longitude',
        'foto_bengkel',
        'foto_bengkel_diambil_pada',
        'rincian_pekerjaan',
        'total_biaya_estimasi',
        'verifikasi_workshop',
        'verifikasi_workshop_oleh',
        'verifikasi_workshop_pada',
        'verifikasi_workshop_catatan',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'total_biaya_estimasi' => 'float',
        'foto_bengkel_diambil_pada' => 'datetime',
        'verifikasi_workshop_pada' => 'datetime',
    ];

    protected $appends = [
        'foto_bengkel_url',
    ];

    public function getFotoBengkelUrlAttribute(): ?string
    {
        if (! $this->foto_bengkel) {
            return null;
        }

        if (str_starts_with($this->foto_bengkel, 'http://') || str_starts_with($this->foto_bengkel, 'https://')) {
            return $this->foto_bengkel;
        }

        return Storage::disk('public')->url($this->foto_bengkel);
    }

    public function pengajuan()
    {
        return $this->belongsTo(PengajuanServisArmada::class, 'pengajuan_id');
    }

    public function verifikasiWorkshopOleh()
    {
        return $this->belongsTo(User::class, 'verifikasi_workshop_oleh');
    }
}
