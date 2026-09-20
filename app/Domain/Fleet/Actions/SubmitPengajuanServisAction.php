<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Bagian 21.8 #1 — Ajuan servis oleh PIC/operator/driver (mobile & web).
 * Beri nomor otomatis dan default status `diajukan`.
 */
class SubmitPengajuanServisAction
{
    public function execute(User $user, array $data): PengajuanServisArmada
    {
        $kode = 'SVC-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));

        return PengajuanServisArmada::create([
            'kode_pengajuan' => $kode,
            'tanggal_ajuan' => $data['tanggal_ajuan'] ?? now()->toDateString(),
            'armada_id' => $data['armada_id'],
            'diajukan_oleh' => $user->id,
            'foto_armada' => $data['foto_armada'] ?? null,
            'catatan_ajuan' => $data['catatan_ajuan'] ?? null,
            'keluhan' => $data['keluhan'] ?? null,
            'kategori' => $data['kategori'] ?? null,
            'odometer_saat_ajuan' => isset($data['odometer_saat_ajuan']) ? (float) $data['odometer_saat_ajuan'] : null,
            'jam_operasional_saat_ajuan' => isset($data['jam_operasional_saat_ajuan']) ? (float) $data['jam_operasional_saat_ajuan'] : null,
            'status' => 'diajukan',
        ]);
    }
}
