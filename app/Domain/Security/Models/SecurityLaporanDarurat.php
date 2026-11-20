<?php

namespace App\Domain\Security\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class SecurityLaporanDarurat extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia;

    protected $table = 'security_laporan_darurats';

    protected $fillable = [
        'kategori',
        'judul',
        'deskripsi',
        'lokasi_ruangan',
        'tingkat',
        'status',
        'ditangani_oleh',
        'catatan_penanganan',
        'pelapor_id',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('foto_darurat');
    }

    public function pelapor()
    {
        return $this->belongsTo(User::class, 'pelapor_id');
    }

    public function penangan()
    {
        return $this->belongsTo(User::class, 'ditangani_oleh');
    }
}
