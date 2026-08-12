<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\HargaJual;

class CalculateProductionCostAction
{
    public function execute(ProductionSession $session): float
    {
        $session->load(['mesin', 'items.bahanBaku']);
        $through = $session->selesai ?? $session->mulai;

        $durasi = $session->mulai && $session->selesai
            ? max(0, (float) $session->mulai->diffInMinutes($session->selesai) / 60)
            : 0;
        $biayaMesin = $durasi * (float) ($session->mesin->biaya_per_jam ?? 0);

        $biayaBahan = 0;
        foreach ($session->items as $item) {
            $harga = $this->hargaBeliBerlaku($item->bahanBaku, $through);
            $biayaBahan += (float) $item->jumlah_terpakai * ($harga ?? 0);
        }

        return $biayaMesin + $biayaBahan;
    }

    protected function hargaBeliBerlaku($bahanBaku, $tanggal): ?float
    {
        $harga = $bahanBaku->hargaBeli()
            ->where('berlaku_dari', '<=', $tanggal)
            ->where(function ($q) use ($tanggal) {
                $q->whereNull('berlaku_sampai')
                    ->orWhere('berlaku_sampai', '>=', $tanggal);
            })
            ->orderBy('berlaku_dari', 'desc')
            ->first();

        return $harga ? (float) $harga->harga : null;
    }
}