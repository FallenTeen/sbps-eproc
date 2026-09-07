<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ChecklistSerahTerima;
use App\Domain\Fleet\Models\SewaAlatJam;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\ValidationException;

/**
 * Bagian 21.10 — cetak dokumen checklist serah terima (PDF, dompdf —
 * sudah di stack Bagian 20.1, sama seperti invoice/slip gaji, bukan library
 * baru). Berisi kondisi `berangkat` & `kembali` berdampingan + pemakaian HM.
 */
class GenerateChecklistSerahTerimaPdfAction
{
    public function execute(SewaAlatJam $sewa)
    {
        $berangkat = $sewa->checklists()->with(['details', 'armada'])->byTipe('berangkat')->first();
        $kembali = $sewa->checklists()->with(['details', 'armada'])->byTipe('kembali')->first();

        if (! $berangkat || ! $kembali) {
            throw ValidationException::withMessages([
                'status' => 'Checklist berangkat & kembali wajib lengkap sebelum mencetak.',
            ]);
        }

        $pemakaian = max(0, (float) $kembali->odo_atau_hm - (float) $berangkat->odo_atau_hm);

        return Pdf::loadView('pdf.checklist-serah-terima', [
            'sewa' => $sewa,
            'berangkat' => $berangkat,
            'kembali' => $kembali,
            'pemakaian' => $pemakaian,
        ])->setPaper('a4', 'landscape');
    }
}