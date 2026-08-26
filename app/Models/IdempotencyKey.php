<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Response cache untuk retry Idempotency-Key.
 * Satu baris = satu request sukses yang bisa dibalas ulang persis sama.
 */
class IdempotencyKey extends Model
{
    use HasUuids;

    protected $table = 'idempotency_keys';

    public $timestamps = false;

    protected $fillable = [
        'key',
        'user_id',
        'endpoint',
        'response_status',
        'response_body',
        'created_at',
    ];

    protected $casts = [
        'response_status' => 'integer',
        'created_at' => 'datetime',
    ];
}
