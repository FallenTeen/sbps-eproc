<?php

namespace App\Domain\HR\Models;

use App\Domain\Core\Models\Titik;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KaryawanTitikAssignment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'karyawan_titik_assignments';

    protected $fillable = [
        'karyawan_id',
        'titik_id',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    // Relasi
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeByTitik($query, $titikId)
    {
        return $query->where('titik_id', $titikId);
    }
}
