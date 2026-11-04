<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Fleet\States\PengajuanServisState;
use App\Models\User;
use Database\Factories\Domain\Fleet\Models\PengajuanServisArmadaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\ModelStates\HasStates;

class PengajuanServisArmada extends Model implements HasMedia
{
    use HasFactory, HasStates, HasUuids, InteractsWithMedia;

    protected $table = 'pengajuan_servis_armadas';

    protected $fillable = [
        'kode_pengajuan',
        'tanggal_ajuan',
        'armada_id',
        'tipe_servis',
        'diajukan_oleh',
        'foto_armada',
        'catatan_ajuan',
        'keluhan',
        'kategori',
        'odometer_saat_ajuan',
        'jam_operasional_saat_ajuan',
        'catatan_acc',
        'status',
        'disetujui_oleh',
        'tanggal_acc',
        'tanggal_mulai_kerja',
        'tanggal_selesai_kerja',
        'catatan_pengerjaan',
        'butuh_sparepart',
        'status_pengadaan_sparepart',
        'total_biaya',
        'tanggal_selesai',
    ];

    protected $casts = [
        'tanggal_ajuan' => 'date',
        'tanggal_acc' => 'date',
        'tanggal_mulai_kerja' => 'date',
        'tanggal_selesai_kerja' => 'date',
        'tanggal_selesai' => 'date',
        'butuh_sparepart' => 'boolean',
        'total_biaya' => 'float',
        'odometer_saat_ajuan' => 'float',
        'jam_operasional_saat_ajuan' => 'float',
        'status' => PengajuanServisState::class,
    ];

    protected static function newFactory()
    {
        return PengajuanServisArmadaFactory::new();
    }

    protected function registerStates(): void
    {
        $this->addState('status', PengajuanServisState::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('foto_hasil_kerja');
    }

    public function getFotoHasilUrlsAttribute(): array
    {
        return $this->getMedia('foto_hasil_kerja')
            ->map(fn ($media) => $media->getUrl())
            ->values()
            ->all();
    }

    // Relasi
    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function eksternalDetail()
    {
        return $this->hasOne(ServisEksternalDetail::class, 'pengajuan_id');
    }

    public function eksternalNotas()
    {
        return $this->hasMany(ServisEksternalNota::class, 'pengajuan_id');
    }

    public function diajukanOleh()
    {
        return $this->belongsTo(User::class, 'diajukan_oleh');
    }

    public function disetujuiOleh()
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }

    public function personels()
    {
        return $this->hasMany(PengajuanServisPersonel::class);
    }

    public function spareparts()
    {
        return $this->hasMany(PengajuanServisSparepart::class);
    }

    public function workshopTodos()
    {
        return $this->hasMany(WorkshopTodo::class, 'terkait_pengajuan_servis_id');
    }

    // Scope
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
