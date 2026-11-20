<?php

namespace App\Domain\Security\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class SecurityChecklistRun extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia;

    protected $table = 'security_checklist_runs';

    protected $fillable = [
        'periode',
        'jam_pantau',
        'tanggal',
        'items',
        'catatan',
        'security_id',
        'titik_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'items' => 'array',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('foto_pantau');
    }

    public function security()
    {
        return $this->belongsTo(User::class, 'security_id');
    }
}
