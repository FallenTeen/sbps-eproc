<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\RecordBBMAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\Ritase;
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
     * Show form pencatatan BBM. Tipe & unit bersifat opsional
     * (dipilih via dropdown), hanya dipakai untuk preselect saat
     * diakses dari halaman armada/mesin tertentu.
     */
    public function create(Request $request)
    {
        $serviceableType = $request->query('type');
        $serviceableId = $request->query('id');

        if ($serviceableType && $serviceableId) {
            $serviceable = $this->resolveServiceable($serviceableType, $serviceableId);
            $this->authorize('recordBbm', $serviceable);
        }

        return Inertia::render('Fleet/BBM/Create', [
            'serviceableTypes' => [
                ['value' => 'armada', 'label' => 'Armada'],
                ['value' => 'mesin_produksi', 'label' => 'Mesin Produksi'],
            ],
            'serviceables' => [
                'armada' => Armada::query()->orderBy('kode_unit')->get(['id', 'kode_unit', 'plat_nomor']),
                'mesin_produksi' => MesinProduksi::query()->orderBy('nama')->get(['id', 'nama']),
            ],
            'serviceableType' => $serviceableType,
            'serviceableId' => $serviceableId,
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
     * Daftar anomali konsumsi BBM.
     *
     * Pendekatan (sesuai arahan): prioritas dulu ESTIMASI BERBASIS RUTE untuk
     * armada (pakai Ritase + RuteTarif::indeks_liter_solar_per_km), baru
     * FALLBACK ke rata-rata historis (liter/jam operasional) kalau:
     *   - serviceable-nya MesinProduksi (tidak ada konsep "rit"/rute), atau
     *   - armada tidak punya data Ritase yang cocok di periode antar-isi.
     *
     * Catatan: hasil TIDAK disimpan ke DB (dihitung on-the-fly saat endpoint
     * ini dipanggil), karena tabel bbm_logs tidak punya kolom untuk flag
     * anomali permanen.
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
            ->groupBy(fn ($log) => $log->serviceable_type . ':' . $log->serviceable_id);

        $anomalies = collect();

        foreach ($logs as $group) {
            $sorted = $group->sortBy('tanggal')->values();

            if ($sorted->first()->serviceable_type === Armada::class) {
                $anomalies = $anomalies->merge($this->detectAnomaliArmadaBerbasisRute($sorted));
            } else {
                $anomalies = $anomalies->merge($this->detectAnomaliRataRataHistoris($sorted));
            }
        }

        return Inertia::render('Fleet/BBM/Anomaly', [
            'anomalies' => $anomalies->values(),
        ]);
    }

    /**
     * Deteksi anomali armada dengan membandingkan liter aktual terhadap
     * estimasi kebutuhan BBM dari jarak tempuh (Ritase x RuteTarif) di
     * antara dua tanggal pengisian berurutan.
     *
     * @param \Illuminate\Support\Collection<int, BbmLog> $sortedLogs BBM log 1 armada, terurut tanggal ASC.
     */
    protected function detectAnomaliArmadaBerbasisRute($sortedLogs): \Illuminate\Support\Collection
    {
        $result = collect();
        $armadaId = $sortedLogs->first()->serviceable_id;
        $sisaUntukFallback = collect();

        for ($i = 1; $i < $sortedLogs->count(); $i++) {
            $prev = $sortedLogs[$i - 1];
            $curr = $sortedLogs[$i];

            $ritasesPeriode = Ritase::where('armada_id', $armadaId)
                ->whereBetween('tanggal', [$prev->tanggal, $curr->tanggal])
                ->with('ruteTarif')
                ->get()
                ->filter(fn ($ritase) => $ritase->ruteTarif && $ritase->ruteTarif->indeks_liter_solar_per_km !== null);

            if ($ritasesPeriode->isEmpty()) {
                // Tidak ada data rute yang bisa dipakai di periode ini,
                // simpan pasangan ini untuk dicoba lewat fallback rata-rata.
                $sisaUntukFallback->push($curr);
                continue;
            }

            $totalJarakKm = $ritasesPeriode->sum(
                fn ($ritase) => ($ritase->jumlah_rit ?? 0) * $ritase->ruteTarif->jarak_km
            );

            $estimasiLiter = $ritasesPeriode->sum(
                fn ($ritase) => ($ritase->jumlah_rit ?? 0) * $ritase->ruteTarif->jarak_km * $ritase->ruteTarif->indeks_liter_solar_per_km
            );

            if ($estimasiLiter <= 0) {
                $sisaUntukFallback->push($curr);
                continue;
            }

            $threshold = $estimasiLiter * (1 + self::ANOMALY_THRESHOLD_PERCENT / 100);

            if ($curr->liter > $threshold) {
                $result->push([
                    'bbm_log' => $curr,
                    'metode' => 'estimasi_rute',
                    'liter_aktual' => $curr->liter,
                    'estimasi_liter' => round($estimasiLiter, 2),
                    'threshold' => round($threshold, 2),
                    'total_jarak_km' => round($totalJarakKm, 2),
                ]);
            }
        }

        // Untuk pengisian yang tidak punya data rute yang cocok, coba
        // fallback ke pendekatan rata-rata historis (liter/jam operasional).
        if ($sisaUntukFallback->isNotEmpty()) {
            $logsUntukFallback = collect([$sortedLogs->first()])->merge($sisaUntukFallback)->unique('id')->sortBy('tanggal')->values();
            $result = $result->merge($this->detectAnomaliRataRataHistoris($logsUntukFallback, 'estimasi_rute_tidak_tersedia_fallback_rata_rata'));
        }

        return $result;
    }

    /**
     * Fallback: deteksi anomali dari rata-rata historis liter/jam operasional
     * (dipakai untuk MesinProduksi, dan untuk armada yang tidak punya data
     * Ritase yang cocok di periode terkait).
     *
     * @param \Illuminate\Support\Collection<int, BbmLog> $sortedLogs
     */
    protected function detectAnomaliRataRataHistoris($sortedLogs, string $metode = 'rata_rata_historis'): \Illuminate\Support\Collection
    {
        $result = collect();
        $rates = [];

        for ($i = 1; $i < $sortedLogs->count(); $i++) {
            $prev = $sortedLogs[$i - 1];
            $curr = $sortedLogs[$i];

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
            return $result;
        }

        $average = array_sum($rates) / count($rates);
        $threshold = $average * (1 + self::ANOMALY_THRESHOLD_PERCENT / 100);

        foreach ($rates as $bbmLogId => $rate) {
            if ($rate > $threshold) {
                $result->push([
                    'bbm_log' => $sortedLogs->firstWhere('id', $bbmLogId),
                    'metode' => $metode,
                    'liter_per_jam' => round($rate, 2),
                    'rata_rata_normal' => round($average, 2),
                    'threshold' => round($threshold, 2),
                ]);
            }
        }

        return $result;
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