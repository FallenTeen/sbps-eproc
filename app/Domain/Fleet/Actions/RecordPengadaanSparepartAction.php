<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\States\SparepartTersedia;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 21.8 #4 — Inventory mencatat pengadaan sparepart (nominal, foto nota).
 * Setiap item di-update nominal/tanggal/foto_nota; kalau semua item tersedia,
 * status pengajuan jadi `sparepart_tersedia` dan `total_biaya` diakumulasi.
 */
class RecordPengadaanSparepartAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, array $data): PengajuanServisArmada
    {
        DB::transaction(function () use ($pengajuan, $data) {
            $items = $data['items'] ?? [];

            foreach ($items as $item) {
                $sparepart = PengajuanServisSparepart::find($item['id'] ?? null);
                if (! $sparepart || $sparepart->pengajuan_servis_armada_id !== $pengajuan->id) {
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

            $pengajuan->update([
                'status_pengadaan_sparepart' => 'tersedia',
                'total_biaya' => $pengajuan->spareparts->sum('nominal'),
            ]);

            if (! $pengajuan->status->equals(SparepartTersedia::class)) {
                $pengajuan->status->transitionTo(SparepartTersedia::class);
            }
        });

        return $pengajuan->fresh();
    }
}
