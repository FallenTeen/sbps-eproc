<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use Illuminate\Support\Facades\DB;

class ActivateCadanganPenanggungJawabAction
{
    /**
     * Non-aktifkan PIC utama sementara (bukan hapus), aktifkan cadangan sebagai PIC efektif
     * untuk periode tersebut. Semua checklist/servis/presensi helper yang dicatat cadangan
     * selama periode ini tetap terekam dengan karyawan_id cadangan yang benar.
     */
    public function execute(array $data): ArmadaPenanggungJawab
    {
        return DB::transaction(function () use ($data) {
            $armadaId = $data['armada_id'];
            $tanggal = $data['tanggal'] ?? now()->toDateString();
            $alasan = $data['alasan'] ?? 'PIC utama berhalangan';

            // Non-aktifkan PIC utama yang masih aktif
            ArmadaPenanggungJawab::where('armada_id', $armadaId)
                ->where('peran', 'utama')
                ->whereNull('sampai')
                ->update(['sampai' => $tanggal]);

            // Cari cadangan aktif; kalau tidak ada, buat baris cadangan baru untuk karyawan_id yang diberikan
            $cadangan = ArmadaPenanggungJawab::where('armada_id', $armadaId)
                ->where('peran', 'cadangan')
                ->whereNull('sampai')
                ->first();

            if (! $cadangan) {
                $karyawanId = $data['karyawan_id'] ?? abort(422, 'Karyawan cadangan wajib diisi');
                $cadangan = ArmadaPenanggungJawab::create([
                    'armada_id' => $armadaId,
                    'karyawan_id' => $karyawanId,
                    'peran' => 'cadangan',
                    'mulai_dari' => $tanggal,
                    'sampai' => null,
                    'alasan' => $alasan,
                    'created_by' => $data['created_by'] ?? null,
                ]);
            } else {
                // Cadangan yang sudah ada tetap aktif, hanya pastikan mulai_dari tidak melebihi tanggal
                if ($cadangan->mulai_dari > $tanggal) {
                    $cadangan->update(['mulai_dari' => $tanggal]);
                }
            }

            return $cadangan;
        });
    }
}
