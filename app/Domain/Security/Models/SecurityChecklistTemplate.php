<?php

namespace App\Domain\Security\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SecurityChecklistTemplate extends Model
{
    use HasUuids;

    protected $table = 'security_checklist_templates';

    protected $fillable = [
        'nama',
        'periode',
        'jam_mulai',
        'jam_selesai',
        'hari',
        'aktif',
        'dibuat_oleh',
    ];

    protected $casts = [
        'hari' => 'array',
        'aktif' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(SecurityChecklistTemplateItem::class, 'template_id')->orderBy('urutan');
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
