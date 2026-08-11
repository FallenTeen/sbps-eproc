<?php
namespace App\Domain\Core\Models;

use App\Domain\Procurement\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Proyek extends Model {
    use HasUuids;
    protected $table = 'proyek';
    protected $fillable = ['unit_bisnis_id', 'kode_proyek', 'nama', 'tipe_proyek', 'client', 'lokasi', 'tanggal_mulai', 'tanggal_selesai_rencana', 'tanggal_selesai_aktual', 'status', 'catatan', 'created_by'];

    public function unitBisnis() {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function titik() {
        return $this->hasMany(Titik::class);
    }

    public function rab() {
        return $this->hasMany(Rab::class);
    }

    public function purchaseOrders() {
        return $this->hasMany(PurchaseOrder::class);
    }
}
