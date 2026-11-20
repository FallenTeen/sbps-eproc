<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Core\Models\Proyek;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use Illuminate\Validation\ValidationException;

class RecordOdoAwalProyekAction
{
    /**
     * Catat ODO awal armada saat pertama kali beroperasi di sebuah proyek.
     * Guard: hanya 1 baris per (armada_id, proyek_id).
     *
     * @throws ValidationException
     */
    public function execute(Armada $armada, Proyek $proyek, array $data): ArmadaOdoAwalProyek
    {
        $existing = ArmadaOdoAwalProyek::where('armada_id', $armada->id)
            ->where('proyek_id', $proyek->id)
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'odo_awal' => "ODO awal untuk proyek {$proyek->nama} sudah tercatat.",
            ]);
        }

        return ArmadaOdoAwalProyek::create([
            'armada_id' => $armada->id,
            'proyek_id' => $proyek->id,
            'odo_awal' => $data['odo_awal'],
            'jarak_ke_pusat_km' => $data['jarak_ke_pusat_km'] ?? null,
            'dicatat_oleh_karyawan_id' => $data['dicatat_oleh_karyawan_id'],
            'tanggal' => $data['tanggal'] ?? now(),
        ]);
    }
}