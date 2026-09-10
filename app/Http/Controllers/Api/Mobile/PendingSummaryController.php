<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Domain\Production\Models\ProductionSession;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PendingSummaryController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/me/pending-summary
     *
     * Counts server-side work that still needs attention for the active user.
     * Local outbox counts remain a separate client-side concern.
     */
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $role = $user->getRoleNames()->first();
        $today = now()->toDateString();

        $armada = [
            'checklist_belum' => 0,
            'servis_menunggu_approval' => 0,
        ];
        $produksi = ['sesi_menunggu_qc' => 0];
        $workshop = ['job_aktif' => 0];

        if ($user->hasAnyRole(['Driver Armada', 'Kepala Divisi Armada', 'Owner', 'Admin Keuangan'])) {
            $karyawanId = $user->karyawan?->id;
            if ($karyawanId) {
                $armadaIds = ArmadaDriver::where('karyawan_id', $karyawanId)
                    ->where('status', 'aktif')
                    ->pluck('armada_id');

                $filledChecklistIds = ArmadaChecklistHarian::whereDate('tanggal', $today)
                    ->where('checkable_type', Armada::class)
                    ->whereIn('checkable_id', $armadaIds)
                    ->pluck('checkable_id');

                $armada['checklist_belum'] = $armadaIds->diff($filledChecklistIds)->count();
            }

            $armada['servis_menunggu_approval'] = PengajuanServisArmada::query()
                ->where('diajukan_oleh', $user->id)
                ->where('status', 'diajukan')
                ->count();
        }

        if ($user->hasAnyRole(['Mandor Titik', 'Owner'])) {
            $produksi['sesi_menunggu_qc'] = ProductionSession::query()
                ->where('status', 'selesai')
                ->whereDoesntHave('qcSamples')
                ->whereHas('operator', fn ($query) => $query->where('user_id', $user->id))
                ->count();
        }

        if ($user->hasAnyRole(['Workshop', 'Owner'])) {
            $workshop['job_aktif'] = WorkshopTodo::query()
                ->where('status', '!=', 'selesai')
                ->when(! $user->hasRole('Owner'), fn ($query) => $query->where('assigned_to', $user->id))
                ->count();
        }

        return $this->success([
            'role' => $role,
            'armada' => $armada,
            'produksi' => $produksi,
            'workshop' => $workshop,
        ], 'Ringkasan pekerjaan yang menunggu.');
    }
}
