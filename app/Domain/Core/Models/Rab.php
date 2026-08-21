<?php

namespace App\Domain\Core\Models;

use Database\Factories\RabFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rab extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rabs';

    protected $fillable = [
        'proyek_id',
        'titik_id',
        'kategori',
        'rencana',
        'catatan',
        'created_by',
    ];

    protected $casts = [
        'rencana' => 'float',
    ];

    protected static function newFactory()
    {
        return RabFactory::new();
    }

    // Relasi
    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    // Scope
    public function scopeByKategori($query, $kategori)
    {
        return $query->where('kategori', $kategori);
    }

    public function scopeByProyek($query, $proyekId)
    {
        return $query->where('proyek_id', $proyekId);
    }

    public function scopeByTitik($query, $titikId)
    {
        return $query->where('titik_id', $titikId);
    }
}
