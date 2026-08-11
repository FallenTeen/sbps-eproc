<?php

namespace App\Domain\Core\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Titik extends Model {
    use HasUuids;
    protected $table = 'titik';
    protected $fillable = ['proyek_id', 'nama', 'latitude', 'longitude', 'radius_presensi_meter', 'status'];

    public function proyek() {
        return $this->belongsTo(Proyek::class);
    }

    public function rab() {
        return $this->hasMany(Rab::class);
    }
}
