<?php

namespace App\Models;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'nama_lengkap',
        'jabatan',
        'unit_bisnis_id',
        'divisi',
        'is_active',
        'device_token',
        'last_tracking_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_tracking_at' => 'datetime',
        ];
    }

    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function karyawan()
    {
        return $this->hasOne(Karyawan::class, 'user_id');
    }

    /**
     * Proyek yang diizinkan dilihat user tertentu (pivot proyek_user).
     */
    public function proyeks()
    {
        return $this->belongsToMany(Proyek::class, 'proyek_user');
    }

    public function isOwner(): bool
    {
        return $this->hasRole('Owner');
    }

    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['Admin Keuangan', 'Owner']);
    }

    public function isKetuaDivisi(): bool
    {
        return $this->hasAnyRole([
            'Ketua Divisi Finance',
            'Ketua Divisi Keuangan',
            'Ketua Divisi Armada',
            'Ketua Divisi Kontraktor',
            'Ketua Divisi Produksi CBP',
            'Ketua Divisi Produksi AMP',
        ]);
    }
}
