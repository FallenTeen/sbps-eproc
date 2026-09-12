<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Actions\RecordPengadaanSparepartAction;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Inventory\Actions\CreateStokOpnameAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\StokMutasi;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Mobile API — Modul Inventory (Bagian 21.7 & SYSTEM_DOCUMENTATION §14d).
 *
 * Endpoint untuk role Inventory: ringkasan deret kunci, daftar stok
 * bahan baku & sparepart beserta saldo (dihitung on-the-fly dari
 * StokMutasi), request sparepart dari workshop, dan checklist Stok Opname.
 */
class InventoryController extends Controller
{
    use ApiResponse;

    /**
     * Saldo stok per bahan baku (1 query agregat, bukan per-item).
     */
    private function saldoByBahanBaku(): \Illuminate\Support\Collection
    {
        return StokMutasi::query()
            ->selectRaw('bahan_baku_id, sum(case when tipe = "masuk" then jumlah else -jumlah end) as saldo')
            ->groupBy('bahan_baku_id')
            ->pluck('saldo', 'bahan_baku_id');
    }

    /**
     * GET /api/mobile/inventory/summary
     * Ringkasan untuk halaman utama inventory.
     */
    public function summary(Request $request)
    {
        $bahanBakus = BahanBaku::where('aktif', true)->get();
        $saldos = $this->saldoByBahanBaku();

        $nilaiStok = 0.0;
        $stokRendahCount = 0;
        foreach ($bahanBakus as $bahanBaku) {
            $saldo = (float) $saldos->get($bahanBaku->id, 0);
            if ($saldo < (float) $bahanBaku->stok_minimum) {
                $stokRendahCount++;
            }
            $nilaiStok += $saldo * $this->hargaTerbaru($bahanBaku->id);
        }

        $requestPendingCount = PengajuanServisArmada::query()
            ->whereHas('spareparts', fn ($q) => $q->where('status', 'diajukan'))
            ->count();

        return $this->success([
            'total_item' => $bahanBakus->count(),
            'nilai_stok' => round($nilaiStok, 2),
            'stok_rendah_count' => $stokRendahCount,
            'request_pending_count' => $requestPendingCount,
        ], 'Ringkasan inventory.');
    }

    /**
     * GET /api/mobile/inventory/materials?kategori=bahan_baku|sparepart
     * Daftar bahan baku & sparepart aktif beserta saldo dan batas minimum.
     */
    public function materials(Request $request)
    {
        $query = BahanBaku::where('aktif', true)->orderBy('nama');
        if ($request->filled('kategori')) {
            $kategori = str_replace(' ', '_', strtolower(trim($request->query('kategori'))));
            if (in_array($kategori, ['bahan_baku', 'sparepart'], true)) {
                $query->where('kategori', $kategori);
            }
        }

        $bahanBakus = $query->get();
        $saldos = $this->saldoByBahanBaku();

        $items = $bahanBakus->map(fn (BahanBaku $b) => [
            'id' => $b->id,
            'kode' => $b->kode,
            'nama' => $b->nama,
            'kategori' => $b->kategori === 'bahan_baku' ? 'Bahan Baku' : 'Sparepart',
            'satuan' => $b->satuan,
            'sparepart_untuk' => $b->sparepart_untuk,
            'lokasi_gudang' => null,
            'stok_saat_ini' => round((float) $saldos->get($b->id, 0), 2),
            'stok_minimum' => round((float) $b->stok_minimum, 2),
        ]);

        return $this->success($items, 'Daftar stok bahan baku & sparepart.');
    }

    /**
     * GET /api/mobile/inventory/requests?status=pending|diproses|selesai
     * Request sparepart dari workshop (Bagian 21.8 #4).
     */
    public function requests(Request $request)
    {
        $query = PengajuanServisArmada::with(['armada', 'spareparts'])
            ->whereHas('spareparts')
            ->latest('tanggal_ajuan')
            ->latest('created_at');

        $requests = $query->get()
            ->map(fn (PengajuanServisArmada $p) => $this->mapRequest($p))
            ->values();

        if ($request->filled('status')) {
            $requests = $requests->where('status', $request->query('status'))->values();
        }

        return $this->success($requests, 'Daftar request sparepart dari workshop.');
    }

    /**
     * GET /api/mobile/inventory/requests/{id}
     * Detail satu request sparepart antar modul workshop → inventory.
     */
    public function requestDetail(Request $request, $id)
    {
        $pengajuan = PengajuanServisArmada::with(['armada', 'diajukanOleh', 'spareparts'])
            ->findOrFail($id);

        return $this->success($this->mapRequest($pengajuan), 'Detail request sparepart.');
    }

    /**
     * POST /api/mobile/inventory/requests/{id}/proses
     * Catat pengadaan/kesediaan sparepart — semua item yang dikirim jadi
     * `tersedia`, status servis lanjut ke `sparepart_tersedia`.
     */
    public function prosesRequest(Request $request, $id)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:pengajuan_servis_spareparts,id',
            'items.*.nominal' => 'nullable|numeric|min:0',
            'items.*.jumlah' => 'nullable|numeric|min:0',
            'items.*.tanggal' => 'nullable|date',
            'items.*.foto_nota' => 'nullable|string|max:255',
            'items.*.catatan' => 'nullable|string|max:1000',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $updated = app(RecordPengadaanSparepartAction::class)->execute(
            $pengajuan,
            $request->user(),
            $validated,
        );

        return $this->success(
            $this->mapRequest($updated->load(['armada', 'spareparts'])),
            'Request sparepart diproses.',
        );
    }

    /**
     * GET /api/mobile/inventory/opname/materials
     * Daftar item untuk form Stok Opname (jumlah sistem sudah diisi).
     */
    public function opnameMaterials(Request $request)
    {
        $bahanBakus = BahanBaku::where('aktif', true)->orderBy('nama')->get();
        $saldos = $this->saldoByBahanBaku();

        $items = $bahanBakus->map(fn (BahanBaku $b) => [
            'id' => $b->id,
            'nama_barang' => $b->nama,
            'kategori' => $b->kategori === 'bahan_baku' ? 'Bahan Baku' : 'Sparepart',
            'jumlah_sistem' => round((float) $saldos->get($b->id, 0), 2),
            'satuan' => $b->satuan,
        ]);

        return $this->success($items, 'Daftar item untuk stok opname.');
    }

    /**
     * POST /api/mobile/inventory/opname
     * Simpan checklist stok opname (satu titik, satu tanggal, banyak item).
     * Body: { titik_id, tanggal?, items: [{bahan_baku_id, saldo_fisik, catatan?}] }
     */
    public function submitOpname(Request $request)
    {
        $validated = $request->validate([
            'titik_id' => 'required|exists:titiks,id',
            'tanggal' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.saldo_fisik' => 'required|numeric|min:0',
            'items.*.catatan' => 'nullable|string|max:1000',
        ]);

        $tanggal = $validated['tanggal'] ?? now()->toDateString();

        $created = app(CreateStokOpnameAction::class)->execute(
            $request->user(),
            $validated['titik_id'],
            $tanggal,
            $validated['items'],
        );

        return $this->success($created, 'Stok opname berhasil disimpan.', 201);
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private function mapRequest(PengajuanServisArmada $p): array
    {
        $items = $p->spareparts->map(fn (PengajuanServisSparepart $s) => [
            'id' => $s->id,
            'nama_barang' => $s->nama_item,
            'jumlah_diminta' => round((float) $s->jumlah, 2),
            'jumlah_tersedia' => null,
            'satuan' => $s->satuan ?? '-',
            'status' => $s->status === 'tersedia' ? 'tersedia' : 'kurang',
        ]);

        $statuses = $items->pluck('status')->unique();
        $status = match (true) {
            $statuses->every(fn ($s) => $s === 'tersedia') => 'selesai',
            $statuses->contains('tersedia') => 'diproses',
            default => 'pending',
        };

        return [
            'id' => $p->id,
            'workshop_job_id' => $p->id,
            'plat_nomor' => $p->armada?->plat_nomor ?? '-',
            'kategori_servis' => 'Servis Armada',
            'status' => $status,
            'created_at' => $p->tanggal_ajuan->toDateString(),
            'items' => $items->values(),
        ];
    }

    private function hargaTerbaru(string $bahanBakuId): float
    {
        $harga = BahanBaku::find($bahanBakuId)?->hargaBeli()
            ->where('berlaku_dari', '<=', now())
            ->where(function ($q) {
                $q->whereNull('berlaku_sampai')->orWhere('berlaku_sampai', '>=', now());
            })
            ->orderBy('berlaku_dari', 'desc')
            ->first();

        return $harga ? (float) $harga->harga : 0.0;
    }
}