<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Actions\SubmitPengajuanServisAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * v6 (21.8) — Sistem Servis Armada (mobile).
 *
 * Bagian 1 (ajuan) bisa diajukan dari mobile oleh PIC/operator/driver melalui
 * armada yang sedang diampu. Status & riwayat bisa dilihat semua.
 */
class PengajuanServisController extends Controller
{
    use ApiResponse;

    private function activeArmadaIds(Request $request): array
    {
        $karyawan = $request->user()?->karyawan;
        if (! $karyawan) {
            return [];
        }

        return ArmadaPenanggungJawab::where('karyawan_id', $karyawan->id)
            ->whereNull('sampai')
            ->pluck('armada_id')
            ->all();
    }

    /**
     * GET /api/mobile/servis-armada/saya
     * Servis yang diampu user (diajukannya sendiri atau armada yang di-PIC-kan).
     */
    public function saya(Request $request)
    {
        $ids = $this->activeArmadaIds($request);

        $servis = PengajuanServisArmada::with(['armada'])
            ->where('diajukan_oleh', $request->user()->id)
            ->orWhereIn('armada_id', $ids)
            ->latest('tanggal_ajuan')
            ->latest('created_at')
            ->get();

        return $this->success($servis, 'Daftar servis armada.');
    }

    /**
     * POST /api/mobile/servis-armada
     * Ajukan servis (bagian 1).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|exists:armadas,id',
            'tanggal_ajuan' => 'nullable|date',
            'catatan_ajuan' => 'nullable|string|max:2000',
        ]);

        $pengajuan = app(SubmitPengajuanServisAction::class)->execute($request->user(), $validated);

        return $this->success($pengajuan->load('armada'), 'Ajuan servis armada dibuat.', 201);
    }

    /**
     * GET /api/mobile/servis-armada/{id}
     */
    public function show(Request $request, $id)
    {
        $pengajuan = PengajuanServisArmada::with(['armada', 'diajukanOleh', 'disetujuiOleh', 'personels', 'spareparts'])
            ->findOrFail($id);

        return $this->success($pengajuan, 'Detail servis armada.');
    }
}
