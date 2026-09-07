<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ChecklistSerahTerima;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Models\User;

/**
 * Bagian 21.10 — catat checklist serah terima (major) sewa alat,
 * dipanggil 2x per transaksi: `berangkat` & `kembali`.
 *
 * `data_penyewa` adalah snapshot dari `sewa_alat_jams` (PT, alamat,
 * penanggung_jawab, no_hp) — tidak diinput ulang (spec 21.10).
 * Idempoten per (sewa, tipe): record ulang menggantikan baris lama.
 */
class RecordChecklistSerahTerimaAction
{
    public function execute(SewaAlatJam $sewa, string $tipe, array $data, ?User $user = null): ChecklistSerahTerima
    {
        $snapshot = [
            'nama' => $sewa->penyewa_nama,
            'pt' => $sewa->penyewa_pt,
            'alamat' => $sewa->penyewa_alamat,
            'penanggung_jawab' => $sewa->penyewa_penanggung_jawab,
            'no_hp' => $sewa->penyewa_no_hp,
        ];

        $checklist = ChecklistSerahTerima::updateOrCreate(
            ['sewa_alat_jam_id' => $sewa->id, 'tipe' => $tipe],
            [
                'armada_id' => $sewa->armada_id,
                'data_penyewa' => $snapshot,
                'odo_atau_hm' => $data['odo_atau_hm'] ?? null,
                'foto_kondisi' => $data['foto_kondisi'] ?? [],
                'catatan' => $data['catatan'] ?? null,
                'ditandatangani_oleh' => $data['ditandatangani_oleh'] ?? null,
                'tanggal' => $data['tanggal'] ?? now()->toDateString(),
                'dicatat_oleh_id' => $user?->id,
            ]
        );

        $checklist->details()->delete();
        foreach ($data['items'] ?? [] as $item) {
            if (empty($item['item'])) {
                continue;
            }
            $checklist->details()->create([
                'item' => $item['item'],
                'kondisi' => $item['kondisi'] ?? 'baik',
                'catatan' => $item['catatan'] ?? null,
            ]);
        }

        return $checklist->fresh(['details', 'armada', 'dicatatOleh']);
    }
}