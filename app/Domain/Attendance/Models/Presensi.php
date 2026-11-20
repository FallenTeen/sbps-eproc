<?php

namespace App\Domain\Attendance\Models;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    use HasUuids;

    protected $table = 'presensis';

    protected $fillable = [
        'karyawan_id',
        'titik_id',
        'check_in',
        'check_in_lat',
        'check_in_lng',
        'check_in_photo',
        'check_in_photo_metadata',
        'check_out',
        'check_out_lat',
        'check_out_lng',
        'check_out_photo',
        'check_out_photo_metadata',
        'status_validasi',
        'check_out_status',
        'catatan_override',
        'device_id',
    ];

    protected $casts = [
        'check_in' => 'datetime',
        'check_out' => 'datetime',
        'check_in_lat' => 'float',
        'check_in_lng' => 'float',
        'check_out_lat' => 'float',
        'check_out_lng' => 'float',
        'check_in_photo_metadata' => 'array',
        'check_out_photo_metadata' => 'array',
    ];

    protected $appends = [
        'check_in_photo_url',
        'check_out_photo_url',
        'durasi_menit',
        'lembur_menit',
        'lembur_label',
    ];

    /// URL lengkap foto check-in untuk verifikasi (null jika tidak ada foto).
    public function getCheckInPhotoUrlAttribute(): ?string
    {
        return $this->check_in_photo ? asset('storage/' . $this->check_in_photo) : null;
    }

    /// URL lengkap foto check-out (null jika tidak ada foto / belum check-out).
    public function getCheckOutPhotoUrlAttribute(): ?string
    {
        return $this->check_out_photo ? asset('storage/' . $this->check_out_photo) : null;
    }

    /// Durasi kerja mentah (menit) check_in -> check_out; null bila belum check-out.
    public function getDurasiMenitAttribute(): ?int
    {
        if (! $this->check_in || ! $this->check_out) {
            return null;
        }

        return (int) $this->check_in->diffInMinutes($this->check_out);
    }

    /// Waktu jam kerja lewat sebelum lembur (Carbon), null bila belum check-out.
    public function getMulaiLemburAttribute()
    {
        if (! $this->check_in) {
            return null;
        }

        return $this->check_in->copy()->addMinutes(
            (int) config('attendance.lembur.threshold_menit', 510)
        );
    }

    /// Menit lembur minus pembulatan per N menit (round-up); 0 bila di bawah threshold.
    public function getLemburMenitAttribute(): int
    {
        $durasi = $this->durasi_menit;

        if ($durasi === null) {
            return 0;
        }

        $threshold = (int) config('attendance.lembur.threshold_menit', 510);
        $pembulatan = max(1, (int) config('attendance.lembur.pembulatan_menit', 30));

        if ($durasi <= $threshold) {
            return 0;
        }

        return (int) (ceil(($durasi - $threshold) / $pembulatan) * $pembulatan);
    }

    /// Label durasi + lembur utk UI/mobile, mis. "8j 15m (+30m lembur)".
    public function getLemburLabelAttribute(): ?string
    {
        $durasi = $this->durasi_menit;

        if ($durasi === null) {
            return null;
        }

        $label = sprintf('%dj %02dm', intdiv($durasi, 60), $durasi % 60);

        if ($this->lembur_menit > 0) {
            $label .= sprintf(' (+%dm lembur)', $this->lembur_menit);
        }

        return $label;
    }

    // Relasi
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function formulir()
    {
        return $this->hasOne(FormulirLapangan::class);
    }

    public function trackingLocations()
    {
        return $this->hasMany(MobileTrackingLocation::class);
    }

    // Scope dengan type hint
    public function scopeValid(Builder $query): Builder
    {
        return $query->where('status_validasi', 'valid');
    }

    public function scopeLuarRadius(Builder $query): Builder
    {
        return $query->where('status_validasi', 'luar_radius');
    }

    public function scopeByTanggal(Builder $query, string $tanggal): Builder
    {
        return $query->whereDate('check_in', $tanggal);
    }

    public function scopeByKaryawan(Builder $query, string $karyawanId): Builder
    {
        return $query->where('karyawan_id', $karyawanId);
    }
}
