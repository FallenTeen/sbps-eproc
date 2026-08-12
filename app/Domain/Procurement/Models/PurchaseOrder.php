<?php

namespace App\Domain\Procurement\Models;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Procurement\States\PurchaseOrderState;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Spatie\ModelStates\HasStates;

class PurchaseOrder extends Model
{
    use HasUuids, HasStates;

    protected $table = 'purchase_orders';
    protected $fillable = [
        'kode_po',
        'proyek_id',
        'titik_id',
        'supplier_id',
        'created_by',
        'tanggal_pesan',
        'tanggal_diperlukan',
        'total',
        'status',
        'catatan'
    ];
    protected $casts = [
        'tanggal_pesan' => 'date',
        'tanggal_diperlukan' => 'date',
        'total' => 'float',
        'status' => PurchaseOrderState::class,
    ];

    // Relasi
    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function approvals()
    {
        return $this->hasMany(PurchaseOrderApproval::class);
    }

    public function pembayarans()
    {
        return $this->hasMany(Pembayaran::class);
    }

    public function stokMutasis()
    {
        return $this->morphMany(StokMutasi::class, 'referensi');
    }

    public function serviceHistories()
    {
        return $this->hasMany(ServiceHistory::class);
    }

    // Scope
    public function scopeByProyek($query, $proyekId)
    {
        return $query->where('proyek_id', $proyekId);
    }

    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
