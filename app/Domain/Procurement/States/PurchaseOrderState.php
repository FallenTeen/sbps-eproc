<?php

namespace App\Domain\Procurement\States;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

use App\Domain\Procurement\States\Draft;
use App\Domain\Procurement\States\Diajukan;
use App\Domain\Procurement\States\MenungguApprovalFinance;
use App\Domain\Procurement\States\MenungguApprovalOwner;
use App\Domain\Procurement\States\Disetujui;
use App\Domain\Procurement\States\Diterima;
use App\Domain\Procurement\States\DibayarSebagian;
use App\Domain\Procurement\States\Lunas;
use App\Domain\Procurement\States\Ditolak;

abstract class PurchaseOrderState extends State
{
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Draft::class)
            ->allowTransition(Draft::class, Diajukan::class)
            ->allowTransition(Diajukan::class, MenungguApprovalFinance::class)
            ->allowTransition(Diajukan::class, MenungguApprovalOwner::class)
            ->allowTransition(Diajukan::class, Ditolak::class)
            ->allowTransition(MenungguApprovalFinance::class, Disetujui::class)
            ->allowTransition(MenungguApprovalFinance::class, Ditolak::class)
            ->allowTransition(MenungguApprovalOwner::class, Disetujui::class)
            ->allowTransition(MenungguApprovalOwner::class, Ditolak::class)
            ->allowTransition(Disetujui::class, Diterima::class)
            ->allowTransition(Diterima::class, DibayarSebagian::class)
            ->allowTransition(Diterima::class, Lunas::class)
            ->allowTransition(DibayarSebagian::class, Lunas::class)
            ->allowTransition(DibayarSebagian::class, Diterima::class);
    }
}
