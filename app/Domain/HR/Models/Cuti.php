<?php

namespace App\Domain\HR\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cuti extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'cutis';
    protected $fillable = [
        'karyawan_id',
        'tipe',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
        'disetujui_oleh',
        'catatan'
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

    public function disetujuiOleh()
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }

    // Scope
    public function scopeDisetujui($query)
    {
        return $query->where('status', 'disetujui');
    }

    public function scopeDiajukan($query)
    {
        return $query->where('status', 'diajukan');
    }
}
