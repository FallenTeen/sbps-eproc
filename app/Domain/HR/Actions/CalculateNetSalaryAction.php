<?php

namespace App\Domain\HR\Actions;

use App\Domain\HR\Models\GajiPeriode;

class CalculateNetSalaryAction
{
    public function execute(GajiPeriode $periode): float
    {
        $total = $periode->komponen->sum('jumlah');
        $potongan = $periode->komponen->where('jenis', 'like', '%_potongan')->sum('jumlah');
        return $total - $potongan;
    }
}
