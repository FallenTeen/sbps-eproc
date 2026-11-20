<?php

namespace App\Domain\Security\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SecurityChecklistRunItem extends Model
{
    use HasUuids;

    protected $table = 'security_checklist_run_items';

    protected $fillable = [
        'run_id',
        'template_item_id',
        'done',
        'catatan',
        'foto',
        'waktu',
    ];

    protected $casts = [
        'done' => 'boolean',
        'waktu' => 'datetime',
    ];

    public function run()
    {
        return $this->belongsTo(SecurityChecklistRun::class, 'run_id');
    }

    public function templateItem()
    {
        return $this->belongsTo(SecurityChecklistTemplateItem::class, 'template_item_id');
    }
}
