<?php
namespace App\Domain\Procurement\Models;
use App\Domain\Procurement\States\PurchaseOrderState;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Spatie\ModelStates\HasStates;

class PurchaseOrder extends Model
{
    use HasUuids, HasStates;
    protected $table = 'purchase_orders';
    protected $fillable = ['kode_po', 'proyek_id', 'titik_id', 'supplier_id', 'created_by', 'tanggal_pesan', 'tanggal_diperlukan', 'total', 'status', 'catatan'];

    protected $casts = [
        'status' => PurchaseOrderState::class,
    ];

    public function proyek()
    {
        return $this->belongsTo(\App\Domain\Core\Models\Proyek::class);
    }

    public function titik()
    {
        return $this->belongsTo(\App\Domain\Core\Models\Titik::class);
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

    public function pembayaran()
    {
        return $this->hasMany(Pembayaran::class);
    }

    public function stokMutasi()
    {
        return $this->morphMany(StokMutasi::class, 'referensi');
    }
}
