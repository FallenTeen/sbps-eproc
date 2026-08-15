<?php

namespace App\Models;

use Database\Factories\UserFactory;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, HasUuids;

    protected $fillable = [
        'name',
        'email',
        'password',
        'nama_lengkap',
        'jabatan',
        'unit_bisnis_id',
        'divisi',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'is_active' => 'boolean',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
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

    public function isOwner(): bool
    {
        return $this->hasRole('Owner');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('Admin') || $this->hasRole('Owner') || $this->hasRole('Admin Keuangan');
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
