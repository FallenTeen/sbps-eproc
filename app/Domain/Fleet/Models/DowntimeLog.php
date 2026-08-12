<?php

namespace App\Domain\Fleet\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DowntimeLog extends Model
{
    use HasUuids;

    protected $table = 'downtime_logs';
    protected $fillable = [
        'serviceable_type',
        'serviceable_id',
        'mulai',
        'selesai',
        'penyebab',
        'kategori',
        'catatan'
    ];
    protected $casts = [
        'mulai' => 'datetime',
        'selesai' => 'datetime',
    ];

    // Relasi polymorphic
    public function serviceable()
    {
        return $this->morphTo();
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->whereNull('selesai');
    }

    public function scopeByKategori($query, $kategori)
    {
        return $query->where('kategori', $kategori);
    }
}
