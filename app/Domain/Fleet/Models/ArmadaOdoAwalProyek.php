<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Core\Models\Proyek;
use App\Domain\HR\Models\Karyawan;
use Database\Factories\Domain\Fleet\Models\ArmadaOdoAwalProyekFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArmadaOdoAwalProyek extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'armada_odo_awal_proyeks';

    protected $fillable = [
        'armada_id',
        'proyek_id',
        'odo_awal',
        'jarak_ke_pusat_km',
        'dicatat_oleh_karyawan_id',
        'tanggal',
    ];

    protected $casts = [
        'odo_awal' => 'float',
        'jarak_ke_pusat_km' => 'float',
        'tanggal' => 'date',
    ];

    protected static function newFactory()
    {
        return ArmadaOdoAwalProyekFactory::new();
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function proyek()
    {
        return $this->belongsTo(Proyek::class);
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(Karyawan::class, 'dicatat_oleh_karyawan_id');
    }
}