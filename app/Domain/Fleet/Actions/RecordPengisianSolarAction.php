<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPengisianSolar;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Catat pengisian solar dan sinkronkan 1 baris `bbm_logs` (tanpa approval).
 * Path foto sudah tersimpan (relatif disk `public`); pengunggahan file di controller.
 */
class RecordPengisianSolarAction
{
    public function execute(Armada $armada, array $data): ArmadaPengisianSolar
    {
        if (empty($data['client_uuid'])) {
            throw ValidationException::withMessages(['client_uuid' => 'client_uuid wajib diisi.']);
        }

        if ($existing = ArmadaPengisianSolar::where('client_uuid', $data['client_uuid'])->first()) {
            return $existing;
        }

        return DB::transaction(function () use ($armada, $data) {
            $pengisian = $this->persist($armada, $data, new ArmadaPengisianSolar);

            $bbm = $armada->bbmLogs()->create([
                'tanggal' => $pengisian->tanggal,
                'liter' => $pengisian->liter,
                'biaya' => $pengisian->nominal_rp,
                'jam_operasional_saat_isi' => $armada->tipe_unit === 'alat_berat' ? $pengisian->odo_atau_hm : null,
                'dicatat_oleh' => $data['dicatat_oleh'] ?? auth()->id(),
            ]);

            $pengisian->update(['bbm_log_id' => $bbm->id]);

            return $pengisian;
        });
    }

    public function update(ArmadaPengisianSolar $pengisian, array $data): ArmadaPengisianSolar
    {
        return DB::transaction(function () use ($pengisian, $data) {
            $this->persist($pengisian->armada, $data, $pengisian);

            if ($pengisian->bbmLog) {
                $pengisian->bbmLog->update([
                    'tanggal' => $pengisian->tanggal,
                    'liter' => $pengisian->liter,
                    'biaya' => $pengisian->nominal_rp,
                ]);
            }

            return $pengisian;
        });
    }

    public function delete(ArmadaPengisianSolar $pengisian): void
    {
        DB::transaction(function () use ($pengisian) {
            $pengisian->bbmLog?->delete();
            $pengisian->delete();
        });
    }

    private function persist(Armada $armada, array $data, ArmadaPengisianSolar $pengisian): ArmadaPengisianSolar
    {
        $liter = (float) ($data['liter'] ?? $pengisian->liter);
        $nominal = (float) ($data['nominal_rp'] ?? $pengisian->nominal_rp);
        $tanggal = $data['tanggal'] ?? $pengisian->tanggal?->toDateString() ?? now()->toDateString();
        $awal = $armada->checklists()->whereDate('tanggal', $tanggal)->first();

        $pengisian->fill([
            'armada_id' => $armada->id,
            'checklist_awal_id' => $awal?->id,
            'karyawan_id' => $data['karyawan_id'] ?? $pengisian->karyawan_id,
            'dicatat_oleh' => $data['dicatat_oleh'] ?? $pengisian->dicatat_oleh ?? auth()->id(),
            'tanggal' => $tanggal,
            'waktu' => $data['waktu'] ?? $pengisian->waktu ?? now()->format('H:i:s'),
            'odo_atau_hm' => $data['odo_atau_hm'] ?? $pengisian->odo_atau_hm,
            'foto_odo' => $data['foto_odo'] ?? $pengisian->foto_odo,
            'foto_odo_metadata' => $data['foto_odo_metadata'] ?? $pengisian->foto_odo_metadata,
            'liter' => $liter,
            'nominal_rp' => $nominal,
            'harga_per_liter' => $liter > 0 ? round($nominal / $liter, 2) : 0,
            'foto_nota' => $data['foto_nota'] ?? $pengisian->foto_nota,
            'foto_nota_metadata' => $data['foto_nota_metadata'] ?? $pengisian->foto_nota_metadata,
            'catatan' => $data['catatan'] ?? $pengisian->catatan,
            'client_uuid' => $data['client_uuid'] ?? $pengisian->client_uuid,
        ]);

        $pengisian->save();

        return $pengisian;
    }
}
