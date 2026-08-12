<?php

namespace App\Domain\Procurement\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderApproval extends Model
{
    use HasUuids;

    protected $table = 'purchase_order_approvals';
    protected $fillable = ['purchase_order_id', 'approved_by', 'status', 'catatan'];

    // Relasi
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
