<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PresensiHelper extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'presensi_helpers';

    protected $fillable = [
        'helper_armada_id',
        'tanggal',
        'check_in',
        'foto_check_in',
        'check_out',
        'foto_check_out',
        'dicatat_oleh',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'check_in' => 'datetime',
        'check_out' => 'datetime',
    ];

    /** URL foto ikut terkirim ke web tanpa perlu dipanggil manual. */
    protected $appends = ['foto_check_in_url', 'foto_check_out_url'];

    public function helper()
    {
        return $this->belongsTo(HelperArmada::class, 'helper_armada_id');
    }

    /**
     * Selalu user PIC yang mencatat (helper tidak punya akun).
     */
    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }

    public function getFotoCheckInUrlAttribute(): ?string
    {
        return $this->foto_check_in ? Storage::disk('public')->url($this->foto_check_in) : null;
    }

    public function getFotoCheckOutUrlAttribute(): ?string
    {
        return $this->foto_check_out ? Storage::disk('public')->url($this->foto_check_out) : null;
    }
}