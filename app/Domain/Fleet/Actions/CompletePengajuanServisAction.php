<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\States\Selesai;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 21.8 — Selesaikan servis. Menutup status jadi `selesai` dan
 * otomatis membuat baris `service_history` (reuse RecordServiceHistoryAction,
 * satu-satunya sumber realisasi RAB kategori `sparepart` — Keputusan #1, Bag. 16).
 */
class CompletePengajuanServisAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, array $data = []): PengajuanServisArmada
    {
        DB::transaction(function () use ($pengajuan, $data) {
            $pengajuan->update([
                'tanggal_selesai_kerja' => $data['tanggal_selesai_kerja'] ?? now()->toDateString(),
                'catatan_pengerjaan' => $data['catatan_pengerjaan'] ?? $pengajuan->catatan_pengerjaan,
                'tanggal_selesai' => now()->toDateString(),
                'total_biaya' => $data['total_biaya'] ?? $pengajuan->total_biaya ?: $pengajuan->spareparts->sum('nominal'),
            ]);

            // Generate service_history sebagai catatan final.
            app(RecordServiceHistoryAction::class)->execute($pengajuan->armada, [
                'tanggal' => now()->toDateString(),
                'jenis_servis' => $pengajuan->catatan_ajuan ?? 'servis armada',
                'biaya' => $pengajuan->total_biaya,
                'notes' => 'Servis armada ('.$pengajuan->kode_pengajuan.').',
            ]);

            $pengajuan->status->transitionTo(Selesai::class);
        });

        return $pengajuan->fresh();
    }
}
