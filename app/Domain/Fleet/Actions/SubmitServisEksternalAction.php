<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\ServisEksternalDetail;
use App\Domain\Fleet\Models\ServisEksternalNota;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * TD-B: Pengajuan servis eksternal dari mobile/web.
 * Unit langsung berstatus 'dikerjakan' (tidak menunggu approval workshop internal)
 * karena unit sudah/sedang di bengkel luar.
 */
class SubmitServisEksternalAction
{
    public function execute(User $user, array $data, ?UploadedFile $fotoBengkel = null, array $fotoNotas = []): PengajuanServisArmada
    {
        return DB::transaction(function () use ($user, $data, $fotoBengkel, $fotoNotas) {
            $kode = 'SRV-EKS-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));

            $fotoBengkelPath = null;
            if ($fotoBengkel) {
                $fotoBengkelPath = $fotoBengkel->store('servis_eksternal/bengkel/'.now()->format('Y/m'), 'public');
            }

            $pengajuan = PengajuanServisArmada::create([
                'kode_pengajuan' => $kode,
                'tanggal_ajuan' => now()->toDateString(),
                'armada_id' => $data['armada_id'],
                'tipe_servis' => 'eksternal',
                'diajukan_oleh' => $user->id,
                'catatan_ajuan' => $data['rincian_pekerjaan'] ?? ('Servis Eksternal: '.$data['nama_bengkel']),
                'keluhan' => $data['rincian_pekerjaan'] ?? null,
                'odometer_saat_ajuan' => isset($data['odometer_saat_ajuan']) ? (float) $data['odometer_saat_ajuan'] : null,
                'jam_operasional_saat_ajuan' => isset($data['jam_operasional_saat_ajuan']) ? (float) $data['jam_operasional_saat_ajuan'] : null,
                'status' => 'dikerjakan',
                'tanggal_mulai_kerja' => now()->toDateString(),
                'total_biaya' => isset($data['total_biaya_estimasi']) ? (float) $data['total_biaya_estimasi'] : 0,
            ]);

            ServisEksternalDetail::create([
                'pengajuan_id' => $pengajuan->id,
                'nama_bengkel' => $data['nama_bengkel'],
                'alamat_bengkel' => $data['alamat_bengkel'] ?? null,
                'latitude' => isset($data['latitude']) ? (float) $data['latitude'] : null,
                'longitude' => isset($data['longitude']) ? (float) $data['longitude'] : null,
                'foto_bengkel' => $fotoBengkelPath,
                'foto_bengkel_diambil_pada' => now(),
                'rincian_pekerjaan' => $data['rincian_pekerjaan'] ?? null,
                'total_biaya_estimasi' => isset($data['total_biaya_estimasi']) ? (float) $data['total_biaya_estimasi'] : 0,
                'verifikasi_workshop' => 'belum',
            ]);

            foreach ($fotoNotas as $notaFile) {
                if ($notaFile instanceof UploadedFile) {
                    $notaPath = $notaFile->store('servis_eksternal/nota/'.now()->format('Y/m'), 'public');
                    ServisEksternalNota::create([
                        'pengajuan_id' => $pengajuan->id,
                        'foto_nota' => $notaPath,
                        'diinput_oleh' => $user->id,
                        'tanggal_nota' => now()->toDateString(),
                    ]);
                }
            }

            return $pengajuan->load(['armada', 'eksternalDetail', 'eksternalNotas']);
        });
    }
}
