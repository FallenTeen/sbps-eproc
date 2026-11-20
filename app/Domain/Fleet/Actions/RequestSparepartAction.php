<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Domain\Fleet\States\Dikerjakan;
use App\Domain\Fleet\States\MenungguSparepart;
use App\Domain\Procurement\Actions\ResolveSparepartBahanBakuAction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Bagian 21.8 #3→#4 & 21.9 #2 - Workshop ajukan sparepart ke Inventory.
 * Satu action, dua sumber pemicu (jangan duplikasi logic):
 *  - pengajuan servis insidental (21.8) → menandai pengajuan, status `menunggu_sparepart`
 *  - workshop todo rutin (21.9) → item sparepart dicatat lewat `workshop_todo_id`
 * Item disimpan dengan status `diajukan`.
 */
class RequestSparepartAction
{
    public function execute(
        User $user,
        array $items,
        ?PengajuanServisArmada $pengajuan = null,
        ?WorkshopTodo $workshopTodo = null,
    ): PengajuanServisArmada|WorkshopTodo {
        if (! $pengajuan && ! $workshopTodo) {
            throw ValidationException::withMessages([
                'sumber' => 'Sumber permintaan sparepart (pengajuan servis atau to-do workshop) wajib diisi.',
            ]);
        }

        $context = $workshopTodo?->mesin_id ? 'mesin' : 'armada';
        $resolver = app(ResolveSparepartBahanBakuAction::class);

        DB::transaction(function () use ($pengajuan, $workshopTodo, $items, $context, $resolver) {
            if ($pengajuan) {
                $pengajuan->update([
                    'butuh_sparepart' => true,
                    'status_pengadaan_sparepart' => 'diajukan',
                ]);
            }

            foreach ($items as $item) {
                $resolved = $resolver->execute($item, $context);

                if (! $resolved || empty($resolved['nama_item'])) {
                    continue;
                }
                PengajuanServisSparepart::create([
                    'pengajuan_servis_armada_id' => $pengajuan?->id,
                    'workshop_todo_id' => $workshopTodo?->id,
                    'bahan_baku_id' => $resolved['bahan_baku_id'],
                    'nama_item' => $resolved['nama_item'],
                    'jumlah' => $resolved['jumlah'],
                    'satuan' => $resolved['satuan'],
                    'nominal' => $resolved['nominal'],
                    'tanggal' => $resolved['tanggal'] ?? now()->toDateString(),
                    'catatan' => $resolved['catatan'],
                    'status' => 'diajukan',
                ]);
            }

            if ($pengajuan && $pengajuan->status->equals(Dikerjakan::class)) {
                $pengajuan->status->transitionTo(MenungguSparepart::class);
            }
        });

        return ($pengajuan ?? $workshopTodo)->fresh();
    }
}