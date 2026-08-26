<?php

namespace App\Domain\Fleet\Models;

use Database\Factories\Domain\Fleet\Models\DowntimeLogFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DowntimeLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'downtime_logs';

    protected $fillable = [
        'serviceable_type',
        'serviceable_id',
        'mulai',
        'selesai',
        'penyebab',
        'kategori',
        'catatan',
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

    protected static function newFactory()
    {
        return DowntimeLogFactory::new();
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
