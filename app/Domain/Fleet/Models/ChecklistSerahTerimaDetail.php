<?php

namespace App\Domain\Fleet\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Bagian 21.10 — detail item pengecekan kondisi unit (baik/rusak).
 */
class ChecklistSerahTerimaDetail extends Model
{
    use HasUuids;

    protected $table = 'checklist_serah_terima_detail';

    protected $fillable = [
        'checklist_serah_terima_armada_id',
        'item',
        'kondisi',
        'catatan',
    ];

    public function checklist()
    {
        return $this->belongsTo(ChecklistSerahTerima::class, 'checklist_serah_terima_armada_id');
    }
}