<?php

namespace App\Domain\Attendance\Models;

use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Pencatat batch tracking yang sudah diproses (idempotency).
 * Satu baris = satu kiriman POST /tracking/batch utuh.
 */
class TrackingBatch extends Model
{
    use HasUuids;

    protected $table = 'tracking_batches';

    protected $fillable = [
        'karyawan_id',
        'batch_id',
        'received_count',
        'saved_count',
    ];

    protected $casts = [
        'received_count' => 'integer',
        'saved_count' => 'integer',
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}
