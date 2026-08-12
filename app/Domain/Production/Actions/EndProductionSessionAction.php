<?php
namespace App\Domain\Production\Actions;
class EndProductionSessionAction
{
    public function execute(ProductionSession $session, array $data): ProductionSession
    {
        return DB::transaction(function () use ($session, $data) {
            $session->update([
                'selesai' => now(),
                'hasil_output' => $data['hasil_output'],
                'status' => 'selesai',
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Catat konsumsi bahan baku (dari resep atau manual)
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $session->items()->create([
                        'bahan_baku_id' => $item['bahan_baku_id'],
                        'jumlah_terpakai' => $item['jumlah_terpakai'],
                    ]);

                    // Kurangi stok (buat mutasi keluar)
                    \App\Domain\Procurement\Models\StokMutasi::create([
                        'bahan_baku_id' => $item['bahan_baku_id'],
                        'titik_id' => $session->titik_id,
                        'tipe' => 'keluar',
                        'jumlah' => $item['jumlah_terpakai'],
                        'referensi_type' => ProductionSession::class,
                        'referensi_id' => $session->id,
                        'catatan' => "Konsumsi produksi {$session->produk->nama}",
                        'tanggal' => now(),
                        'created_by' => auth()->id(),
                    ]);
                }
            } else {
                // Auto-suggest dari resep
                $resep = ResepProduksi::where('produk_id', $session->produk_id)->get();
                foreach ($resep as $r) {
                    $jumlah = $r->jumlah_per_unit_output * $data['hasil_output'];
                    $session->items()->create([
                        'bahan_baku_id' => $r->bahan_baku_id,
                        'jumlah_terpakai' => $jumlah,
                    ]);
                    // buat stok mutasi keluar
                }
            }

            return $session;
        });
    }
}
