<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 21.9 #2 — Inventory mencatat pengadaan sparepart yang lahir dari
 * to-do servis rutin (`workshop_todo_id`). Pengadaan dari pengajuan insidental
 * tetap lewat `RecordPengadaanSparepartAction` (21.8, bagian 4).
 */
class RecordTodoSparepartAction
{
    public function execute(User $user, array $data): void
    {
        DB::transaction(function () use ($data) {
            foreach ($data['items'] as $item) {
                $sparepart = PengajuanServisSparepart::find($item['id'] ?? null);
                if (! $sparepart || ! $sparepart->workshop_todo_id) {
                    continue;
                }

                $sparepart->update([
                    'nominal' => $item['nominal'] ?? $sparepart->nominal,
                    'jumlah' => $item['jumlah'] ?? $sparepart->jumlah,
                    'tanggal' => $item['tanggal'] ?? $sparepart->tanggal ?? now()->toDateString(),
                    'foto_nota' => $item['foto_nota'] ?? $sparepart->foto_nota,
                    'status' => 'tersedia',
                    'catatan' => $item['catatan'] ?? $sparepart->catatan,
                ]);
            }
        });
    }
}