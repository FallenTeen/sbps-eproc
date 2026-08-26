<?php

namespace App\Domain\Production\Models;

use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductionSessionItem extends Model
{
    use HasUuids;

    protected $table = 'production_session_items';

    protected $fillable = ['production_session_id', 'bahan_baku_id', 'jumlah_terpakai'];

    protected $casts = ['jumlah_terpakai' => 'float'];

    // Relasi
    public function session()
    {
        return $this->belongsTo(ProductionSession::class, 'production_session_id');
    }

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }
}
