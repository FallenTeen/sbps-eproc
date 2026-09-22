<?php

namespace App\Domain\Core\Actions;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Buat / perbarui satu baris RAB per (proyek, titik, kategori).
 *
 * Realiasi dihitung on-the-fly oleh GetRABRealisasiAction — action ini tidak
 * pernah merekam nilai realisasi (prinsip anti-agregat statis, manual book §1.3).
 */
class SetRABAction
{
    public const KATEGORI = ['bahan_baku', 'sparepart', 'sdm_tetap', 'sdm_kondisional', 'lainnya'];

    public function execute(array $data): Rab
    {
        $proyek = Proyek::find($data['proyek_id'] ?? null);
        if (! $proyek) {
            throw ValidationException::withMessages(['proyek_id' => 'Proyek tidak ditemukan.']);
        }

        $kategori = $data['kategori'] ?? null;
        if (! in_array($kategori, self::KATEGORI, true)) {
            throw ValidationException::withMessages(['kategori' => 'Kategori RAB tidak valid.']);
        }

        $titikId = $data['titik_id'] ?? null;
        if ($titikId) {
            $titikMilikProyek = Titik::where('proyek_id', $proyek->id)->find($titikId);
            if (! $titikMilikProyek) {
                throw ValidationException::withMessages(['titik_id' => 'Titik bukan bagian dari proyek tersebut.']);
            }
        }

        $rencana = (float) ($data['rencana'] ?? 0);
        if ($rencana < 0) {
            throw ValidationException::withMessages(['rencana' => 'Nominal rencana minimal 0.']);
        }

        $rab = Rab::firstOrNew([
            'proyek_id' => $proyek->id,
            'titik_id' => $titikId,
            'kategori' => $kategori,
        ]);

        $rab->rencana = $rencana;
        if (array_key_exists('catatan', $data)) {
            $rab->catatan = $data['catatan'];
        }
        $rab->created_by = $data['created_by'] ?? Auth::id();
        $rab->save();

        return $rab->fresh();
    }
}
