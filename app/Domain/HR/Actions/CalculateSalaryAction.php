<?php

namespace App\Domain\HR\Actions;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Services\LemburService;
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

        if (in_array($karyawan->tipe, ['harian', 'tetap'], true)) {
            $this->syncLembur($periode, $karyawan, $bulan, $tahun);
        }

        return $periode;
    }

    /**
     * Komponen `lembur` per TANGGAL presensi (BK-10).
     *
     * - Baris sudah ada & diedit_manual => dibiarkan utuh.
     * - Baris sudah ada (auto)          => jumlah = tarif snapshot TERSIMPAN x jam terkini.
     *   (tarif snapshot TIDAK diikuti saran terbaru - reset hanya via
     *    tombol "Hitung ulang otomatis".)
     * - Tanggal baru ditambahkan (tarif = saran saat ini).
     * - Tanggal yang presensisinya sudah tidak valid => baris auto dihapus.
     * - Tombol "Hitung ulang otomatis" di UI payroll: hapus semua baris
     *   lembur periode lalu panggil ulang method ini.
     */
    public function syncLembur(GajiPeriode $periode, Karyawan $karyawan, int $bulan, int $tahun): void
    {
        $lemburExist = $periode->komponen()
            ->where('jenis', 'lembur')
            ->orderBy('lembur_tanggal')
            ->get()
            ->keyBy(fn ($k) => $k->lembur_tanggal?->toDateString());

        $hitung = (new LemburService)->lemburPerTanggal($karyawan->id, $bulan, $tahun);

        foreach ($hitung as $tanggal => $data) {
            $existing = $lemburExist->get($tanggal);

            if ($existing) {
                if (! $existing->diedit_manual) {
                    $menit = (int) $data['menit'];
                    [$j, $m] = [intdiv($menit, 60), $menit % 60];
                    $existing->update([
                        'lembur_jam_menit' => $menit,
                        'jumlah' => round($menit / 60 * (float) $existing->lembur_tarif_jam, 2),
                        'keterangan' => "Lembur {$tanggal}: {$j}j {$m}m x Rp "
                            . number_format((float) $existing->lembur_tarif_jam, 0, ',', '.'),
                    ]);
                }

                continue;
            }

            $tarifSaran = (new LemburService)->tarifSaran($karyawan);
            $menit = (int) $data['menit'];
            [$j, $m] = [intdiv($menit, 60), $menit % 60];

            $periode->komponen()->create([
                'jenis' => 'lembur',
                'jumlah' => round($menit / 60 * $tarifSaran, 2),
                'keterangan' => "Lembur {$tanggal}: {$j}j {$m}m x Rp "
                    . number_format($tarifSaran, 0, ',', '.'),
                'lembur_tanggal' => $tanggal,
                'lembur_jam_menit' => $menit,
                'lembur_tarif_jam' => $tarifSaran,
                'diedit_manual' => false,
            ]);
        }

        // Hapus baris auto milik tanggal yang tidak lagi punya presensi valid.
        $lemburExist
            ->filter(fn ($k) => ! $k->diedit_manual)
            ->each(function ($k) use ($hitung) {
                if (! $hitung->has($k->lembur_tanggal?->toDateString())) {
                    $k->delete();
                }
            });
    }
}
