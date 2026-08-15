<?php

namespace App\Domain\Shared\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Dokumen extends Model implements HasMedia
{
    use HasUuids, InteractsWithMedia;

    protected $table = 'dokumens';
    protected $fillable = [
        'subject_type',
        'subject_id',
        'nama',
        'kategori',
        'tipe',
        'catatan',
        'uploaded_by',
    ];

    public function subject()
    {
        return $this->morphTo();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('file')
            ->singleFile();
    }
}