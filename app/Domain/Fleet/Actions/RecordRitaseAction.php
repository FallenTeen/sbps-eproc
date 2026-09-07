<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use Illuminate\Support\Facades\DB;

class RecordRitaseAction
{
    /**
     * v6 (Bagian 21.4) — multi-satuan & nominal.
     *
     * Alur:
     * - `satuan_volume` default 'ritase'.
     * - Kalau `rute_tarif_id` ada, `tarif_per_rit_snapshot` diambil dari master rute.
     * - `nominal` adalah input mentah yang BISA di-override user (rekomendasi dari master rute).
     * - `total_upah_rit` dinormalisasi:
     *     - satuan 'ritase'  -> jumlah_rit * tarif_per_rit_snapshot
     *     - satuan lainnya   -> nominal (atau jumlah_rit * tarif jika nominal kosong)
     */
    public function execute(array $data): Ritase
    {
        $jumlahRit = (int) ($data['jumlah_rit'] ?? 0);
        $satuan = $data['satuan_volume'] ?? 'ritase';

        // Tarif snapshot dari rute (rekomendasi) atau manual
        $tarif = null;
        if (! empty($data['rute_tarif_id'])) {
            $rute = RuteTarif::find($data['rute_tarif_id']);
            $tarif = (float) ($rute->tarif_per_rit ?? 0);
        } else {
            $tarif = (float) ($data['tarif_per_rit_snapshot'] ?? 0);
        }

        // Rekomendasi nominal dari rute (bisa di-override form/proses panggilan)
        $rekomendasi = $jumlahRit * $tarif;

        // Normalkan total_upah_rit
        if ($satuan === 'ritase') {
            $totalUpah = $jumlahRit * $tarif;
        } else {
            // Satuan tonase/m3/harian -> pakai nominal (manual), fallback ke hitung ritase
            $totalUpah = (float) ($data['nominal'] ?? $rekomendasi);
        }

        return DB::transaction(function () use ($data, $tarif, $jumlahRit, $satuan, $totalUpah, $rekomendasi) {
            $ritase = Ritase::create([
                'armada_id' => $data['armada_id'],
                'driver_karyawan_id' => $data['driver_karyawan_id'],
                'tanggal' => $data['tanggal'] ?? now(),
                'rute_tarif_id' => $data['rute_tarif_id'] ?? null,
                'kategori' => $data['kategori'] ?? null,
                'material' => $data['material'] ?? null,
                'jumlah_rit' => $jumlahRit,
                'satuan_volume' => $satuan,
                'jumlah_volume' => $data['jumlah_volume'] ?? null,
                'tarif_per_rit_snapshot' => $tarif,
                'nominal' => $data['nominal'] ?? $rekomendasi,
                'total_upah_rit' => $totalUpah,
                'proyek_id' => $data['proyek_id'] ?? null,
                'titik_id' => $data['titik_id'] ?? null,
                'customer' => $data['customer'] ?? null,
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Simpan biaya lain jika ada
            if (! empty($data['biaya_lain'])) {
                foreach ($data['biaya_lain'] as $bl) {
                    $ritase->biayaLain()->create([
                        'jenis' => $bl['jenis'],
                        'jumlah' => $bl['jumlah'],
                        'catatan' => $bl['catatan'] ?? null,
                    ]);
                }
            }

            return $ritase;
        });
    }
}
