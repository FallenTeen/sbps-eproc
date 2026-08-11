<?php
namespace App\Domain\Procurement\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    use HasUuids;
    protected $table = 'pembayaran';
    protected $fillable = ['purchase_order_id', 'jumlah', 'tanggal', 'metode', 'akun_kas_bank_id', 'dicatat_oleh', 'catatan'];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function akunKasBank()
    {
        return $this->belongsTo(\App\Domain\Finance\Models\AkunKasBank::class);
    }
}
