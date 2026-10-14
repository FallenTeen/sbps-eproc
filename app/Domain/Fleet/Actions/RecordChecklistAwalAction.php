<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Services\ChecklistLockService;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Validation\ValidationException;

/**
 * Catat "Checklist Awal" (pagi) pada tabel bersama `armada_checklist_harians`
 * (dipakai armada maupun mesin produksi). Liter/rupiah solar TIDAK lagi
 * disimpan di sini — pindah ke armada_pengisian_solars.
 */
class RecordChecklistAwalAction
{
    /**
     * Field yang dipertahankan pada update parsial (submit ulang tanpa kirim
     * semua field tidak menghapus nilai lama).
     */
    private const PERSIST_FIELDS = [
        'odo_pagi', 'foto_odo_pagi', 'foto_odo_pagi_metadata',
        'jam_mulai_operasi', 'hm_odo', 'items', 'stok_solar',
        'foto_stok_solar', 'foto_stok_solar_metadata',
    ];

    public function __construct(private ChecklistLockService $lock = new ChecklistLockService)
    {
    }

    public function execute($checkable, array $data): ArmadaChecklistHarian
    {
        $data = array_merge($this->defaults(), $data);
        $data['tanggal'] = $data['tanggal'] ?? now()->toDateString();

        $payload = [
            'kondisi_baik' => $data['kondisi_baik'] !== null ? (bool) $data['kondisi_baik'] : null,
            'item_bermasalah' => $data['item_bermasalah'],
            'items' => $this->normalizeItems($data['items']),
            'stok_solar' => $data['stok_solar'],
            'foto_stok_solar' => $data['foto_stok_solar'],
            'foto_stok_solar_metadata' => $data['foto_stok_solar_metadata'],
            'odo_pagi' => $data['odo_pagi'],
            'foto_odo_pagi' => $data['foto_odo_pagi'],
            'foto_odo_pagi_metadata' => $data['foto_odo_pagi_metadata'],
            'jam_mulai_operasi' => $data['jam_mulai_operasi'],
            'hm_odo' => $data['hm_odo'],
            'dicatat_oleh_karyawan_id' => $data['dicatat_oleh_karyawan_id'],
            'client_uuid' => $data['client_uuid'] ?: null,
        ];

        // Bila rincian per bagian dikirim, server yang menentukan kondisi_baik
        // & item_bermasalah (satu sumber kebenaran).
        if ($payload['items'] !== null) {
            ['kondisi_baik' => $baik, 'item_bermasalah' => $masalah] = $this->deriveFromItems($payload['items']);
            $payload['kondisi_baik'] = $baik;
            $payload['item_bermasalah'] = $masalah;
        }

        $existing = $checkable->checklists()->whereDate('tanggal', $data['tanggal'])->first();

        if ($existing) {
            $karyawan = $data['dicatat_oleh_karyawan_id'] ? Karyawan::find($data['dicatat_oleh_karyawan_id']) : null;
            $lock = $this->lock->isAwalLocked($existing, $karyawan);
            if ($lock['locked']) {
                throw ValidationException::withMessages(['tanggal' => $lock['alasan']]);
            }

            foreach (self::PERSIST_FIELDS as $field) {
                if ($payload[$field] === null && $existing->getAttribute($field) !== null) {
                    $payload[$field] = $existing->getAttribute($field);
                }
            }

            if ($payload['kondisi_baik'] === null) {
                $payload['kondisi_baik'] = (bool) $existing->kondisi_baik;
                $payload['item_bermasalah'] = $existing->item_bermasalah;
            }

            $existing->update($payload);

            return $existing;
        }

        $payload['kondisi_baik'] = $payload['kondisi_baik'] ?? true;

        return $checkable->checklists()->create(
            array_merge($payload, ['tanggal' => $data['tanggal']])
        );
    }

    /**
     * @param  array<int, array{bagian: string, kondisi: string, catatan?: ?string, foto?: ?string}>|null  $items
     */
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

    /**
     * @return array{kondisi_baik: bool, item_bermasalah: ?string}
     */
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

    private function defaults(): array
    {
        return [
            'kondisi_baik' => null,
            'item_bermasalah' => null,
            'items' => null,
            'stok_solar' => null,
            'foto_stok_solar' => null,
            'foto_stok_solar_metadata' => null,
            'odo_pagi' => null,
            'foto_odo_pagi' => null,
            'foto_odo_pagi_metadata' => null,
            'jam_mulai_operasi' => null,
            'hm_odo' => null,
            'client_uuid' => null,
            'dicatat_oleh_karyawan_id' => null,
        ];
    }
}
