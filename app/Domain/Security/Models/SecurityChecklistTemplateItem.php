<?php

namespace App\Domain\Security\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SecurityChecklistTemplateItem extends Model
{
    use HasUuids;

    protected $table = 'security_checklist_template_items';

    protected $fillable = [
        'template_id',
        'urutan',
        'teks',
    ];

    public function template()
    {
        return $this->belongsTo(SecurityChecklistTemplate::class, 'template_id');
    }
}
