<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\HelperArmada;
use App\Domain\Fleet\Models\PresensiHelper;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class RecordHelperPresensiAction
{
    /**
     * Catat presensi helper atas nama PIC (Bagian 21.6).
     *
     * Helper TIDAK punya akun — yang mencatat selalu PIC aktif armada.
     * Satu baris per (helper, tanggal); check-in & check-out saling update.
     *
     * @param  string  $tipe  'check_in' | 'check_out'
     *
     * @throws ValidationException kalau user bukan PIC aktif armada helper
     */
    public function execute(HelperArmada $helper, User $pic, array $data): PresensiHelper
    {
        if (! $helper->armada->isActivePicFor($pic->karyawan)) {
            throw ValidationException::withMessages([
                'helper_armada_id' => 'User bukan PIC aktif armada helper ini.',
            ]);
        }

        $tanggal = $data['tanggal'] ?? now()->toDateString();
        $tipe = $data['tipe'];

        $presensi = PresensiHelper::firstOrNew([
            'helper_armada_id' => $helper->id,
            'tanggal' => $tanggal,
        ]);

        if ($tipe === 'check_in') {
            if (! $presensi->check_in && ! $data['foto']) {
                throw ValidationException::withMessages([
                    'foto' => 'Foto check-in helper wajib diisi.',
                ]);
            }
            $presensi->check_in = $presensi->check_in ?? now();
            if (! $presensi->foto_check_in) {
                $presensi->foto_check_in = $data['foto'];
            }
        } else {
            if (! $data['foto']) {
                throw ValidationException::withMessages([
                    'foto' => 'Foto check-out helper wajib diisi.',
                ]);
            }
            $presensi->check_out = now();
            $presensi->foto_check_out = $data['foto'];
        }

        $presensi->dicatat_oleh = $pic->id;
        $presensi->save();

        return $presensi;
    }
}