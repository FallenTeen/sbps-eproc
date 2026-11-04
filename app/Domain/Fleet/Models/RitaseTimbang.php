<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RitaseTimbang extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ritase_timbangs';

    protected $fillable = [
        'ritase_id',
        'berat_kosong_kg',
        'berat_isi_kg',
        'berat_netto_kg',
        'tara_sumber',
        'nomor_tiket',
        'foto_tiket',
        'ditimbang_oleh',
        'ditimbang_pada',
    ];

    protected $casts = [
        'berat_kosong_kg' => 'float',
        'berat_isi_kg' => 'float',
        'berat_netto_kg' => 'float',
        'ditimbang_pada' => 'datetime',
    ];

    protected $appends = [
        'foto_tiket_url',
    ];

    public function getFotoTiketUrlAttribute(): ?string
    {
        if (! $this->foto_tiket) {
            return null;
        }

        if (str_starts_with($this->foto_tiket, 'http://') || str_starts_with($this->foto_tiket, 'https://')) {
            return $this->foto_tiket;
        }

        return Storage::disk('public')->url($this->foto_tiket);
    }

    public function ritase()
    {
        return $this->belongsTo(Ritase::class);
    }

    public function penimbang()
    {
        return $this->belongsTo(User::class, 'ditimbang_oleh');
    }
}
