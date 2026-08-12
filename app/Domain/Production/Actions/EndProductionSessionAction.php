<?php

namespace App\Domain\Production\Actions;

use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\ResepProduksi;
use Illuminate\Support\Facades\DB;

class EndProductionSessionAction
{
    public function execute(ProductionSession $session, array $data): ProductionSession
    {
        return DB::transaction(function () use ($session, $data) {
            $session->load(['produk', 'titik']);

            $session->update([
                'selesai' => now(),
                'hasil_output' => $data['hasil_output'],
                'status' => 'selesai',
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Siapkan baris konsumsi: override manual jika ada, auto-suggest dari resep jika tidak
            $items = $data['items'] ?? [];
            if (empty($items)) {
                $resep = ResepProduksi::where('produk_id', $session->produk_id)->get();
                foreach ($resep as $r) {
                    $items[] = [
                        'bahan_baku_id' => $r->bahan_baku_id,
                        'jumlah_terpakai' => round($r->jumlah_per_unit_output * $data['hasil_output'], 4),
                    ];
                }
            }

            $createdBy = auth()->id();
            foreach ($items as $item) {
                if (empty($item['bahan_baku_id']) || empty($item['jumlah_terpakai'])) {
                    continue;
                }

                $session->items()->create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'jumlah_terpakai' => $item['jumlah_terpakai'],
                ]);

                // Kurangi stok (mutasi keluar) — warning-first, bukan hard-block (Bagian 16 #2)
                StokMutasi::create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'titik_id' => $session->titik_id,
                    'tipe' => 'keluar',
                    'jumlah' => $item['jumlah_terpakai'],
                    'referensi_type' => ProductionSession::class,
                    'referensi_id' => $session->id,
                    'catatan' => "Konsumsi produksi: {$session->produk->nama}",
                    'tanggal' => $session->selesai->toDateString(),
                    'created_by' => $createdBy,
                ]);
            }

            return $session->load('items.bahanBaku');
        });
    }
}