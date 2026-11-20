<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\HelperArmada;

class StoreHelperArmadaAction
{
    /**
     * Buat/update helper armada (Bagian 21.6). Ownership diarahkan ke
     * HelperArmadaPolicy (object-level: hanya creator / PIC aktif armada),
     * action ini murni handle persistensi + foto.
     */
    public function execute(array $data, ?HelperArmada $helper = null): HelperArmada
    {
        $payload = [
            'armada_id' => $data['armada_id'],
            'nama' => $data['nama'],
            'no_hp' => $data['no_hp'] ?? null,
            'foto' => $data['foto'] ?? $helper?->foto,
            'honor' => $data['honor'] ?? 0,
            'durasi_mulai' => $data['durasi_mulai'],
            'durasi_selesai' => $data['durasi_selesai'] ?? null,
            'status' => $data['status'] ?? 'aktif',
            'created_by' => $data['created_by'],
        ];

        if ($helper) {
            $helper->update($payload);

            return $helper;
        }

        return HelperArmada::create($payload);
    }
}