<?php

namespace App\Domain\Security\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BukuTamu extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'buku_tamus';

    protected $fillable = [
        'nama',
        'jumlah_orang',
        'asal',
        'nomor_telepon',
        'kendaraan',
        'plat_nomor',
        'foto',
        'waktu_masuk',
        'waktu_keluar',
        'catatan',
        'dicatat_oleh',
    ];

    protected $casts = [
        'jumlah_orang' => 'integer',
        'waktu_masuk' => 'datetime',
        'waktu_keluar' => 'datetime',
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

    public function pencatat()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
