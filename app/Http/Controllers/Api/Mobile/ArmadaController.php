<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\Ritase;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Modul Armada untuk driver (portal proyek, role "Driver Armada").
 *
 * Endpoint di bawah mengambil data armada yang "diampu" user (via tabel
 * ArmadaDriver yang terhubung ke karyawan user), beserta ritase milik
 * driver tsb dan checklist harian armada.
 */
class ArmadaController extends Controller
{
    use ApiResponse;

    /**
     * Karyawan yang terhubung ke user saat ini, atau null.
     */
    private function currentKaryawan(Request $request)
    {
        return $request->user()?->karyawan;
    }

    /**
     * Armada yang aktif dipegang user (via ArmadaDriver aktif).
     */
    private function activeArmadas(Request $request)
    {
        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return collect();
        }

        return ArmadaDriver::with(['armada.unitBisnis', 'armada.titik'])
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->get()
            ->map(fn (ArmadaDriver $d) => $d->armada)
            ->filter();
    }

    /**
     * GET /api/mobile/armada/saya
     * Daftar kendaraan yang saat ini dipegang driver.
     */
    public function saya(Request $request)
    {
        $items = $this->activeArmadas($request)->values()->map(fn (Armada $a) => [
            'id' => $a->id,
            'plat_nomor' => $a->plat_nomor,
            'kode_unit' => $a->kode_unit,
            'jenis' => $a->jenis,
            'model_tarif' => $a->model_tarif,
            'tahun' => $a->tahun,
            'kapasitas' => $a->kapasitas,
            'status' => $a->status,
            'unit_bisnis' => $a->unitBisnis?->nama,
            'titik' => $a->titik ? [
                'id' => $a->titik->id,
                'nama' => $a->titik->nama,
            ] : null,
        ]);

        return $this->success(['items' => $items], 'Armada milik driver.');
    }

    /**
     * GET /api/mobile/armada/ritase?bulan=&tahun=&per_page=&page=
     * Riwayat ritase/pengiriman milik driver.
     */
    public function ritase(Request $request)
    {
        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->success(['items' => [], 'current_page' => 1, 'last_page' => 1, 'total' => 0]);
        }

        $validated = $request->validate([
            'bulan' => 'nullable|integer|between:1,12',
            'tahun' => 'nullable|integer|min:2000',
            'per_page' => 'nullable|integer|between:1,100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $validated['per_page'] ?? 15;

        $query = Ritase::with(['armada', 'ruteTarif', 'proyek', 'titik'])
            ->where('driver_karyawan_id', $karyawan->id)
            ->orderByDesc('tanggal');

        if (isset($validated['bulan']) && isset($validated['tahun'])) {
            $query->whereMonth('tanggal', $validated['bulan'])
                ->whereYear('tanggal', $validated['tahun']);
        }

        $page = $query->paginate($perPage);

        return $this->success([
            'items' => collect($page->items())->map(fn (Ritase $r) => [
                'id' => $r->id,
                'tanggal' => $r->tanggal?->toDateString(),
                'kategori' => $r->kategori,
                'material' => $r->material,
                'jumlah_rit' => $r->jumlah_rit,
                'tarif_per_rit_snapshot' => (float) $r->tarif_per_rit_snapshot,
                'total_upah_rit' => $r->totalUpahRit,
                'status' => $r->status,
                'catatan' => $r->catatan,
                'customer' => $r->customer,
                'armada_plat' => $r->armada?->plat_nomor,
                'rute' => $r->ruteTarif ? [
                    'id' => $r->ruteTarif->id,
                    'asal' => $r->ruteTarif->lokasi_asal,
                    'tujuan' => $r->ruteTarif->lokasi_tujuan,
                ] : null,
                'proyek' => $r->proyek?->nama,
                'titik' => $r->titik?->nama,
            ]),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'total' => $page->total(),
        ], 'Riwayat ritase driver.');
    }

    /**
     * GET /api/mobile/armada/checklist-hari-ini
     * Checklist harian untuk tiap armada yang dipegang driver hari ini.
     * Tiap item menyertakan status apakah sudah dicatat (sudah_isi).
     */
    public function checklistHariIni(Request $request)
    {
        $today = now()->toDateString();
        $armadas = $this->activeArmadas($request);

        $items = $armadas->map(function (Armada $a) use ($today) {
            $checklist = ArmadaChecklistHarian::where('checkable_type', Armada::class)
                ->where('checkable_id', $a->id)
                ->whereDate('tanggal', $today)
                ->first();

            return [
                'armada_id' => $a->id,
                'plat_nomor' => $a->plat_nomor,
                'kode_unit' => $a->kode_unit,
                'jenis' => $a->jenis,
                'tanggal' => $today,
                'sudah_isi' => $checklist !== null,
                'checklist_id' => $checklist?->id,
                'kondisi_baik' => $checklist?->kondisi_baik,
                'item_bermasalah' => $checklist?->item_bermasalah,
            ];
        })->values();

        return $this->success(['items' => $items], 'Checklist harian armada.');
    }

    /**
     * POST /api/mobile/armada/checklist
     * Mencatat (create/update) checklist satu armada untuk hari ini.
     * Natural idempotent: satu baris per (armada_id, tanggal) via updateOrCreate.
     */
    public function submitChecklist(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string|max:1000',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        // Pastikan armada benar-benar dipegang driver saat ini.
        $held = ArmadaDriver::where('armada_id', $validated['armada_id'])
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->exists();

        if (! $held) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        $today = now()->toDateString();

        $checklist = ArmadaChecklistHarian::updateOrCreate(
            [
                'checkable_type' => Armada::class,
                'checkable_id' => $validated['armada_id'],
                'tanggal' => $today,
            ],
            [
                'kondisi_baik' => (bool) $validated['kondisi_baik'],
                'item_bermasalah' => $validated['item_bermasalah'] ?? null,
                'dicatat_oleh_karyawan_id' => $karyawan->id,
            ]
        );

        return $this->success([
            'checklist_id' => $checklist->id,
            'armada_id' => $validated['armada_id'],
            'tanggal' => $today,
            'kondisi_baik' => $checklist->kondisi_baik,
            'item_bermasalah' => $checklist->item_bermasalah,
        ], 'Checklist harian tersimpan.');
    }
}
