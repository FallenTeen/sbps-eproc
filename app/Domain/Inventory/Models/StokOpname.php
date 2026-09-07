<?php

namespace App\Domain\Inventory\Models;

use App\Domain\Core\Models\Titik;
use App\Domain\Procurement\Models\BahanBaku;
use App\Models\User;
use Database\Factories\Domain\Inventory\Models\StokOpnameFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StokOpname extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'stok_opnames';

    protected $fillable = [
        'bahan_baku_id',
        'titik_id',
        'tanggal',
        'saldo_sistem',
        'saldo_fisik',
        'selisih',
        'catatan',
        'dicatat_oleh',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'saldo_sistem' => 'float',
        'saldo_fisik' => 'float',
        'selisih' => 'float',
    ];

    protected static function newFactory()
    {
        return StokOpnameFactory::new();
    }

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}