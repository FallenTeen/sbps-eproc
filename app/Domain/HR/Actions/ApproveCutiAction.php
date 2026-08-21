<?php

namespace App\Domain\HR\Actions;

use App\Domain\HR\Models\Cuti;
use Illuminate\Support\Facades\Auth;

class ApproveCutiAction
{
    /**
     * Approve or reject a cuti request.
     *
     * @param  string  $status  'disetujui' atau 'ditolak'
     */
    public function execute(Cuti $cuti, string $status = 'disetujui', ?string $catatan = null): Cuti
    {
        $cuti->update([
            'status' => $status,
            'disetujui_oleh' => Auth::id(),
            'catatan' => $catatan ?? $cuti->catatan,
        ]);

        return $cuti;
    }
}
