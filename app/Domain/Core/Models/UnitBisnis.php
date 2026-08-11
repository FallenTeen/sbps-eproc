<?php

namespace App\Domain\Core\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UnitBisnis extends Model {
    use HasUuids;
    protected $table = 'unit_bisnis';
    protected $fillable = ['kode', 'nama', 'deskripsi', 'aktif'];

    public function proyeks() {
        return $this->hasMany(Proyek::class);
    }
}
