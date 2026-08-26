<?php

namespace App\Domain\Finance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AkunCoa extends Model
{
    use HasUuids;

    protected $table = 'akun_coas';

    protected $fillable = ['kode', 'nama', 'parent_id', 'posisi_normal', 'aktif'];

    protected $casts = ['aktif' => 'boolean'];

    // Relasi (self-referencing)
    public function parent()
    {
        return $this->belongsTo(AkunCoa::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AkunCoa::class, 'parent_id');
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('aktif', true);
    }
}
