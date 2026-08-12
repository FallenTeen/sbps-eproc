<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\SewaAlatJam;

class RecordSewaAlatJamAction
{
    /**
     * Catat sewa alat per jam (HM-based)
     *
     * @param array $data
     * @return SewaAlatJam
     */
    public function execute(array $data): SewaAlatJam
    {
        $harga = $data['harga_per_jam_snapshot'] ?? 0;
        $jam = $data['jumlah_jam'] ?? 0;

        // Jika ada HM awal dan akhir, hitung otomatis
        if (!empty($data['hm_awal']) && !empty($data['hm_akhir'])) {
            $jam = $data['hm_akhir'] - $data['hm_awal'];
        }

        return SewaAlatJam::create([
            'armada_id' => $data['armada_id'],
            'proyek_id' => $data['proyek_id'] ?? null,
            'penyewa_eksternal' => $data['penyewa_eksternal'] ?? null,
            'lokasi_pekerjaan' => $data['lokasi_pekerjaan'] ?? null,
            'harga_per_jam_snapshot' => $harga,
            'tanggal' => $data['tanggal'] ?? now(),
            'hm_awal' => $data['hm_awal'] ?? null,
            'hm_akhir' => $data['hm_akhir'] ?? null,
            'jumlah_jam' => $jam,
            'catatan' => $data['catatan'] ?? null,
            'status' => 'draft',
        ]);
    }
}
