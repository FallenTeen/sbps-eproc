<?php
namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RecordRitaseAction
{
    public function execute(array $data): Ritase
    {
        // Cari tarif dari rute jika ada
        $tarif = null;
        if (!empty($data['rute_tarif_id'])) {
            $rute = RuteTarif::find($data['rute_tarif_id']);
            $tarif = $rute->tarif_per_rit;
        } else {
            // Jika rute_tarif_id null, tarif diinput manual
            $tarif = $data['tarif_per_rit_snapshot'] ?? 0;
        }

        return DB::transaction(function () use ($data, $tarif) {
            $ritase = Ritase::create([
                'armada_id' => $data['armada_id'],
                'driver_karyawan_id' => $data['driver_karyawan_id'],
                'tanggal' => $data['tanggal'] ?? now(),
                'rute_tarif_id' => $data['rute_tarif_id'] ?? null,
                'kategori' => $data['kategori'] ?? null,
                'material' => $data['material'] ?? null,
                'jumlah_rit' => $data['jumlah_rit'],
                'tarif_per_rit_snapshot' => $tarif,
                'proyek_id' => $data['proyek_id'] ?? null,
                'titik_id' => $data['titik_id'] ?? null,
                'customer' => $data['customer'] ?? null,
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Simpan biaya lain jika ada
            if (!empty($data['biaya_lain'])) {
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
