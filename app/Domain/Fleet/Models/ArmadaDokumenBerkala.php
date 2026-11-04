<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ArmadaDokumenBerkala extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia;

    protected $table = 'armada_dokumen_berkalas';

    protected $fillable = [
        'armada_id',
        'jenis',
        'nomor_dokumen',
        'tanggal_terbit',
        'tanggal_jatuh_tempo',
        'nominal_biaya',
        'wilayah',
        'tempat_pembayaran',
        'teknis_pembayaran',
        'reminder_hari_sebelum',
        'terakhir_dibayar_pada',
        'catatan',
        'meta',
    ];

    protected $casts = [
        'tanggal_terbit' => 'date',
        'tanggal_jatuh_tempo' => 'date',
        'nominal_biaya' => 'float',
        'reminder_hari_sebelum' => 'array',
        'terakhir_dibayar_pada' => 'datetime',
        'meta' => 'array',
    ];

    protected $appends = ['status_dokumen'];

    // ── Status turunan ──────────────────────────────────────────────────

    public function getStatusDokumenAttribute(): string
    {
        $now = now()->startOfDay();
        $jatuhTempo = $this->tanggal_jatuh_tempo ? \Carbon\Carbon::parse($this->tanggal_jatuh_tempo)->startOfDay() : null;

        if (! $jatuhTempo) {
            return 'aktif';
        }

        if ($jatuhTempo->lt($now)) {
            return 'lewat';
        }

        $sisaHari = (int) $now->diffInDays($jatuhTempo, false);

        $hariSebelum = is_array($this->reminder_hari_sebelum) && ! empty($this->reminder_hari_sebelum)
            ? (int) max($this->reminder_hari_sebelum)
            : 30;

        if ($sisaHari <= $hariSebelum) {
            return 'akan_jatuh_tempo';
        }

        return 'aktif';
    }

    public function getJenisLabelAttribute(): string
    {
        return match ($this->jenis) {
            'pajak_tahunan'   => 'Pajak Tahunan',
            'stnk_5_tahunan'  => 'STNK 5 Tahunan',
            'kir'             => 'KIR',
            default           => $this->jenis ?? '-',
        };
    }

    // ── Media ───────────────────────────────────────────────────────────

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('scan_dokumen');
    }

    // ── Relasi ──────────────────────────────────────────────────────────

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function riwayats()
    {
        return $this->hasMany(ArmadaDokumenBerkalaRiwayat::class, 'dokumen_berkala_id')
            ->latest('created_at');
    }

    // ── Scope ───────────────────────────────────────────────────────────

    public function scopeAkanJatuhTempo($query, int $hari = 30)
    {
        return $query->where('tanggal_jatuh_tempo', '<=', now()->addDays($hari))
            ->where('tanggal_jatuh_tempo', '>=', now()->startOfDay());
    }

    public function scopeSudahLewat($query)
    {
        return $query->where('tanggal_jatuh_tempo', '<', now()->startOfDay());
    }
}
