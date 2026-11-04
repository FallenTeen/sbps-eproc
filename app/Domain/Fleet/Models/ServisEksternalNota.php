<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ServisEksternalNota extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'servis_eksternal_notas';

    protected $fillable = [
        'pengajuan_id',
        'foto_nota',
        'nominal_rp',
        'tanggal_nota',
        'diinput_oleh',
        'catatan',
    ];

    protected $casts = [
        'nominal_rp' => 'float',
        'tanggal_nota' => 'date',
    ];

    protected $appends = [
        'foto_nota_url',
    ];

    public function getFotoNotaUrlAttribute(): ?string
    {
        if (! $this->foto_nota) {
            return null;
        }

        if (str_starts_with($this->foto_nota, 'http://') || str_starts_with($this->foto_nota, 'https://')) {
            return $this->foto_nota;
        }

        return Storage::disk('public')->url($this->foto_nota);
    }

    public function pengajuan()
    {
        return $this->belongsTo(PengajuanServisArmada::class, 'pengajuan_id');
    }

    public function diinputOleh()
    {
        return $this->belongsTo(User::class, 'diinput_oleh');
    }
}
