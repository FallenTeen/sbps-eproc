<?php

namespace App\Domain\Fleet\Models;

use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Database\Factories\Domain\Fleet\Models\HelperArmadaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HelperArmada extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'helper_armadas';

    protected $fillable = [
        'armada_id',
        'nama',
        'no_hp',
        'foto',
        'honor',
        'durasi_mulai',
        'durasi_selesai',
        'status',
        'created_by',
    ];

    protected $casts = [
        'honor' => 'float',
        'durasi_mulai' => 'date',
        'durasi_selesai' => 'date',
    ];

    protected static function newFactory()
    {
        return HelperArmadaFactory::new();
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    /**
     * PIC yang membuat helper ini (object-level ownership, Bagian 21.6).
     * Bukan role-based: hanya creator/PIC aktif armada yang boleh lihat/kelola.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function presensis()
    {
        return $this->hasMany(PresensiHelper::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
}