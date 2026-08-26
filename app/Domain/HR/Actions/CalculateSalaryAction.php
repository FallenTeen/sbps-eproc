<?php

namespace App\Domain\HR\Actions;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\HR\Models\Karyawan;

class CalculateSalaryAction
{
    public function execute(Karyawan $karyawan, int $bulan, int $tahun): GajiPeriode
    {
        $periode = GajiPeriode::firstOrCreate([
            'karyawan_id' => $karyawan->id,
            'periode_bulan' => $bulan,
            'periode_tahun' => $tahun,
        ], ['status' => 'draft']);

        // Hapus komponen lama jika ada (biar refresh)
        $periode->komponen()->delete();

        $komponen = [];

        if ($karyawan->tipe === 'tetap') {
            $komponen[] = [
                'jenis' => 'gaji_pokok',
                'jumlah' => $karyawan->rate_gaji_pokok ?? 0,
                'keterangan' => 'Gaji pokok tetap',
            ];
        } elseif ($karyawan->tipe === 'harian') {
            $hadir = Presensi::where('karyawan_id', $karyawan->id)
                ->whereMonth('check_in', $bulan)
                ->whereYear('check_in', $tahun)
                ->where('status_validasi', 'valid')
                ->count();
            $periode->jumlah_hadir = $hadir;
            $periode->save();

            $komponen[] = [
                'jenis' => 'gaji_pokok',
                'jumlah' => $hadir * ($karyawan->rate_harian ?? 0),
                'keterangan' => "Gaji harian x {$hadir} hari",
            ];
        } elseif ($karyawan->tipe === 'borongan_rit') {
            // Ambil semua ritase yang disetujui untuk driver ini di periode
            $ritases = Ritase::where('driver_karyawan_id', $karyawan->id)
                ->whereYear('tanggal', $tahun)
                ->whereMonth('tanggal', $bulan)
                ->where('status', 'disetujui')
                ->get();

            $totalUpah = $ritases->sum('total_upah_rit');
            $komponen[] = [
                'jenis' => 'gaji_pokok',
                'jumlah' => $totalUpah,
                'keterangan' => "Akumulasi ritase ({$ritases->count()} rit)",
            ];

            // Tambahkan biaya lain dari ritase sebagai tunjangan
            foreach ($ritases as $rit) {
                foreach ($rit->biayaLain as $bl) {
                    $komponen[] = [
                        'jenis' => 'tunjangan',
                        'jumlah' => $bl->jumlah,
                        'keterangan' => "Biaya {$bl->jenis} rit {$rit->id}",
                    ];
                }
            }
        }

        foreach ($komponen as $k) {
            $periode->komponen()->create($k);
        }

        return $periode;
    }
}
