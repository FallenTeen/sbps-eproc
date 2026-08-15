<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Production\Actions\EndProductionSessionAction;
use App\Domain\Production\Actions\StartProductionSessionAction;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ProduksiController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/produksi/mulai
     */
    public function mulai(Request $request)
    {
        $karyawan = $this->resolveOperator($request);

        $validated = $request->validate([
            'mesin_id' => 'required|exists:mesin_produksis,id',
            'produk_id' => 'required|exists:produks,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'catatan' => 'nullable|string|max:2000',
        ]);

        $mesin = MesinProduksi::findOrFail($validated['mesin_id']);

        $session = (new StartProductionSessionAction())->execute([
            'mesin_id' => $mesin->id,
            'titik_id' => $validated['titik_id'] ?? $mesin->titik_id,
            'produk_id' => $validated['produk_id'],
            'operator_karyawan_id' => $karyawan->id,
            'catatan' => $validated['catatan'] ?? null,
        ]);

        return $this->success($this->sessionPayload($session), 'Sesi produksi dimulai.', 201);
    }

    /**
     * POST /api/mobile/produksi/selesai/{sessionId}
     */
    public function selesai(Request $request, string $sessionId)
    {
        $karyawan = $this->resolveOperator($request);

        $session = ProductionSession::findOrFail($sessionId);

        if ($session->operator_karyawan_id !== $karyawan->id) {
            return $this->error('Sesi produksi bukan milik Anda.', 403);
        }

        if ($session->status !== 'berjalan') {
            return $this->error('Sesi produksi tidak sedang berjalan.', 422);
        }

        $validated = $request->validate([
            'hasil_output' => 'required|numeric|min:0',
            'catatan' => 'nullable|string|max:2000',
            'items' => 'nullable|array',
            'items.*.bahan_baku_id' => 'required_with:items|exists:bahan_bakus,id',
            'items.*.jumlah_terpakai' => 'required_with:items|numeric|min:0',
        ]);

        $session = (new EndProductionSessionAction())->execute($session, [
            'hasil_output' => $validated['hasil_output'],
            'catatan' => $validated['catatan'] ?? null,
            'items' => $validated['items'] ?? [],
        ]);

        return $this->success($this->sessionPayload($session), 'Sesi produksi selesai.');
    }

    /**
     * GET /api/mobile/produksi/sesi-aktif
     */
    public function sesiAktif(Request $request)
    {
        $karyawan = $this->resolveOperator($request);

        $sessions = ProductionSession::with(['mesin', 'produk', 'titik'])
            ->where('operator_karyawan_id', $karyawan->id)
            ->berjalan()
            ->latest('mulai')
            ->get()
            ->map(fn (ProductionSession $s) => $this->sessionPayload($s));

        return $this->success($sessions, 'Sesi produksi aktif.');
    }

    /**
     * GET /api/mobile/produksi/riwayat?tanggal=&mesin_id=
     */
    public function riwayat(Request $request)
    {
        $karyawan = $this->resolveOperator($request);

        $validated = $request->validate([
            'tanggal' => 'nullable|date',
            'mesin_id' => 'nullable|exists:mesin_produksis,id',
        ]);

        $query = ProductionSession::with(['mesin', 'produk', 'titik'])
            ->where('operator_karyawan_id', $karyawan->id)
            ->latest('mulai');

        if (!empty($validated['tanggal'])) {
            $query->whereDate('mulai', $validated['tanggal']);
        }

        if (!empty($validated['mesin_id'])) {
            $query->where('mesin_id', $validated['mesin_id']);
        }

        $sessions = $query->paginate(20);

        return $this->success([
            'items' => $sessions->getCollection()->map(fn (ProductionSession $s) => $this->sessionPayload($s)),
            'pagination' => [
                'total' => $sessions->total(),
                'per_page' => $sessions->perPage(),
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
            ],
        ], 'Riwayat sesi produksi.');
    }

    /**
     * GET /api/mobile/produksi/titik-progress
     */
    public function titikProgress(Request $request)
    {
        $sessions = ProductionSession::with('titik')
            ->where('status', 'selesai')
            ->whereDate('mulai', now()->toDateString())
            ->get();

        $grouped = $sessions->groupBy('titik_id');

        $items = $grouped
            ->map(function ($rows, $titikId) {
                $titik = $rows->first()->titik;

                return [
                    'titik_id' => $titikId,
                    'titik' => $titik?->nama,
                    'total_output' => (float) $rows->sum('hasil_output'),
                    'jumlah_sesi' => $rows->count(),
                ];
            })
            ->values();

        return $this->success([
            'tanggal' => now()->toDateString(),
            'items' => $items,
        ], 'Progress produksi per titik hari ini.');
    }

    private function resolveOperator(Request $request)
    {
        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            throw ValidationException::withMessages([
                'karyawan' => 'Akun Anda belum terhubung ke data karyawan.',
            ]);
        }

        return $karyawan;
    }

    private function sessionPayload(ProductionSession $session): array
    {
        return [
            'id' => $session->id,
            'mesin' => $session->mesin ? [
                'id' => $session->mesin->id,
                'nama' => $session->mesin->nama,
            ] : null,
            'produk' => $session->produk ? [
                'id' => $session->produk->id,
                'nama' => $session->produk->nama,
                'satuan_output' => $session->produk->satuan_output,
            ] : null,
            'titik' => $session->titik ? [
                'id' => $session->titik->id,
                'nama' => $session->titik->nama,
            ] : null,
            'mulai' => $session->mulai?->toIso8601String(),
            'selesai' => $session->selesai?->toIso8601String(),
            'hasil_output' => (float) $session->hasil_output,
            'status' => $session->status,
            'catatan' => $session->catatan,
        ];
    }
}
