<?php
namespace App\Domain\Procurement\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StokMutasi extends Model
{
    use HasUuids;
    protected $table = 'stok_mutasi';
    protected $fillable = ['bahan_baku_id', 'titik_id', 'tipe', 'jumlah', 'referensi_type', 'referensi_id', 'catatan', 'tanggal', 'created_by'];

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }

    public function titik()
    {
        return $this->belongsTo(\App\Domain\Core\Models\Titik::class);
    }

    public function referensi()
    {
        return $this->morphTo();
    }
}
