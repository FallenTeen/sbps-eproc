<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ChecklistSerahTerima;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Models\User;

/**
 * Bagian 21.10 - catat checklist serah terima (major) sewa alat,
 * dipanggil 2x per transaksi: `berangkat` & `kembali`.
 *
 * `data_penyewa` adalah snapshot dari `sewa_alat_jams` (PT, alamat,
 * penanggung_jawab, no_hp) - tidak diinput ulang (spec 21.10).
 * Idempoten per (sewa, tipe): record ulang menggantikan baris lama.
 */
class RecordChecklistSerahTerimaAction
{
    public function execute(SewaAlatJam $sewa, string $tipe, array $data, ?User $user = null): ChecklistSerahTerima
    {
        $current = ChecklistSerahTerima::with('details')
            ->where('sewa_alat_jam_id', $sewa->id)
            ->where('tipe', $tipe)
            ->first();
        $sibling = ChecklistSerahTerima::with('details')
            ->where('sewa_alat_jam_id', $sewa->id)
            ->where('tipe', '!=', $tipe)
            ->first();

        $submittedItems = collect($data['items'] ?? [])
            ->mapWithKeys(function ($item) {
                $label = is_array($item) ? trim((string) ($item['item'] ?? '')) : '';

                return $label === '' ? [] : [$label => $item];
            });

        $template = ChecklistSerahTerima::normalizeTemplate($data['item_template'] ?? null);
        if ($template === []) {
            // Klien lama mengirim item saja; jadikan itu template kustom.
            $template = ChecklistSerahTerima::normalizeTemplate($submittedItems->keys()->all());
        }
        if ($template === []) {
            $template = ChecklistSerahTerima::canonicalTemplate($current, $sibling);
        }

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
                'item_template' => $template,
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
        foreach ($template as $label) {
            $item = $submittedItems->get($label, []);

            $checklist->details()->create([
                'item' => $label,
                'kondisi' => $item['kondisi'] ?? 'baik',
                'catatan' => $item['catatan'] ?? null,
            ]);
        }

        if ($sibling) {
            $sibling->update(['item_template' => $template]);

            $siblingItems = $sibling->details()->get()->keyBy('item');
            foreach ($template as $label) {
                if ($siblingItems->has($label)) {
                    continue;
                }

                $sibling->details()->create([
                    'item' => $label,
                    'kondisi' => 'baik',
                ]);
            }

            $sibling->details()->whereNotIn('item', $template)->delete();
        }

        return $checklist->fresh(['details', 'armada', 'dicatatOleh']);
    }
}