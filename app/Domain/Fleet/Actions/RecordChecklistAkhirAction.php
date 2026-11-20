<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistAkhir;
use Illuminate\Validation\ValidationException;

/**
 * Catat "Checklist Akhir" (sore). Final: setelah tersubmit tidak dapat diubah,
 * kecuali submit ulang idempotent dengan client_uuid yang sama.
 */
class RecordChecklistAkhirAction
{
    public function execute(Armada $armada, array $data): ArmadaChecklistAkhir
    {
        $tanggal = $data['tanggal'] ?? now()->toDateString();

        $awal = $armada->checklists()->whereDate('tanggal', $tanggal)->first();
        if (! $awal) {
            throw ValidationException::withMessages(['tanggal' => 'Isi checklist awal terlebih dahulu.']);
        }

        $existing = ArmadaChecklistAkhir::where('checklist_awal_id', $awal->id)->first();
        if ($existing) {
            // Idempotent: retry dengan client_uuid yang sama mengembalikan baris yang ada.
            if (! empty($data['client_uuid']) && $data['client_uuid'] === $existing->client_uuid) {
                return $existing;
            }

            throw ValidationException::withMessages(['tanggal' => 'Checklist akhir sudah final dan tidak dapat diubah.']);
        }

        $items = $this->normalizeItems($data['items'] ?? null);
        $kondisiBaik = $data['kondisi_baik'] ?? true;
        $itemBermasalah = $data['item_bermasalah'] ?? null;
        if ($items !== null) {
            ['kondisi_baik' => $kondisiBaik, 'item_bermasalah' => $itemBermasalah] = $this->deriveFromItems($items);
        }

        return ArmadaChecklistAkhir::create([
            'armada_id' => $armada->id,
            'checklist_awal_id' => $awal->id,
            'tanggal' => $tanggal,
            'items' => $items,
            'kondisi_baik' => $kondisiBaik,
            'item_bermasalah' => $itemBermasalah,
            'stok_solar' => $data['stok_solar'] ?? null,
            'foto_stok_solar' => $data['foto_stok_solar'] ?? null,
            'foto_stok_solar_metadata' => $data['foto_stok_solar_metadata'] ?? null,
            'odo_akhir' => $data['odo_akhir'] ?? null,
            'foto_odo_akhir' => $data['foto_odo_akhir'] ?? null,
            'foto_odo_akhir_metadata' => $data['foto_odo_akhir_metadata'] ?? null,
            'jam_selesai_operasi' => $data['jam_selesai_operasi'] ?? null,
            'hm_akhir' => $data['hm_akhir'] ?? null,
            'odo_anomali' => $this->isOdoAnomali($armada, $awal, $data),
            'dicatat_oleh_karyawan_id' => $data['dicatat_oleh_karyawan_id'] ?? null,
            'client_uuid' => $data['client_uuid'] ?? null,
        ]);
    }

    private function isOdoAnomali(Armada $armada, $awal, array $data): bool
    {
        if ($armada->tipe_unit === 'alat_berat') {
            return $data['hm_akhir'] !== null && $awal->hm_odo !== null
                && (float) $data['hm_akhir'] < (float) $awal->hm_odo;
        }

        return $data['odo_akhir'] !== null && $awal->odo_pagi !== null
            && (float) $data['odo_akhir'] < (float) $awal->odo_pagi;
    }

    private function normalizeItems(?array $items): ?array
    {
        if (! is_array($items)) {
            return null;
        }

        return array_map(fn ($i) => [
            'bagian' => $i['bagian'] ?? null,
            'kondisi' => $i['kondisi'] ?? 'baik',
            'catatan' => $i['catatan'] ?? null,
            'foto' => $i['foto'] ?? null,
        ], $items);
    }

    private function deriveFromItems(array $items): array
    {
        $buruk = array_values(array_filter($items, fn ($i) => ($i['kondisi'] ?? 'baik') !== 'baik'));

        return [
            'kondisi_baik' => $buruk === [],
            'item_bermasalah' => $buruk === []
                ? null
                : implode('; ', array_map(fn ($i) => ($i['bagian'] ?? '?').': '.str_replace('_', ' ', (string) ($i['kondisi'] ?? 'baik')), $buruk)),
        ];
    }
}
