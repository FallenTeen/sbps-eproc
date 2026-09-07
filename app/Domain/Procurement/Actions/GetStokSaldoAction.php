<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Support\Collection;

/**
 * Saldo stok dihitung on-the-fly dari `stok_mutasis` (prinsip Bagian 0 #1).
 * Menyatukan logika yang sebelumnya duplikat di BahanBakuController::show/stok
 * dan dipakai kembali oleh stok opname (Bagian 21.7) serta dashboard Inventory.
 */
class GetStokSaldoAction
{
    public function execute(BahanBaku $bahanBaku, ?string $titikId = null, ?string $sampaiTanggal = null): float
    {
        return $this->query($bahanBaku, $titikId, $sampaiTanggal)
            ->get()
            ->sum(fn ($m) => $m->tipe === 'masuk' ? $m->jumlah : -$m->jumlah);
    }

    public function perTitik(BahanBaku $bahanBaku, ?string $sampaiTanggal = null): Collection
    {
        return $this->query($bahanBaku, null, $sampaiTanggal)
            ->with('titik')
            ->get()
            ->groupBy('titik_id')
            ->map(function ($mutasis, $titikId) {
                return [
                    'titik_id' => $titikId,
                    'titik' => $mutasis->first()->titik?->nama ?? '-',
                    'stok' => $mutasis->sum(fn ($m) => $m->tipe === 'masuk' ? $m->jumlah : -$m->jumlah),
                ];
            })
            ->values();
    }

    protected function query(BahanBaku $bahanBaku, ?string $titikId, ?string $sampaiTanggal)
    {
        $query = $bahanBaku->stokMutasis();

        if ($titikId) {
            $query->where('titik_id', $titikId);
        }

        if ($sampaiTanggal) {
            $query->whereDate('tanggal', '<=', $sampaiTanggal);
        }

        return $query;
    }
}