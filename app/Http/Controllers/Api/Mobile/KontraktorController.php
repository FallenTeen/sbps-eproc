<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\KomunikasiLog;
use App\Domain\Core\Models\Proyek;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Production\Models\ProductionSession;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class KontraktorController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/kontraktor/proyek
     */
    public function proyekList(Request $request)
    {
        $proyeks = Proyek::kontrakKlien()
            ->with('unitBisnis:id,nama')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Proyek $p) => [
                'id' => $p->id,
                'kode_proyek' => $p->kode_proyek,
                'nama' => $p->nama,
                'client' => $p->client,
                'lokasi' => $p->lokasi,
                'status' => $p->status,
                'unit_bisnis' => $p->unitBisnis?->nama,
                'tanggal_mulai' => $p->tanggal_mulai?->toDateString(),
            ]);

        return $this->success($proyeks, 'Daftar proyek kontrak.');
    }

    /**
     * GET /api/mobile/kontraktor/proyek/{id}
     */
    public function proyekDetail(Request $request, string $proyekId)
    {
        $proyek = Proyek::with('unitBisnis:id,nama')->findOrFail($proyekId);

        if ($proyek->tipe_proyek !== 'kontrak_klien') {
            return $this->error('Bukan proyek kontrak klien.', 403);
        }

        // 1. Progress produksi
        $titikIds = $proyek->titik()->pluck('id');

        $sessions = ProductionSession::whereIn('titik_id', $titikIds)
            ->with('produk:id,nama,satuan_output')
            ->get();

        $produksiSummary = $sessions
            ->groupBy('produk_id')
            ->map(function ($rows) {
                $produk = $rows->first()->produk;

                return [
                    'nama' => $produk?->nama ?? 'Produk Lain',
                    'satuan' => $produk?->satuan_output ?? 'Unit',
                    'total_output' => (float) $rows->sum('hasil_output'),
                    'sesi_count' => $rows->count(),
                ];
            })
            ->values();

        // 2. RAB agregat (rencana vs realisasi)
        $totalRencana = 0;
        $totalRealisasi = 0;
        $getRabAction = new GetRABRealisasiAction;

        foreach ($proyek->rab as $rab) {
            $totalRencana += (float) $rab->rencana;
            $totalRealisasi += (float) $getRabAction->execute($rab);
        }

        // 3. Invoice
        $invoices = Invoice::where('proyek_id', $proyek->id)
            ->with(['items', 'pembayaranKlien'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Invoice $inv) {
                $total = (float) $inv->items->sum('subtotal');
                $paid = (float) $inv->pembayaranKlien->sum('jumlah');

                return [
                    'id' => $inv->id,
                    'kode_invoice' => $inv->kode_invoice,
                    'tanggal_terbit' => $inv->tanggal_terbit?->toDateString(),
                    'tanggal_jatuh_tempo' => $inv->tanggal_jatuh_tempo?->toDateString(),
                    'status' => $inv->status,
                    'total' => $total,
                    'paid' => $paid,
                    'sisa' => max(0, $total - $paid),
                ];
            });

        // 4. Komunikasi
        $komunikasiLogs = KomunikasiLog::where('proyek_id', $proyek->id)
            ->with('user:id,name,nama_lengkap')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn (KomunikasiLog $log) => [
                'id' => $log->id,
                'pengirim' => $log->user ? ($log->user->nama_lengkap ?? $log->user->name) : 'Sistem',
                'pengirim_role' => $log->pengirim_role,
                'pesan' => $log->pesan,
                'waktu' => $log->created_at?->toIso8601String(),
            ]);

        return $this->success([
            'proyek' => [
                'id' => $proyek->id,
                'kode_proyek' => $proyek->kode_proyek,
                'nama' => $proyek->nama,
                'client' => $proyek->client,
                'lokasi' => $proyek->lokasi,
                'status' => $proyek->status,
                'tanggal_mulai' => $proyek->tanggal_mulai?->toDateString(),
            ],
            'produksi_summary' => $produksiSummary,
            'rab_agregat' => [
                'total_rencana' => $totalRencana,
                'total_realisasi' => $totalRealisasi,
                'persentase' => $totalRencana > 0 ? round(($totalRealisasi / $totalRencana) * 100, 1) : 0,
            ],
            'invoices' => $invoices,
            'komunikasi_logs' => $komunikasiLogs,
        ], 'Detail proyek kontrak.');
    }

    /**
     * GET /api/mobile/kontraktor/invoice
     */
    public function invoiceList(Request $request)
    {
        $proyekIds = Proyek::kontrakKlien()->pluck('id');

        $invoices = Invoice::whereIn('proyek_id', $proyekIds)
            ->with(['proyek:id,nama', 'items', 'pembayaranKlien'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Invoice $inv) {
                $total = (float) $inv->items->sum('subtotal');
                $paid = (float) $inv->pembayaranKlien->sum('jumlah');

                return [
                    'id' => $inv->id,
                    'kode_invoice' => $inv->kode_invoice,
                    'proyek' => $inv->proyek?->nama,
                    'tanggal_terbit' => $inv->tanggal_terbit?->toDateString(),
                    'tanggal_jatuh_tempo' => $inv->tanggal_jatuh_tempo?->toDateString(),
                    'status' => $inv->status,
                    'total' => $total,
                    'paid' => $paid,
                    'sisa' => max(0, $total - $paid),
                ];
            });

        return $this->success($invoices, 'Daftar invoice kontraktor.');
    }

    /**
     * POST /api/mobile/kontraktor/komunikasi
     * Body: { proyek_id, pesan }
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'proyek_id' => 'required|exists:proyeks,id',
            'pesan' => 'required|string|max:1000',
        ]);

        $proyek = Proyek::findOrFail($validated['proyek_id']);

        if ($proyek->tipe_proyek !== 'kontrak_klien') {
            return $this->error('Bukan proyek kontrak klien.', 403);
        }

        $user = $request->user();
        $role = $user->hasRole('Kontraktor') ? 'kontraktor' : 'kantor';

        $log = KomunikasiLog::create([
            'proyek_id' => $proyek->id,
            'user_id' => $user->id,
            'pengirim_role' => $role,
            'pesan' => $validated['pesan'],
        ]);

        return $this->success([
            'id' => $log->id,
            'pengirim' => $user->name,
            'pengirim_role' => $log->pengirim_role,
            'pesan' => $log->pesan,
            'waktu' => $log->created_at?->toIso8601String(),
        ], 'Pesan berhasil terkirim.', 201);
    }
}
