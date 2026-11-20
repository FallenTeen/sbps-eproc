<?php

namespace App\Domain\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Bagian 21.10 - header checklist serah terima (major) sewa alat.
 * Dua baris per transaksi sewa: `berangkat` & `kembali`.
 */
class ChecklistSerahTerima extends Model
{
    use HasUuids;

    protected $table = 'checklist_serah_terima_armada';

    /**
     * Item pengecekan default - reuse kondisi checklist harian (21.3)
     * tapi lebih lengkap (major/serah terima).
     */
    public const DEFAULT_ITEMS = [
        'Kondisi Mesin & Getaran',
        'Kondisi Rem / Hydraulic',
        'Kondisi Ban & Velg',
        'Kondisi Kaca & Spion',
        'Kondisi Aki & Kelistrikan',
        'Kondisi Lampu & Klakson',
        'Kondisi Dashboard & Instrumen (ODO/HM)',
        'Kondisi Kebocoran Oli / Solar',
        'Kondisi Sabuk, Radiator & Pendingin',
        'Kondisi Body / Karoseri',
        'Kondisi Kabin & Kebersihan Unit',
        'Kondisi Perlengkapan (Kunci, Dongkrak, Ban Cadangan)',
    ];

    protected $fillable = [
        'sewa_alat_jam_id',
        'armada_id',
        'tipe',
        'item_template',
        'data_penyewa',
        'odo_atau_hm',
        'foto_kondisi',
        'catatan',
        'ditandatangani_oleh',
        'tanggal',
        'dicatat_oleh_id',
    ];

    protected $casts = [
        'item_template' => 'array',
        'data_penyewa' => 'array',
        'foto_kondisi' => 'array',
        'odo_atau_hm' => 'float',
        'tanggal' => 'date',
    ];

    public function sewa()
    {
        return $this->belongsTo(SewaAlatJam::class, 'sewa_alat_jam_id');
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function details()
    {
        return $this->hasMany(ChecklistSerahTerimaDetail::class, 'checklist_serah_terima_armada_id');
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh_id');
    }

    public function scopeByTipe($query, string $tipe)
    {
        return $query->where('tipe', $tipe);
    }

    /**
     * Normalkan daftar item kustom: string unik, urut sesuai input.
     */
    public static function normalizeTemplate(mixed $template): array
    {
        if (is_string($template)) {
            $decoded = json_decode($template, true);
            $template = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($template)) {
            return [];
        }

        $items = [];
        foreach ($template as $value) {
            if (is_array($value)) {
                $value = $value['item'] ?? $value['label'] ?? null;
            }

            if (! is_string($value)) {
                continue;
            }

            $value = trim($value);
            if ($value === '' || in_array($value, $items, true)) {
                continue;
            }

            $items[] = mb_substr($value, 0, 255);

            if (count($items) >= 50) {
                break;
            }
        }

        return $items;
    }

    /**
     * Template kanonik untuk satu transaksi sewa.
     * Baris yang paling baru diperbarui menang agar perubahan pada salah satu
     * sisi (berangkat/kembali) langsung berlaku untuk keduanya.
     */
    public static function canonicalTemplate(?self $berangkat, ?self $kembali = null): array
    {
        $checklists = collect([$berangkat, $kembali])
            ->filter()
            ->sortByDesc(fn (self $checklist) => $checklist->updated_at);

        foreach ($checklists as $checklist) {
            $template = static::normalizeTemplate($checklist->item_template);
            if ($template !== []) {
                return $template;
            }
        }

        foreach ($checklists as $checklist) {
            if (! $checklist->relationLoaded('details')) {
                continue;
            }

            $template = static::normalizeTemplate(
                $checklist->details->pluck('item')->all()
            );
            if ($template !== []) {
                return $template;
            }
        }

        return static::DEFAULT_ITEMS;
    }

    public static function templateForSewa(SewaAlatJam $sewa): array
    {
        $checklists = static::with('details')
            ->where('sewa_alat_jam_id', $sewa->id)
            ->get();

        return static::canonicalTemplate(
            $checklists->firstWhere('tipe', 'berangkat'),
            $checklists->firstWhere('tipe', 'kembali'),
        );
    }
}