<?php

namespace App\Domain\HR\Actions;

use App\Domain\HR\Models\GajiPeriode;

class CalculateNetSalaryAction
{
    public function execute(GajiPeriode $periode): float
    {
        // Penerimaan: semua komponen yang jenisnya bukan 'potongan'
        $penerimaan = $periode->komponen->where('jenis', '!=', 'potongan')->sum('jumlah');
        
        // Potongan: komponen yang jenisnya 'potongan'
        $potongan = $periode->komponen->where('jenis', 'potongan')->sum('jumlah');
        
        return $penerimaan - $potongan;
    }
}
