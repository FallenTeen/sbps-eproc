<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Titik;
use App\Domain\Production\Models\ProductionSession;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/dashboard/overview
     */
    public function overview(Request $request)
    {
        $today = now()->toDateString();

        $titiks = Titik::aktif()
            ->with('proyek:id,nama')
            ->withCount([
                'armadas as armada_count',
                'karyawanAssignments as sdm_count',
            ])
            ->orderBy('nama')
            ->get()
            ->map(function (Titik $titik) use ($today) {
                $produksiToday = (float) ProductionSession::where('titik_id', $titik->id)
                    ->where('status', 'selesai')
                    ->whereDate('mulai', $today)
                    ->sum('hasil_output');

                $presensiToday = Presensi::where('titik_id', $titik->id)
                    ->whereDate('check_in', $today)
                    ->count();

                return [
                    'titik_id' => $titik->id,
                    'titik' => $titik->nama,
                    'proyek' => $titik->proyek?->nama,
                    'latitude' => (float) $titik->latitude,
                    'longitude' => (float) $titik->longitude,
                    'sdm_count' => (int) $titik->sdm_count,
                    'armada_count' => (int) $titik->armada_count,
                    'presensi_today' => $presensiToday,
                    'produksi_today' => $produksiToday,
                ];
            });

        return $this->success([
            'tanggal' => $today,
            'total_titik' => $titiks->count(),
            'items' => $titiks,
        ], 'Ringkasan dashboard mobile.');
    }

    /**
     * GET /api/mobile/dashboard/titik/{titikId}
     */
    public function titik(Request $request, string $titikId)
    {
        $titik = Titik::with([
            'proyek:id,nama',
            'armadas',
            'karyawanAssignments.karyawan',
            'rab',
        ])->findOrFail($titikId);

        $today = now()->toDateString();

        $sessionsToday = ProductionSession::with('produk')
            ->where('titik_id', $titik->id)
            ->whereDate('mulai', $today)
            ->get();

        $presensiToday = Presensi::with('karyawan')
            ->where('titik_id', $titik->id)
            ->whereDate('check_in', $today)
            ->get();

        $totalRencana = 0;
        $totalRealisasi = 0;
        $getRabAction = new GetRABRealisasiAction();

        foreach ($titik->rab as $rab) {
            $totalRencana += (float) $rab->rencana;
            $totalRealisasi += (float) $getRabAction->execute($rab);
        }

        return $this->success([
            'titik' => [
                'id' => $titik->id,
                'nama' => $titik->nama,
                'proyek' => $titik->proyek?->nama,
                'latitude' => (float) $titik->latitude,
                'longitude' => (float) $titik->longitude,
                'status' => $titik->status,
            ],
            'sdm' => $titik->karyawanAssignments->map(fn ($a) => [
                'id' => $a->karyawan_id,
                'nama' => $a->karyawan?->nama,
                'jabatan' => $a->karyawan?->jabatan,
            ]),
            'armada' => $titik->armadas->map(fn ($a) => [
                'id' => $a->id,
                'kode_unit' => $a->kode_unit,
                'plat_nomor' => $a->plat_nomor,
                'jenis' => $a->jenis,
                'status' => $a->status,
            ]),
            'produksi_hari_ini' => [
                'total_output' => (float) $sessionsToday->where('status', 'selesai')->sum('hasil_output'),
                'jumlah_sesi' => $sessionsToday->count(),
            ],
            'presensi_hari_ini' => $presensiToday->map(fn ($p) => [
                'nama' => $p->karyawan?->nama,
                'check_in' => $p->check_in?->toIso8601String(),
                'check_out' => $p->check_out?->toIso8601String(),
            ]),
            'rab' => [
                'total_rencana' => $totalRencana,
                'total_realisasi' => $totalRealisasi,
                'persentase' => $totalRencana > 0 ? round(($totalRealisasi / $totalRencana) * 100, 1) : 0,
            ],
        ], 'Detail titik.');
    }
}
