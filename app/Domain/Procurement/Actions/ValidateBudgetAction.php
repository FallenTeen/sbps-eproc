<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Rab;
use App\Domain\Procurement\Models\PurchaseOrder;
use Illuminate\Support\Facades\Auth;

class ValidateBudgetAction
{
    public function execute(PurchaseOrder $po): bool
    {
        $items = $po->items()->with('bahanBaku')->get();
        $errors = [];

        foreach ($items as $item) {
            if ($item->bahanBaku->kategori !== 'bahan_baku') {
                continue; // sparepart tidak divalidasi
            }

            // Cari RAB yang relevan (Titik dulu, lalu Proyek)
            $rab = Rab::where('proyek_id', $po->proyek_id)
                ->where('kategori', 'bahan_baku')
                ->when($po->titik_id, function ($q) use ($po) {
                    return $q->where('titik_id', $po->titik_id);
                })
                ->first();

            if (! $rab) {
                $errors[] = 'Tidak ada RAB kategori bahan_baku untuk proyek/titik ini.';

                continue;
            }

            $realisasi = (new GetRABRealisasiAction)->execute($rab);
            // Tambahkan subtotal item ini (karena belum termasuk dalam realisasi saat submit)
            $totalSetelah = $realisasi + $item->subtotal;

            if ($totalSetelah > $rab->rencana && ! Auth::user()->hasRole('Owner')) {
                $errors[] = "RAB {$rab->kategori} melebihi rencana (rencana: {$rab->rencana}, realisasi: {$realisasi}, tambahan: {$item->subtotal})";
            }
        }

        if (! empty($errors)) {
            throw new \Exception(implode("\n", $errors));
        }

        return true;
    }
}
