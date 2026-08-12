<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\RuteTarif;

class EstimateBBMFromJarakAction
{
    public function execute(RuteTarif $rute, float $jumlahRit): float
    {
        return $rute->jarak_km * ($rute->indeks_liter_solar_per_km ?? 0.3) * $jumlahRit;
    }
}
