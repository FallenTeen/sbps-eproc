<?php

namespace App\Domain\Fleet\States;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class PengajuanServisState extends State
{
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Diajukan::class)
            ->allowTransition(Diajukan::class, Disetujui::class)
            ->allowTransition(Diajukan::class, Ditolak::class)
            ->allowTransition(Disetujui::class, Dikerjakan::class)
            ->allowTransition(Disetujui::class, Ditolak::class)
            ->allowTransition(Dikerjakan::class, MenungguSparepart::class)
            ->allowTransition(Dikerjakan::class, Selesai::class)
            ->allowTransition(MenungguSparepart::class, SparepartTersedia::class)
            ->allowTransition(SparepartTersedia::class, Selesai::class)
            ->allowTransition(MenungguSparepart::class, Selesai::class);
    }
}
