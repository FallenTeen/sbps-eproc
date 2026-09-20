<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\BbmLog;

class RecordChecklistHarianAction
{
    /**
     * Field yang dibiarkan terpisah pada update parsial 2-stage.
     * Kalau field tidak dikirim ulang (misal submit sore tanpa kirim odo_pagi
     * lagi), nilai lama dipertahankan.
     */
    private const PERSIST_FIELDS = [
        'solar_liter', 'solar_harga_rp', 'odo_pagi', 'foto_odo_pagi',
        'odo_sore', 'foto_odo_sore', 'jam_mulai_operasi', 'jam_selesai_operasi', 'hm_odo',
    ];

    /**
     * Catat checklist harian (2-stage, Bagian 21.3).
     *
     * 1 baris per (checkable, tanggal) - kalau sudah ada, di-update (pagi->sore).
     * - `armada_jalan`: odo_pagi/foto_odo_pagi (kirim pagi), odo_sore/foto_odo_sore (kirim sore,
     *   otomatis status = selesai).
     * - `alat_berat`: jam_mulai_operasi / jam_selesai_operasi + hm_odo.
     * - Solar di checklist otomatis dicatat ke `bbm_logs` (bukan tabel BBM kedua).
     * - `odo_sore < odo_pagi` ditandai `odo_anomali = true` (warning, bukan block).
     *
     * Data yang didukung: tanggal, kondisi_baik, item_bermasalah, dicatat_oleh_karyawan_id,
     * status, solar_liter, solar_harga_rp, odo_pagi, foto_odo_pagi, odo_sore, foto_odo_sore,
     * jam_mulai_operasi, jam_selesai_operasi, hm_odo, client_uuid, dicatat_oleh (user id utk bbm).
     */
    public function execute($checkable, array $data): ArmadaChecklistHarian
    {
        $data = array_merge($this->defaults(), $data);
        $data['tanggal'] = $data['tanggal'] ?? now()->toDateString();

        $payload = [
            'status' => $this->resolveStatus($data),
            'kondisi_baik' => array_key_exists('kondisi_baik', $data) && $data['kondisi_baik'] !== null
                ? (bool) $data['kondisi_baik']
                : null,
            'item_bermasalah' => $data['item_bermasalah'] ?? null,
            'solar_liter' => $data['solar_liter'],
            'solar_harga_rp' => $data['solar_harga_rp'],
            'odo_pagi' => $data['odo_pagi'],
            'foto_odo_pagi' => $data['foto_odo_pagi'],
            'odo_sore' => $data['odo_sore'],
            'foto_odo_sore' => $data['foto_odo_sore'],
            'jam_mulai_operasi' => $data['jam_mulai_operasi'],
            'jam_selesai_operasi' => $data['jam_selesai_operasi'],
            'hm_odo' => $data['hm_odo'],
            'odo_anomali' => false,
            'dicatat_oleh_karyawan_id' => $data['dicatat_oleh_karyawan_id'],
            'client_uuid' => $data['client_uuid'] ?: null,
        ];

        $existing = $checkable->checklists()->whereDate('tanggal', $data['tanggal'])->first();

        if ($existing) {
            // Update parsial: pertahankan nilai lama untuk field yang tidak dikirim ulang,
            // sehingga submit sore tidak menghapus data pagi.
            foreach (self::PERSIST_FIELDS as $field) {
                if ($payload[$field] === null && $existing->getAttribute($field) !== null) {
                    $payload[$field] = $existing->getAttribute($field);
                }
            }

            // Pertahankan kondisi_baik & item_bermasalah jika tidak dikirim (null)
            // ATAU jika kondisi sebelumnya bermasalah namun update saat ini adalah update parsial ODO
            // tanpa rincian item bermasalah baru.
            if ($payload['kondisi_baik'] === null) {
                $payload['kondisi_baik'] = (bool) $existing->kondisi_baik;
                $payload['item_bermasalah'] = $existing->item_bermasalah;
            } elseif ($existing->kondisi_baik === false && empty($payload['item_bermasalah']) && ! empty($existing->item_bermasalah)) {
                $payload['kondisi_baik'] = false;
                $payload['item_bermasalah'] = $existing->item_bermasalah;
            }

            $payload['odo_anomali'] = $this->isOdoAnomaly($payload);
            $existing->update($payload);
            $checklist = $existing;
        } else {
            $payload['kondisi_baik'] = $payload['kondisi_baik'] ?? true;
            $payload['odo_anomali'] = $this->isOdoAnomaly($payload);
            $checklist = $checkable->checklists()->create(
                array_merge($payload, ['tanggal' => $data['tanggal']])
            );
        }

        $this->recordBbmIfSolar($checkable, $data);

        if (! $data['kondisi_baik'] && $data['item_bermasalah']) {
            // Catatan: notifikasi kondisi buruk tetap dibaca on-the-fly oleh
            // NotificationController (checklist kondisi buruk terbaru).
        }

        return $checklist;
    }

    private function defaults(): array
    {
        return [
            'status' => null,
            'solar_liter' => null,
            'solar_harga_rp' => null,
            'odo_pagi' => null,
            'foto_odo_pagi' => null,
            'odo_sore' => null,
            'foto_odo_sore' => null,
            'jam_mulai_operasi' => null,
            'jam_selesai_operasi' => null,
            'hm_odo' => null,
            'client_uuid' => null,
            'dicatat_oleh' => null,
        ];
    }

    private function resolveStatus(array $data): string
    {
        if (! empty($data['status'])) {
            return $data['status'] === 'selesai' ? 'selesai' : 'berjalan';
        }

        // Sore/off -> otomatis selesai
        if (! empty($data['odo_sore']) || ! empty($data['jam_selesai_operasi'])) {
            return 'selesai';
        }

        return 'berjalan';
    }

    private function isOdoAnomaly(array $data): bool
    {
        $pagi = $data['odo_pagi'] ?? null;
        $sore = $data['odo_sore'] ?? null;

        return $pagi !== null && $sore !== null && (float) $sore < (float) $pagi;
    }

    private function recordBbmIfSolar($checkable, array $data): void
    {
        $liter = $data['solar_liter'];
        if ($liter === null || $liter === '' || (float) $liter <= 0) {
            return;
        }

        // bbm_logs.dicatat_oleh mengacu ke users.id; wajib ada value
        $dicatatOleh = $data['dicatat_oleh'] ?? auth()->id();
        if (! $dicatatOleh) {
            return;
        }

        $existingBbm = BbmLog::where('serviceable_type', get_class($checkable))
            ->where('serviceable_id', $checkable->id)
            ->whereDate('tanggal', $data['tanggal'])
            ->where('liter', (float) $liter)
            ->first();

        if (! $existingBbm) {
            $checkable->bbmLogs()->create([
                'tanggal' => $data['tanggal'],
                'liter' => (float) $liter,
                'biaya' => $data['solar_harga_rp'] ?? null,
                'dicatat_oleh' => $dicatatOleh,
            ]);
        }
    }
}