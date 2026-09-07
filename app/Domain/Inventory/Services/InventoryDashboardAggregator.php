<?php

namespace App\Domain\Inventory\Services;

use App\Domain\Inventory\Models\StokOpname;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\StokMutasi;

/**
 * Widget ringkas untuk Dashboard Inventory (Bagian 21.7): nilai stok,
 * PO menunggu approval, item mendekati habis — semua dihitung on-the-fly.
 */
class InventoryDashboardAggregator
{
    public function getMetrics(): array
    {
        $bahanBakus = BahanBaku::where('aktif', true)->get();
        $totalItem = $bahanBakus->count();

        // Saldo total per bahan baku (1 query agregat, bukan per-item).
        $saldos = StokMutasi::query()
            ->selectRaw('bahan_baku_id, sum(case when tipe = "masuk" then jumlah else -jumlah end) as saldo')
            ->groupBy('bahan_baku_id')
            ->pluck('saldo', 'bahan_baku_id');

        // Harga beli terbaru yang aktif per bahan baku.
        $hargaTerbaru = $bahanBakus->mapWithKeys(function ($bahanBaku) {
            $harga = $bahanBaku->hargaBeli()
                ->where('berlaku_dari', '<=', now())
                ->where(function ($q) {
                    $q->whereNull('berlaku_sampai')->orWhere('berlaku_sampai', '>=', now());
                })
                ->orderBy('berlaku_dari', 'desc')
                ->first();

            return [$bahanBaku->id => $harga ? (float) $harga->harga : 0.0];
        });

        $nilaiStok = 0.0;
        $stokPerItem = [];
        foreach ($bahanBakus as $bahanBaku) {
            $saldo = (float) $saldos->get($bahanBaku->id, 0);
            $stokPerItem[] = [
                'id' => $bahanBaku->id,
                'kode' => $bahanBaku->kode,
                'nama' => $bahanBaku->nama,
                'satuan' => $bahanBaku->satuan,
                'kategori' => $bahanBaku->kategori,
                'saldo' => $saldo,
            ];
            $nilaiStok += $saldo * $hargaTerbaru[$bahanBaku->id];
        }

        asort($stokPerItem);

        $mendekatiHabis = collect($stokPerItem)
            ->filter(fn ($item) => $item['saldo'] <= 10)
            ->sortBy('saldo')
            ->take(8)
            ->values();

        $poPendingApproval = PurchaseOrder::whereIn('status', [
            'menunggu_approval_finance',
            'menunggu_approval_owner',
        ])->count();

        $opnameTerbaru = StokOpname::with(['bahanBaku', 'titik', 'dicatatOleh'])
            ->latest('tanggal')
            ->latest('created_at')
            ->take(6)
            ->get()
            ->map(function (StokOpname $o) {
                return [
                    'id' => $o->id,
                    'tanggal' => $o->tanggal->toDateString(),
                    'item' => $o->bahanBaku?->nama,
                    'titik' => $o->titik?->nama,
                    'saldo_sistem' => (float) $o->saldo_sistem,
                    'saldo_fisik' => (float) $o->saldo_fisik,
                    'selisih' => (float) $o->selisih,
                ];
            });

        $mutasiTerbaru = StokMutasi::with(['bahanBaku', 'titik'])
            ->latest('tanggal')
            ->latest('created_at')
            ->take(8)
            ->get()
            ->map(function (StokMutasi $m) {
                return [
                    'id' => $m->id,
                    'tanggal' => $m->tanggal->toDateString(),
                    'item' => $m->bahanBaku?->nama,
                    'titik' => $m->titik?->nama,
                    'tipe' => $m->tipe,
                    'jumlah' => (float) $m->jumlah,
                ];
            });

        return [
            'total_item' => $totalItem,
            'nilai_stok' => $nilaiStok,
            'po_pending_approval' => $poPendingApproval,
            'mendekati_habis' => $mendekatiHabis,
            'opname_terbaru' => $opnameTerbaru,
            'mutasi_terbaru' => $mutasiTerbaru,
        ];
    }
}