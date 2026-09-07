<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisPersonel;
use App\Domain\Fleet\States\Dikerjakan;
use App\Domain\Fleet\States\MenungguSparepart;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 21.8 #3 — Workshop mulai kerjakan (assign personel, catat pengerjaan).
 * Kalau `butuh_sparepart = true`, lanjut ke status `menunggu_sparepart`.
 */
class AssignWorkshopPengerjaanAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, array $data): PengajuanServisArmada
    {
        DB::transaction(function () use ($pengajuan, $data) {
            $pengajuan->update([
                'tanggal_mulai_kerja' => $data['tanggal_mulai_kerja'] ?? now()->toDateString(),
                'tanggal_selesai_kerja' => $data['tanggal_selesai_kerja'] ?? null,
                'catatan_pengerjaan' => $data['catatan_pengerjaan'] ?? null,
                'butuh_sparepart' => $data['butuh_sparepart'] ?? false,
            ]);

            // Personel pengerja (multi) — replace
            $pengajuan->personels()->delete();
            $personels = $data['personels'] ?? [];
            foreach (array_filter($personels, fn ($p) => ! empty($p['nama_personel'])) as $p) {
                PengajuanServisPersonel::create([
                    'pengajuan_servis_armada_id' => $pengajuan->id,
                    'nama_personel' => $p['nama_personel'],
                    'peran' => $p['peran'] ?? null,
                ]);
            }

            // Transisi: disetujui -> dikerjakan
            if ($pengajuan->status->equals(Dikerjakan::class) === false) {
                $pengajuan->status->transitionTo(Dikerjakan::class);
            }

            // Kalau butuh sparepart -> menunggu_sparepart
            if (! empty($data['butuh_sparepart'])) {
                $pengajuan->update(['status_pengadaan_sparepart' => 'diajukan']);
                $pengajuan->status->transitionTo(MenungguSparepart::class);
            }
        });

        return $pengajuan->fresh();
    }
}
