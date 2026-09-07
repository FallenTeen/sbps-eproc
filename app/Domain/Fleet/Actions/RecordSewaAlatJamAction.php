<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\SewaAlatJam;

class RecordSewaAlatJamAction
{
    /**
     * v6 (Bagian 21.5) — sewa alat per jam (HM-based), mendukung internal & eksternal.
     * tipe_sewa=internal -> wajib proyek_id. tipe_sewa=eksternal -> wajib data penyewa.
     */
    public function execute(array $data): SewaAlatJam
    {
        $harga = $data['harga_per_jam_snapshot'] ?? 0;
        $jam = $data['jumlah_jam'] ?? 0;
        $tipe = $data['tipe_sewa'] ?? 'internal';

        // Validasi: internal wajib proyek, eksternal wajib penyewa
        if ($tipe === 'internal' && empty($data['proyek_id'])) {
            abort(422, 'Sewa internal wajib memilih proyek.');
        }
        if ($tipe === 'eksternal' && empty($data['penyewa_nama'])) {
            abort(422, 'Sewa eksternal wajib mengisi nama penyewa.');
        }

        // Jika ada HM awal dan akhir, hitung otomatis
        if (! empty($data['hm_awal']) && ! empty($data['hm_akhir'])) {
            $jam = $data['hm_akhir'] - $data['hm_awal'];
        }

        return SewaAlatJam::create([
            'armada_id' => $data['armada_id'],
            'tipe_sewa' => $tipe,
            'proyek_id' => $tipe === 'internal' ? ($data['proyek_id'] ?? null) : null,
            'penyewa_eksternal' => $data['penyewa_eksternal'] ?? null,
            'penyewa_nama' => $data['penyewa_nama'] ?? null,
            'penyewa_pt' => $data['penyewa_pt'] ?? null,
            'penyewa_alamat' => $data['penyewa_alamat'] ?? null,
            'penyewa_penanggung_jawab' => $data['penyewa_penanggung_jawab'] ?? null,
            'penyewa_no_hp' => $data['penyewa_no_hp'] ?? null,
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
