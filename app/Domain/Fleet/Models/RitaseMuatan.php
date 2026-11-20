<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RitaseMuatan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ritase_muatans';

    protected $fillable = [
        'ritase_id',
        'jenis_muatan',
        'material_id',
        'jumlah_driver',
        'satuan',
        'dicatat_oleh',
    ];

    protected $casts = [
        'jumlah_driver' => 'float',
    ];

    public function ritase()
    {
        return $this->belongsTo(Ritase::class);
    }

    public function pencatat()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
