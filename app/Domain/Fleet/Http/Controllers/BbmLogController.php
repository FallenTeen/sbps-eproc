<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\RecordBBMAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\States\Diterima;
use App\Domain\Procurement\States\DibayarSebagian;
use App\Domain\Procurement\States\Lunas;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BbmLogController extends Controller
{
    /**
     * Map tipe serviceable dari URL (string pendek) ke Eloquent class.
     */
    protected const SERVICEABLE_MAP = [
        'armada' => Armada::class,
        'mesin' => MesinProduksi::class,
        'mesin_produksi' => MesinProduksi::class,
        'mesin-produksi' => MesinProduksi::class,
    ];

    /**
     * Ambang batas anomali: liter/jam operasional di atas rata-rata + persentase ini.
     */
    protected const ANOMALY_THRESHOLD_PERCENT = 20;

    /**
     * Display a listing of BBM dengan filter (tanggal, armada/mesin, periode).
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', BbmLog::class);

        $query = BbmLog::with(['serviceable', 'dicatatOleh', 'purchaseOrder']);

        if ($request->filled('tipe')) {
            $modelClass = self::SERVICEABLE_MAP[$request->tipe] ?? null;
            if ($modelClass) {
                $query->where('serviceable_type', $modelClass);
            }
        }

        if ($request->filled('serviceable_id')) {
            $query->where('serviceable_id', $request->serviceable_id);
        }

        if ($request->filled('tanggal_dari')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_dari);
        }

        if ($request->filled('tanggal_sampai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_sampai);
        }

        if ($request->filled('bulan') && $request->filled('tahun')) {
            $query->whereMonth('tanggal', $request->bulan)->whereYear('tanggal', $request->tahun);
        }

        if ($request->user()->unit_bisnis_id) {
            $unitId = $request->user()->unit_bisnis_id;
            $query->whereHasMorph('serviceable', [Armada::class, MesinProduksi::class], function ($q) use ($unitId) {
                $q->where('unit_bisnis_id', $unitId);
            });
        }

        $bbmLogs = $query->orderBy('tanggal', 'desc')->paginate(20)->withQueryString();

        return Inertia::render('Fleet/BBM/Index', [
            'bbmLogs' => $bbmLogs,
            'filters' => $request->only(['tipe', 'serviceable_id', 'tanggal_dari', 'tanggal_sampai', 'bulan', 'tahun']),
        ]);
    }

    /**
     * Show form pencatatan BBM untuk armada/mesin tertentu.
     */
    public function create(string $serviceableType, string $serviceableId)
    {
        $serviceable = $this->resolveServiceable($serviceableType, $serviceableId);

        $this->authorize('recordBbm', $serviceable);

        return Inertia::render('Fleet/BBM/Create', [
            'serviceable' => $serviceable,
            'serviceableType' => $serviceableType,
        ]);
    }

    /**
     * Store pencatatan BBM baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'serviceable_type' => 'required|string|in:' . implode(',', array_keys(self::SERVICEABLE_MAP)),
            'serviceable_id' => 'required|string',
            'tanggal' => 'nullable|date|before_or_equal:today',
            'liter' => 'required|numeric|min:0.01',
            'biaya' => 'nullable|numeric|min:0',
            'jam_operasional_saat_isi' => 'nullable|numeric|min:0',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);

        $serviceable = $this->resolveServiceable($validated['serviceable_type'], $validated['serviceable_id']);

        $this->authorize('recordBbm', $serviceable);

        // Validasi PO (Skenario A - praktis): kalau purchase_order_id diisi,
        // pastikan PO sudah diterima (barang/BBM sudah masuk), bukan PO
        // yang masih draft/diajukan/ditolak. Belum memvalidasi kategori
        // item PO benar-benar "BBM" karena belum ada penanda kategori
        // eksplisit untuk itu di data bahan baku (lihat catatan sebelumnya).
        if (!empty($validated['purchase_order_id'])) {
            $po = PurchaseOrder::findOrFail($validated['purchase_order_id']);
            $statusDiizinkan = $po->status instanceof Diterima
                || $po->status instanceof DibayarSebagian
                || $po->status instanceof Lunas;

            if (!$statusDiizinkan) {
                return back()
                    ->withErrors(['purchase_order_id' => 'PO belum diterima, tidak bisa dipakai untuk pencatatan BBM.'])
                    ->withInput();
            }
        }

        $bbmLog = app(RecordBBMAction::class)->execute($serviceable, [
            'tanggal' => $validated['tanggal'] ?? now(),
            'liter' => $validated['liter'],
            'biaya' => $validated['biaya'] ?? null,
            'jam_operasional_saat_isi' => $validated['jam_operasional_saat_isi'] ?? null,
            'purchase_order_id' => $validated['purchase_order_id'] ?? null,
        ]);

        return back()->with('success', 'Pencatatan BBM berhasil disimpan.');
    }

    /**
     * Display the specified BBM log.
     */
    public function show(BbmLog $bbm)
    {
        $this->authorize('view', $bbm);

        $bbm->load(['serviceable', 'dicatatOleh', 'purchaseOrder']);

        return Inertia::render('Fleet/BBM/Show', [
            'bbmLog' => $bbm,
        ]);
    }

    /**
     * Update BBM log (mis. koreksi jumlah liter/biaya yang salah input).
     */
    public function update(Request $request, BbmLog $bbm)
    {
        $bbm->loadMissing('serviceable');

        $this->authorize('recordBbm', $bbm->serviceable);

        $validated = $request->validate([
            'tanggal' => 'nullable|date|before_or_equal:today',
            'liter' => 'required|numeric|min:0.01',
            'biaya' => 'nullable|numeric|min:0',
            'jam_operasional_saat_isi' => 'nullable|numeric|min:0',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);

        if (!empty($validated['purchase_order_id'])) {
            $po = PurchaseOrder::findOrFail($validated['purchase_order_id']);
            $statusDiizinkan = $po->status instanceof Diterima
                || $po->status instanceof DibayarSebagian
                || $po->status instanceof Lunas;

            if (!$statusDiizinkan) {
                return back()
                    ->withErrors(['purchase_order_id' => 'PO belum diterima, tidak bisa dipakai untuk pencatatan BBM.'])
                    ->withInput();
            }
        }

        $bbm->update($validated);

        return back()->with('success', 'Pencatatan BBM berhasil diperbarui.');
    }

    /**
     * Hapus BBM log (mis. salah catat).
     */
    public function destroy(BbmLog $bbm)
    {
        $bbm->loadMissing('serviceable');

        $this->authorize('recordBbm', $bbm->serviceable);

        $bbm->delete();

        return back()->with('success', 'Pencatatan BBM dihapus.');
    }

    /**
     * Riwayat BBM per armada/mesin.
     */
    public function byServiceable(string $serviceableType, string $serviceableId)
    {
        $serviceable = $this->resolveServiceable($serviceableType, $serviceableId);

        $this->authorize('view', $serviceable);

        $bbmLogs = $serviceable->bbmLogs()
            ->with(['dicatatOleh', 'purchaseOrder'])
            ->orderBy('tanggal', 'desc')
            ->paginate(20);

        return Inertia::render('Fleet/BBM/Index', [
            'serviceable' => $serviceable,
            'serviceableType' => $serviceableType,
            'bbmLogs' => $bbmLogs,
        ]);
    }

    /**
     * Daftar anomali konsumsi BBM (liter/jam operasional > rata-rata + 20%).
     *
     * CATATAN PENTING - INI BUKAN IMPLEMENTASI PERSIS SPESIFIKASI AWAL:
     * Spesifikasi menyebut 2 pendekatan berbeda: (a) membandingkan konsumsi
     * aktual terhadap estimasi dari `indeks_liter_solar_per_km` pada model
     * Rute, dan (b) menandai anomali di kolom "catatan" saat store().
     * Kedua hal itu TIDAK BISA diimplementasikan dengan schema yang saya
     * lihat sejauh ini:
     *   - Tidak ada model/tabel Rute dengan indeks_liter_solar_per_km yang
     *     dikirim ke saya.
     *   - Tabel bbm_logs tidak punya kolom catatan/is_anomaly untuk
     *     menyimpan flag anomali.
     * Karena itu saya implementasikan pendekatan (b) versi kedua dari
     * spesifikasi ("liter_per_jam_operasional > rata-rata + 20%"), dihitung
     * ON-THE-FLY di endpoint ini (bukan disimpan saat store()), dari selisih
     * `jam_operasional_saat_isi` antar pengisian berurutan per serviceable.
     * Kalau memang ada model Rute yang belum saya lihat, atau kolom
     * catatan/is_anomaly perlu ditambahkan via migration baru, beri tahu
     * saya supaya saya sesuaikan.
     */
    public function anomaly(Request $request)
    {
        $this->authorize('anomaly', BbmLog::class);

        $query = BbmLog::with('serviceable')
            ->orderBy('serviceable_type')
            ->orderBy('serviceable_id')
            ->orderBy('tanggal');

        if ($request->user()->unit_bisnis_id) {
            $unitId = $request->user()->unit_bisnis_id;
            $query->whereHasMorph('serviceable', [Armada::class, MesinProduksi::class], function ($q) use ($unitId) {
                $q->where('unit_bisnis_id', $unitId);
            });
        }

        $logs = $query->get()
            ->groupBy(fn($log) => $log->serviceable_type . ':' . $log->serviceable_id);

        $anomalies = collect();

        foreach ($logs as $group) {
            $sorted = $group->sortBy('tanggal')->values();
            $rates = [];

            for ($i = 1; $i < $sorted->count(); $i++) {
                $prev = $sorted[$i - 1];
                $curr = $sorted[$i];

                if ($curr->jam_operasional_saat_isi === null || $prev->jam_operasional_saat_isi === null) {
                    continue;
                }

                $deltaJam = $curr->jam_operasional_saat_isi - $prev->jam_operasional_saat_isi;
                if ($deltaJam <= 0) {
                    continue;
                }

                $rates[$curr->id] = $curr->liter / $deltaJam;
            }

            // Butuh minimal 2 data untuk rata-rata yang bermakna.
            if (count($rates) < 2) {
                continue;
            }

            $average = array_sum($rates) / count($rates);
            $threshold = $average * (1 + self::ANOMALY_THRESHOLD_PERCENT / 100);

            foreach ($rates as $bbmLogId => $rate) {
                if ($rate > $threshold) {
                    $anomalies->push([
                        'bbm_log' => $sorted->firstWhere('id', $bbmLogId),
                        'liter_per_jam' => round($rate, 2),
                        'rata_rata_normal' => round($average, 2),
                        'threshold' => round($threshold, 2),
                    ]);
                }
            }
        }

        return Inertia::render('Fleet/BBM/Anomaly', [
            'anomalies' => $anomalies->values(),
        ]);
    }

    /**
     * Resolve model serviceable (Armada|MesinProduksi) dari tipe singkat di URL.
     */
    protected function resolveServiceable(string $type, string $id)
    {
        $modelClass = self::SERVICEABLE_MAP[$type] ?? null;

        if (!$modelClass) {
            abort(404, "Tipe serviceable '{$type}' tidak dikenal.");
        }

        return $modelClass::findOrFail($id);
    }
}
