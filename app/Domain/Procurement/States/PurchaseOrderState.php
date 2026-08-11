<?php
namespace App\Domain\Procurement\States;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class PurchaseOrderState extends State {
    public static function config(): StateConfig {
        return parent::config()
            ->default(Draft::class)
            ->allowTransition(Draft::class, Diajukan::class)
            ->allowTransition(Diajukan::class, MenungguApprovalFinance::class)
            ->allowTransition(Diajukan::class, Ditolak::class)
            ->allowTransition(MenungguApprovalFinance::class, MenungguApprovalOwner::class)
            ->allowTransition(MenungguApprovalFinance::class, Ditolak::class)
            ->allowTransition(MenungguApprovalOwner::class, Disetujui::class)
            ->allowTransition(MenungguApprovalOwner::class, Ditolak::class)
            ->allowTransition(Disetujui::class, Diterima::class)
            ->allowTransition(Diterima::class, DibayarSebagian::class)
            ->allowTransition(Diterima::class, Lunas::class)
            ->allowTransition(DibayarSebagian::class, Lunas::class);
    }
}
