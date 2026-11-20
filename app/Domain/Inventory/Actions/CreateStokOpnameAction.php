<?php

namespace App\Domain\Inventory\Actions;

use App\Domain\Inventory\Models\StokOpname;
use App\Domain\Procurement\Actions\GetStokSaldoAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Mencatat checklist inventarisasi (Bagian 21.7) secara massal: satu opname
 * mencakup banyak item di satu titik untuk satu tanggal. `saldo_sistem`
 * di-snapshot dari GetStokSaldoAction saat opname dibuat, `selisih` dihitung
 * (saldo_fisik - saldo_sistem) - tidak disimpan manual.
 */
class CreateStokOpnameAction
{
    public function execute(User $user, string $titikId, string $tanggal, array $items): array
    {
        $getSaldo = new GetStokSaldoAction;

        return DB::transaction(function () use ($user, $titikId, $tanggal, $items, $getSaldo) {
            $created = [];

            foreach ($items as $item) {
                $bahanBaku = BahanBaku::findOrFail($item['bahan_baku_id']);
                $saldoFisik = (float) ($item['saldo_fisik'] ?? 0);

                $saldoSistem = (float) $getSaldo->execute($bahanBaku, $titikId, $tanggal);

                $opname = StokOpname::query()
                    ->where('bahan_baku_id', $bahanBaku->id)
                    ->where('titik_id', $titikId)
                    ->whereDate('tanggal', $tanggal)
                    ->first();

                if (! $opname) {
                    $opname = new StokOpname([
                        'bahan_baku_id' => $bahanBaku->id,
                        'titik_id' => $titikId,
                        'tanggal' => $tanggal,
                    ]);
                }

                $opname->fill([
                    'saldo_sistem' => $saldoSistem,
                    'saldo_fisik' => $saldoFisik,
                    'selisih' => $saldoFisik - $saldoSistem,
                    'catatan' => $item['catatan'] ?? null,
                    'dicatat_oleh' => $user->id,
                ])->save();

                $created[] = $opname;
            }

            return $created;
        });
    }
}
