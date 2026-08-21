<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Production\Actions\RecordQCSampleAction;
use App\Domain\Production\Actions\RecordUjiTekanResultAction;
use App\Domain\Production\Models\QCSample;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MobileQcController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/qc/slump-test
     */
    public function storeSlumpTest(Request $request)
    {
        $validated = $request->validate([
            'production_session_id' => 'required|string|exists:production_sessions,id',
            'nilai_slump' => 'required|numeric|min:0',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $action = new RecordQCSampleAction;
        $sample = $action->execute([
            'production_session_id' => $validated['production_session_id'],
            'jenis_uji' => 'slump_test',
            'nilai_slump' => $validated['nilai_slump'],
            'catatan' => $validated['catatan'] ?? null,
        ]);

        $sample->load('session.produk', 'session.mesin');

        return $this->success([
            'id' => $sample->id,
            'jenis_uji' => $sample->jenis_uji,
            'nilai_slump' => $sample->nilai_slump,
            'status' => $sample->status,
            'catatan' => $sample->catatan,
            'produksi' => [
                'session_id' => $sample->session->id,
                'produk' => $sample->session->produk?->nama,
                'mesin' => $sample->session->mesin?->nama,
            ],
        ], 'Slump test berhasil dicatat.', 201);
    }

    /**
     * POST /api/mobile/qc/uji-tekan
     */
    public function storeUjiTekan(Request $request)
    {
        $validated = $request->validate([
            'production_session_id' => 'required|string|exists:production_sessions,id',
            'hasil_uji_tekan' => 'required|numeric|min:0',
            'target_mpa' => 'nullable|numeric|min:0',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $sample = QCSample::where('production_session_id', $validated['production_session_id'])
            ->where('jenis_uji', 'slump_test')
            ->where('status', 'menunggu_hasil')
            ->latest()
            ->first();

        if (! $sample) {
            return $this->error('Tidak ada sample slump test yang menunggu hasil uji tekan untuk sesi ini.', 422);
        }

        $action = new RecordUjiTekanResultAction;
        $sample = $action->execute(
            $sample,
            $validated['hasil_uji_tekan'],
            $validated['catatan'] ?? null,
            $validated['target_mpa'] ?? null
        );

        $sample->load('session.produk', 'session.mesin');

        return $this->success([
            'id' => $sample->id,
            'jenis_uji' => $sample->jenis_uji,
            'nilai_slump' => $sample->nilai_slump,
            'hasil_uji_tekan' => $sample->hasil_uji_tekan,
            'status' => $sample->status,
            'catatan' => $sample->catatan,
            'produksi' => [
                'session_id' => $sample->session->id,
                'produk' => $sample->session->produk?->nama,
                'mesin' => $sample->session->mesin?->nama,
            ],
        ], 'Hasil uji tekan berhasil dicatat.');
    }

    /**
     * GET /api/mobile/qc/riwayat
     */
    public function riwayat(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:menunggu_hasil,lolos,tidak_lolos',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = QCSample::with('session.produk', 'session.mesin', 'session.titik');

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $samples = $query->latest('created_at')
            ->paginate($validated['per_page'] ?? 20);

        return $this->success([
            'items' => $samples->items(),
            'pagination' => [
                'current_page' => $samples->currentPage(),
                'last_page' => $samples->lastPage(),
                'per_page' => $samples->perPage(),
                'total' => $samples->total(),
            ],
        ], 'Riwayat QC.');
    }

    /**
     * GET /api/mobile/qc/{id}
     */
    public function show(string $id)
    {
        $sample = QCSample::with('session.produk', 'session.mesin', 'session.titik', 'session.operator')
            ->findOrFail($id);

        return $this->success([
            'id' => $sample->id,
            'jenis_uji' => $sample->jenis_uji,
            'nilai_slump' => $sample->nilai_slump,
            'tanggal_uji_tekan_rencana' => $sample->tanggal_uji_tekan_rencana?->toDateString(),
            'hasil_uji_tekan' => $sample->hasil_uji_tekan,
            'status' => $sample->status,
            'catatan' => $sample->catatan,
            'produksi' => [
                'session_id' => $sample->session->id,
                'produk' => $sample->session->produk?->nama,
                'mesin' => $sample->session->mesin?->nama,
                'titik' => $sample->session->titik?->nama,
                'operator' => $sample->session->operator?->nama,
                'mulai' => $sample->session->mulai?->toIso8601String(),
                'selesai' => $sample->session->selesai?->toIso8601String(),
            ],
        ], 'Detail QC sample.');
    }
}
