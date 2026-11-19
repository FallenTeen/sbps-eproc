<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Procurement\Actions\RecordStockMutationAction;
use App\Domain\Procurement\Models\StokMutasi;
use App\Models\User;

class RecordSparepartUsageAction
{
    public function execute(PengajuanServisSparepart $sparepart, User $user): void
    {
        if ($sparepart->status !== 'tersedia' || ! $sparepart->bahan_baku_id) {
            return;
        }

        $sparepart->loadMissing([
            'pengajuan.armada',
            'workshopTodo.armada',
            'workshopTodo.mesin',
        ]);

        $titikId = $sparepart->pengajuan?->armada?->titik_id
            ?? $sparepart->workshopTodo?->armada?->titik_id
            ?? $sparepart->workshopTodo?->mesin?->titik_id;

        if (! $titikId) {
            return;
        }

        $exists = StokMutasi::query()
            ->where('referensi_type', PengajuanServisSparepart::class)
            ->where('referensi_id', $sparepart->id)
            ->where('tipe', 'keluar')
            ->exists();

        if ($exists) {
            return;
        }

        app(RecordStockMutationAction::class)->record([
            'bahan_baku_id' => $sparepart->bahan_baku_id,
            'titik_id' => $titikId,
            'tipe' => 'keluar',
            'jumlah' => $sparepart->jumlah,
            'referensi_type' => PengajuanServisSparepart::class,
            'referensi_id' => $sparepart->id,
            'catatan' => "Pemakaian sparepart servis: {$sparepart->nama_item}",
            'tanggal' => $sparepart->tanggal?->toDateString() ?? now()->toDateString(),
            'created_by' => $user->id,
        ]);
    }
}
