<?php

namespace App\Domain\Production\Models;

use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MixDesignTemplateItem extends Model
{
    use HasUuids;

    protected $table = 'mix_design_template_items';

    protected $fillable = ['mix_design_template_id', 'bahan_baku_id', 'jumlah_per_m3'];

    protected $casts = ['jumlah_per_m3' => 'float'];

    // Relasi
    public function template()
    {
        return $this->belongsTo(MixDesignTemplate::class, 'mix_design_template_id');
    }

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }
}
