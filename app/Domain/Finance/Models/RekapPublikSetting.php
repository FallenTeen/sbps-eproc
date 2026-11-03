<?php

namespace App\Domain\Finance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Singleton pengaturan halaman publik /rekap-publik.
 * Password disimpan terenkripsi (bisa di-reveal oleh pemegang
 * permission 'manage rekap keuangan'); null/kosong = halaman
 * publik bebas diakses.
 */
class RekapPublikSetting extends Model
{
    use HasUuids;

    protected $table = 'rekap_publik_settings';

    protected $fillable = [
        'password',
        'updated_by',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'updated_by');
    }

    public static function current(): self
    {
        return static::firstOrNew([]);
    }

    public function getRequiresPasswordAttribute(): bool
    {
        return ! empty($this->password);
    }
}
