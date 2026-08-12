<?php

namespace App\Domain\Fleet\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ServiceInterval extends Model
{
    use HasUuids;

    protected $table = 'service_intervals';
    protected $fillable = [
        'serviceable_type',
        'serviceable_id',
        'interval_bulan',
        'interval_jam_operasional'
    ];
    protected $casts = [
        'interval_bulan' => 'integer',
        'interval_jam_operasional' => 'integer',
    ];

    // Relasi polymorphic
    public function serviceable()
    {
        return $this->morphTo();
    }
}
