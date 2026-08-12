<?php

namespace App\Domain\Core\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KomunikasiLog extends Model
{
    use HasUuids;

    protected $table = 'komunikasi_logs';

    protected $fillable = [
        'proyek_id',
        'user_id',
        'pengirim_role',
        'pesan',
    ];

    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
