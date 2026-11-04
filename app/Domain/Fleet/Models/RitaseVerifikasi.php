<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RitaseVerifikasi extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ritase_verifikasis';

    protected $fillable = [
        'ritase_id',
        'tahap',
        'status',
        'jumlah_verifikasi',
        'checklist',
        'catatan',
        'foto',
        'diverifikasi_oleh',
        'diverifikasi_pada',
    ];

    protected $casts = [
        'jumlah_verifikasi' => 'float',
        'checklist' => 'array',
        'diverifikasi_pada' => 'datetime',
    ];

    protected $appends = [
        'foto_url',
    ];

    public function getFotoUrlAttribute(): ?string
    {
        if (! $this->foto) {
            return null;
        }

        if (str_starts_with($this->foto, 'http://') || str_starts_with($this->foto, 'https://')) {
            return $this->foto;
        }

        return Storage::disk('public')->url($this->foto);
    }

    public function ritase()
    {
        return $this->belongsTo(Ritase::class);
    }

    public function verifikator()
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }
}
