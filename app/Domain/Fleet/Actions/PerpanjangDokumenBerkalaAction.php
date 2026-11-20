<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use App\Domain\Fleet\Models\ArmadaDokumenBerkalaRiwayat;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * TD-C4: Perpanjang Dokumen Berkala Armada (Pajak/STNK/KIR).
 * Menyimpan riwayat perpanjangan, memajukan tanggal jatuh tempo,
 * mencatat nominal dan scan dokumen baru, serta memperbarui timestamp armada.
 */
class PerpanjangDokumenBerkalaAction
{
    public function execute(
        ArmadaDokumenBerkala $dokumen,
        User $user,
        array $data,
        ?UploadedFile $scanDokumen = null,
    ): ArmadaDokumenBerkala {
        return DB::transaction(function () use ($dokumen, $user, $data, $scanDokumen) {
            ArmadaDokumenBerkalaRiwayat::create([
                'dokumen_berkala_id' => $dokumen->id,
                'tanggal_jatuh_tempo_lama' => $dokumen->tanggal_jatuh_tempo,
                'tanggal_jatuh_tempo_baru' => $data['tanggal_jatuh_tempo_baru'],
                'nominal_biaya' => isset($data['nominal_biaya']) ? (float) $data['nominal_biaya'] : null,
                'nomor_dokumen_baru' => $data['nomor_dokumen_baru'] ?? null,
                'diperpanjang_oleh' => $user->id,
                'catatan' => $data['catatan'] ?? null,
            ]);

            $updatePayload = [
                'tanggal_jatuh_tempo' => $data['tanggal_jatuh_tempo_baru'],
                'terakhir_dibayar_pada' => now(),
            ];

            if (! empty($data['nomor_dokumen_baru'])) {
                $updatePayload['nomor_dokumen'] = $data['nomor_dokumen_baru'];
            }

            if (isset($data['nominal_biaya'])) {
                $updatePayload['nominal_biaya'] = (float) $data['nominal_biaya'];
            }

            $dokumen->update($updatePayload);

            if ($scanDokumen) {
                $dokumen->addMedia($scanDokumen)->toMediaCollection('scan_dokumen');
            }

            // Update timestamp armada (TD-C2)
            $dokumen->armada->update([
                'data_diperbarui_pada' => now(),
                'data_diperbarui_oleh' => $user->id,
            ]);

            return $dokumen->fresh(['riwayats', 'armada']);
        });
    }
}
