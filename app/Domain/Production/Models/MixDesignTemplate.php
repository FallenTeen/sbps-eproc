<?php

namespace App\Domain\Production\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MixDesignTemplate extends Model
{
    use HasUuids;

    protected $table = 'mix_design_templates';

    protected $fillable = ['mutu_beton', 'nama', 'deskripsi'];

    // Relasi
    public function items()
    {
        return $this->hasMany(MixDesignTemplateItem::class);
    }
}
