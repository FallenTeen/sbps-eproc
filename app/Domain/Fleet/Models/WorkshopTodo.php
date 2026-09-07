<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Production\Models\MesinProduksi;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Database\Factories\Domain\Fleet\Models\WorkshopTodoFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Bagian 21.9 — to-do servis rutin Workshop (terjadwal),
 * terpisah dari ajuan insidental 21.8 tapi bisa saling terhubung
 * lewat `terkait_pengajuan_servis_id`.
 */
class WorkshopTodo extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'workshop_todos';

    protected $fillable = [
        'judul',
        'deskripsi',
        'jadwal_tipe',
        'jadwal_detail',
        'armada_id',
        'mesin_id',
        'status',
        'assigned_to',
        'terkait_pengajuan_servis_id',
        'created_by',
    ];

    protected $appends = ['due_date', 'status_text', 'unit_label', 'jadwal_label'];

    protected static function newFactory()
    {
        return WorkshopTodoFactory::new();
    }

    // Relasi
    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function mesin()
    {
        return $this->belongsTo(MesinProduksi::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function terkaitPengajuanServis()
    {
        return $this->belongsTo(PengajuanServisArmada::class, 'terkait_pengajuan_servis_id');
    }

    public function spareparts()
    {
        return $this->hasMany(PengajuanServisSparepart::class, 'workshop_todo_id');
    }

    /**
     * Tanggal jadwal berikutnya (relative terhadap `$from`). Harian = tiap hari;
     * mingguan = hari (senin..minggu); bulanan = tanggal 1..31 (clamp 28);
     * tanggal_tertentu = tanggal absolut.
     */
    public function dueDate(?CarbonInterface $from = null): CarbonInterface
    {
        $from = $from ? Carbon::parse($from)->startOfDay() : Carbon::now()->startOfDay();
        $detail = $this->jadwal_detail;

        return match ($this->jadwal_tipe) {
            'mingguan' => $this->nextWeekday($from, (int) ($detail !== null ? ($this->dayNameToNumber((string) $detail) ?? 1) : 1)),
            'bulanan' => $this->nextMonthDay($from, (int) ($detail ?: 1)),
            'tanggal_tertentu' => Carbon::parse($detail)->startOfDay(),
            default => $from->copy(), // harian
        };
    }

    private function dayNameToNumber(string $name): ?int
    {
        // basis startOfWeek(MONDAY) = hari pertama = Senin (+0)
        $map = [
            'senin' => 0, 'selasa' => 1, 'rabu' => 2, 'kamis' => 3,
            'jumat' => 4, 'sabtu' => 5, 'minggu' => 6,
        ];

        return $map[strtolower($name)] ?? null;
    }

    private function nextWeekday(Carbon $from, int $day): Carbon
    {
        $candidate = $from->copy()->startOfWeek(Carbon::MONDAY)->addDays($day);
        if ($candidate->lt($from)) {
            $candidate->addWeek();
        }

        return $candidate;
    }

    private function nextMonthDay(Carbon $from, int $day): Carbon
    {
        $day = max(1, min($day, 28));
        $candidate = $from->copy()->startOfMonth()->addDays($day - 1);
        if ($candidate->lt($from)) {
            $candidate->addMonth();
        }

        return $candidate;
    }

    public function getDueDateAttribute(): Carbon
    {
        return $this->dueDate();
    }

    /** Status efektif: `terlewat` diturunkan (jadwal lewat tanpa selesai). */
    public function getStatusTextAttribute(): string
    {
        if ($this->status === 'selesai') {
            return 'selesai';
        }

        return $this->dueDate()->lt(Carbon::now()->startOfDay()) ? 'terlewat' : 'terjadwal';
    }

    public function getUnitLabelAttribute(): string
    {
        if ($this->armada) {
            return $this->armada->plat_nomor ?: $this->armada->kode_unit;
        }

        if ($this->mesin) {
            return $this->mesin->nama;
        }

        return '-';
    }

    public function getJadwalLabelAttribute(): string
    {
        $label = [
            'harian' => 'Harian',
            'mingguan' => 'Mingguan',
            'bulanan' => 'Bulanan',
            'tanggal_tertentu' => 'Tanggal Tertentu',
        ][$this->jadwal_tipe] ?? $this->jadwal_tipe;

        $detail = $this->jadwal_detail;
        if ($this->jadwal_tipe === 'mingguan' && $detail) {
            $detail = ucfirst($detail);
        }
        if ($this->jadwal_tipe === 'bulanan' && $detail) {
            $detail = 'tanggal '.$detail;
        }

        return $detail ? "{$label} ({$detail})" : $label;
    }

    // Scope
    public function scopeBelumSelesai($query)
    {
        return $query->where('status', '!=', 'selesai');
    }

    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }
}