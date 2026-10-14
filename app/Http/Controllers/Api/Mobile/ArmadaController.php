<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Actions\RecordChecklistAkhirAction;
use App\Domain\Fleet\Actions\RecordChecklistAwalAction;
use App\Domain\Fleet\Actions\RecordChecklistSerahTerimaAction;
use App\Domain\Fleet\Actions\RecordHelperPresensiAction;
use App\Domain\Fleet\Actions\RecordOdoAwalProyekAction;
use App\Domain\Fleet\Actions\RecordPengisianSolarAction;
use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Enums\StokSolar;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistAkhir;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use App\Domain\Fleet\Models\ArmadaPengisianSolar;
use App\Domain\Fleet\Models\ChecklistSerahTerima;
use App\Domain\Fleet\Models\HelperArmada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\Fleet\Services\ChecklistLockService;
use App\Domain\Core\Models\Proyek;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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

    /** Daftar bagian default checklist (web & mobile sama). */
    public const BAGIAN_DEFAULT = ['Ban', 'Rem', 'Lampu', 'Oli mesin', 'Air radiator', 'Body', 'Kabin'];

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
        $armadas = $this->activeArmadas($request)->values();
        $armadaIds = $armadas->pluck('id')->all();

        $latestChecklists = collect();
        $latestOdoAwals = collect();
        $latestAkhirs = collect();
        $latestPengisians = collect();
        $helperCounts = collect();

        if (! empty($armadaIds)) {
            $today = now()->toDateString();

            // Helper aktif hari ini per armada (untuk badge menu Presensi Helper).
            $helperCounts = HelperArmada::whereIn('armada_id', $armadaIds)
                ->where('status', 'aktif')
                ->whereDate('durasi_mulai', '<=', $today)
                ->where(fn ($q) => $q->whereNull('durasi_selesai')->orWhereDate('durasi_selesai', '>=', $today))
                ->selectRaw('armada_id, count(*) as total')
                ->groupBy('armada_id')
                ->pluck('total', 'armada_id');
            // Bulk query checklist awal TERBARU per armada (anti N+1)
            $latestChecklists = ArmadaChecklistHarian::where('checkable_type', Armada::class)
                ->whereIn('checkable_id', $armadaIds)
                ->orderByDesc('tanggal')
                ->orderByDesc('created_at')
                ->get()
                ->keyBy('checkable_id');

            // Checklist akhir TERBARU per armada
            $latestAkhirs = ArmadaChecklistAkhir::whereIn('armada_id', $armadaIds)
                ->orderByDesc('tanggal')
                ->orderByDesc('created_at')
                ->get()
                ->keyBy('armada_id');

            // Pengisian solar TERBARU per armada
            $latestPengisians = ArmadaPengisianSolar::whereIn('armada_id', $armadaIds)
                ->orderByDesc('tanggal')
                ->orderByDesc('created_at')
                ->get()
                ->keyBy('armada_id');

            // Bulk query ODO awal proyek TERBARU per armada
            $latestOdoAwals = ArmadaOdoAwalProyek::whereIn('armada_id', $armadaIds)
                ->orderByDesc('tanggal')
                ->orderByDesc('created_at')
                ->get()
                ->keyBy('armada_id');
        }

        $items = $armadas->map(function (Armada $a) use ($latestChecklists, $latestOdoAwals, $latestAkhirs, $latestPengisians, $helperCounts) {
            $latestChecklist = $latestChecklists->get($a->id);
            $akhir = $latestAkhirs->get($a->id);
            $pengisian = $latestPengisians->get($a->id);

            // Prioritas ODO terkini: akhir.odo_akhir → pengisian terbaru → awal.odo_pagi → ODO awal proyek.
            $latestOdo = null;
            if ($akhir?->odo_akhir !== null) {
                $latestOdo = (float) $akhir->odo_akhir;
            } elseif ($pengisian?->odo_atau_hm !== null) {
                $latestOdo = (float) $pengisian->odo_atau_hm;
            } elseif ($latestChecklist?->odo_pagi !== null) {
                $latestOdo = (float) $latestChecklist->odo_pagi;
            } else {
                $odoAwal = $latestOdoAwals->get($a->id);
                $latestOdo = $odoAwal ? (float) $odoAwal->odo_awal : null;
            }

            // Jam operasional terkini: akhir.hm_akhir → awal.hm_odo.
            $latestJam = $akhir?->hm_akhir !== null
                ? (float) $akhir->hm_akhir
                : ($latestChecklist?->hm_odo !== null ? (float) $latestChecklist->hm_odo : null);

            return [
                'id' => $a->id,
                'plat_nomor' => $a->plat_nomor,
                'kode_unit' => $a->kode_unit,
                'jenis' => $a->jenis,
                'tipe_unit' => $a->tipe_unit,
                'model_tarif' => $a->model_tarif,
                'tahun' => $a->tahun,
                'kapasitas' => $a->kapasitas,
                'status' => $a->status,
                'unit_bisnis' => $a->unitBisnis?->nama,
                'titik' => $a->titik ? [
                    'id' => $a->titik->id,
                    'nama' => $a->titik->nama,
                    'proyek_id' => $a->titik->proyek_id,
                ] : null,
                'odo_terkini' => $latestOdo,
                'jam_operasional_terkini' => $latestJam,
                'helper_aktif_count' => (int) ($helperCounts[$a->id] ?? 0),
            ];
        });

        return $this->success(['items' => $items], 'Armada milik driver.');
    }

    /**
     * GET /api/mobile/armada/ritase?bulan=&tahun=&per_page=&page=
     * Riwayat ritase/pengiriman milik driver.
     */
    public function ritase(Request $request)
    {
        $user = $request->user();
        $isManager = $user && $user->hasAnyRole(['Kepala Divisi Armada', 'Ketua Divisi Armada', 'Ketua Armada', 'Owner', 'Admin Keuangan']);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan && ! $isManager) {
            return $this->success(['items' => [], 'current_page' => 1, 'last_page' => 1, 'total' => 0]);
        }

        $validated = $request->validate([
            'tanggal' => 'nullable|date',
            'bulan' => 'nullable|integer|between:1,12',
            'tahun' => 'nullable|integer|min:2000',
            'per_page' => 'nullable|integer|between:1,100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $validated['per_page'] ?? 15;

        $query = Ritase::with(['armada', 'ruteTarif', 'proyek', 'titik'])
            ->when(! $isManager, fn ($q) => $q->where('driver_karyawan_id', $karyawan?->id))
            ->orderByDesc('tanggal');

        if (isset($validated['tanggal'])) {
            $query->whereDate('tanggal', $validated['tanggal']);
        } elseif (isset($validated['bulan']) && isset($validated['tahun'])) {
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
     * POST /api/mobile/armada/ritase/input
     * Catat satu atau beberapa muatan untuk armada yang dipegang driver.
     */
    public function storeRitase(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'tanggal' => 'nullable|date|before_or_equal:today',
            'rute_tarif_id' => 'nullable|string|exists:rute_tarifs,id',
            'kategori' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:100',
            'jumlah_rit' => 'required|integer|min:1',
            'satuan_volume' => 'nullable|in:ritase,tonase,m3,harian',
            'jumlah_volume' => 'nullable|numeric|min:0',
            'tarif_per_rit_snapshot' => 'nullable|numeric|min:0',
            'nominal' => 'nullable|numeric|min:0',
            'proyek_id' => 'nullable|string|exists:proyeks,id',
            'titik_id' => 'nullable|string|exists:titiks,id',
            'customer' => 'nullable|string|max:150',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        $held = ArmadaDriver::where('armada_id', $validated['armada_id'])
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->exists();

        if (! $held) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        $ritase = app(RecordRitaseAction::class)->execute([
            ...$validated,
            'driver_karyawan_id' => $karyawan->id,
        ]);

        return $this->success([
            'id' => $ritase->id,
            'armada_id' => $ritase->armada_id,
            'driver_karyawan_id' => $ritase->driver_karyawan_id,
            'tanggal' => $ritase->tanggal?->toDateString(),
            'jumlah_rit' => $ritase->jumlah_rit,
            'total_upah_rit' => $ritase->totalUpahRit,
            'status' => $ritase->status,
        ], 'Ritase berhasil dicatat.');
    }

    /**
     * GET /api/mobile/armada/checklist-hari-ini
     * Checklist harian untuk tiap armada yang dipegang driver hari ini.
     * Tiap item menyertakan status apakah sudah dicatat (sudah_isi) plus
     * field ODO/solar/jam sesuai tipe_unit.
     */
    public function checklistHariIni(Request $request)
    {
        $today = now()->toDateString();
        $user = $request->user();
        $isManager = $user && $user->hasAnyRole(['Kepala Divisi Armada', 'Ketua Divisi Armada', 'Ketua Armada', 'Owner', 'Admin Keuangan']);

        $armadas = $isManager
            ? Armada::with(['unitBisnis', 'titik'])->where('status', '!=', 'nonaktif')->get()
            : $this->activeArmadas($request);

        $ids = $armadas->pluck('id')->all();

        // Batch semua query (anti N+1).
        $awals = empty($ids) ? collect() : ArmadaChecklistHarian::where('checkable_type', Armada::class)
            ->whereIn('checkable_id', $ids)
            ->whereDate('tanggal', $today)
            ->get()
            ->keyBy('checkable_id');

        $akhirs = empty($ids) ? collect() : ArmadaChecklistAkhir::whereIn('armada_id', $ids)
            ->whereDate('tanggal', $today)
            ->get()
            ->keyBy('armada_id');

        $pengisians = empty($ids) ? collect() : ArmadaPengisianSolar::with('karyawan')
            ->whereIn('armada_id', $ids)
            ->whereDate('tanggal', $today)
            ->orderBy('waktu')
            ->get()
            ->groupBy('armada_id');

        $karyawan = $this->currentKaryawan($request);

        $items = $armadas->map(fn (Armada $a) => $this->checklistItemPayload(
            $a,
            $today,
            $awals->get($a->id),
            $akhirs->get($a->id),
            $pengisians->get($a->id) ?? collect(),
            $karyawan,
        ))->values();

        return $this->success(['items' => $items], 'Checklist harian armada.');
    }

    /**
     * Bentuk payload checklist satu armada: awal + akhir + pengisian solar +
     * opsi dropdown. Dipakai GET checklist-hari-ini dan respons POST.
     */
    private function checklistItemPayload(
        Armada $a,
        string $tanggal,
        ?ArmadaChecklistHarian $awal,
        ?ArmadaChecklistAkhir $akhir,
        $pengisians,
        ?Karyawan $karyawan,
    ): array {
        $lock = $awal
            ? app(ChecklistLockService::class)->isAwalLocked($awal, $karyawan)
            : ['locked' => false, 'alasan' => null];

        return [
            'armada_id' => $a->id,
            'plat_nomor' => $a->plat_nomor,
            'kode_unit' => $a->kode_unit,
            'jenis' => $a->jenis,
            'tipe_unit' => $a->tipe_unit,
            'tanggal' => $tanggal,
            'sudah_isi' => $awal !== null,
            'status' => $akhir !== null ? 'selesai' : 'berjalan',
            'awal' => $awal ? $this->awalPayload($awal, $lock) : null,
            'akhir' => $akhir ? $this->akhirPayload($akhir) : null,
            'pengisian_solar' => $pengisians->map(fn (ArmadaPengisianSolar $p) => $this->pengisianPayload($p))->values(),
            'opsi_stok_solar' => StokSolar::options(),
            'bagian_default' => self::BAGIAN_DEFAULT,
        ];
    }

    private function awalPayload(ArmadaChecklistHarian $awal, array $lock): array
    {
        return [
            'checklist_id' => $awal->id,
            'kondisi_baik' => $awal->kondisi_baik,
            'item_bermasalah' => $awal->item_bermasalah,
            'items' => $awal->items,
            'stok_solar' => $awal->stok_solar?->value,
            'stok_solar_label' => $awal->stok_solar?->label(),
            'foto_stok_solar' => $awal->foto_stok_solar,
            'foto_stok_solar_url' => $awal->foto_stok_solar_url,
            'odo_pagi' => $awal->odo_pagi,
            'foto_odo_pagi' => $awal->foto_odo_pagi,
            'foto_odo_pagi_url' => $awal->foto_odo_pagi_url,
            'jam_mulai_operasi' => $awal->jam_mulai_operasi,
            'hm_odo' => $awal->hm_odo,
            'bisa_diedit' => ! $lock['locked'],
            'alasan_terkunci' => $lock['alasan'],
        ];
    }

    private function akhirPayload(ArmadaChecklistAkhir $akhir): array
    {
        return [
            'checklist_akhir_id' => $akhir->id,
            'kondisi_baik' => $akhir->kondisi_baik,
            'item_bermasalah' => $akhir->item_bermasalah,
            'items' => $akhir->items,
            'stok_solar' => $akhir->stok_solar?->value,
            'stok_solar_label' => $akhir->stok_solar?->label(),
            'foto_stok_solar' => $akhir->foto_stok_solar,
            'foto_stok_solar_url' => $akhir->foto_stok_solar_url,
            'odo_akhir' => $akhir->odo_akhir,
            'foto_odo_akhir' => $akhir->foto_odo_akhir,
            'foto_odo_akhir_url' => $akhir->foto_odo_akhir_url,
            'jam_selesai_operasi' => $akhir->jam_selesai_operasi,
            'hm_akhir' => $akhir->hm_akhir,
            'odo_anomali' => $akhir->odo_anomali,
        ];
    }

    private function pengisianPayload(ArmadaPengisianSolar $p): array
    {
        return [
            'id' => $p->id,
            'waktu' => $p->waktu,
            'tanggal' => $p->tanggal?->toDateString(),
            'odo_atau_hm' => $p->odo_atau_hm,
            'liter' => $p->liter,
            'nominal_rp' => $p->nominal_rp,
            'harga_per_liter' => $p->harga_per_liter,
            'foto_odo_url' => $p->foto_odo_url,
            'foto_nota_url' => $p->foto_nota_url,
            'catatan' => $p->catatan,
            'driver' => $p->karyawan?->nama,
        ];
    }

    /**
     * POST /api/mobile/armada/checklist/awal (multipart, idempotency).
     * Wajib: armada_id, items, stok_solar, foto_stok_solar (create), ODO/HM + foto.
     */
    public function submitChecklistAwal(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'items' => 'required|array|min:1',
            'items.*.bagian' => 'required|string|max:100',
            'items.*.kondisi' => 'required|in:baik,perlu_perhatian,rusak',
            'items.*.catatan' => 'nullable|string',
            'items.*.foto' => 'nullable|string',
            'stok_solar' => 'required|in:'.implode(',', StokSolar::values()),
            'foto_stok_solar' => 'nullable|image|max:5120',
            'foto_stok_solar_metadata' => 'nullable',
            'odo_pagi' => 'nullable|numeric|min:0',
            'foto_odo_pagi' => 'nullable|image|max:5120',
            'foto_odo_pagi_metadata' => 'nullable',
            'jam_mulai_operasi' => 'nullable|date_format:H:i',
            'hm_odo' => 'nullable|numeric|min:0',
            'client_uuid' => 'nullable|string|max:36',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        $armada = Armada::where('id', $validated['armada_id'])->firstOrFail();

        if (! $this->driverHolds($armada->id, $karyawan->id)) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        $today = now()->toDateString();
        $existing = $armada->checklists()->whereDate('tanggal', $today)->first();

        // Idempotency retry dengan client_uuid yang sama.
        if ($existing && ! empty($validated['client_uuid']) && $validated['client_uuid'] === $existing->client_uuid) {
            return $this->success(
                $this->checklistItemPayload($armada, $today, $existing, $armada->checklistAkhirs()->whereDate('tanggal', $today)->first(), collect(), $karyawan),
                'Checklist awal sudah pernah dikirim.'
            );
        }

        $fotoStok = $this->storeFoto($request->file('foto_stok_solar') ?? $validated['foto_stok_solar'] ?? null, 'armada/checklist');
        $fotoOdo = $this->storeFoto($request->file('foto_odo_pagi') ?? $validated['foto_odo_pagi'] ?? null, 'armada/checklist');

        if (! $existing) {
            if (! $fotoStok) {
                return $this->error('Foto indikator stok solar wajib diisi.', 422);
            }
            if (! $fotoOdo) {
                return $this->error($armada->tipe_unit === 'alat_berat' ? 'Foto HM wajib diisi.' : 'Foto ODO wajib diisi.', 422);
            }
        }

        try {
            $checklist = app(RecordChecklistAwalAction::class)->execute($armada, [
                'tanggal' => $today,
                'items' => $validated['items'],
                'stok_solar' => $validated['stok_solar'],
                'foto_stok_solar' => $fotoStok,
                'foto_stok_solar_metadata' => $this->decodeMetadata($validated['foto_stok_solar_metadata'] ?? null),
                'odo_pagi' => $validated['odo_pagi'] ?? null,
                'foto_odo_pagi' => $fotoOdo,
                'foto_odo_pagi_metadata' => $this->decodeMetadata($validated['foto_odo_pagi_metadata'] ?? null),
                'jam_mulai_operasi' => $validated['jam_mulai_operasi'] ?? null,
                'hm_odo' => $validated['hm_odo'] ?? null,
                'dicatat_oleh_karyawan_id' => $karyawan->id,
                'client_uuid' => $validated['client_uuid'] ?? null,
            ]);
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 423, $e->errors());
        }

        $akhir = $armada->checklistAkhirs()->whereDate('tanggal', $today)->first();

        return $this->success(
            $this->checklistItemPayload($armada, $today, $checklist, $akhir, collect(), $karyawan),
            'Checklist awal tersimpan.'
        );
    }

    /**
     * POST /api/mobile/armada/checklist/akhir (multipart). Final: submit kedua → 422.
     */
    public function submitChecklistAkhir(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'items' => 'required|array|min:1',
            'items.*.bagian' => 'required|string|max:100',
            'items.*.kondisi' => 'required|in:baik,perlu_perhatian,rusak',
            'items.*.catatan' => 'nullable|string',
            'items.*.foto' => 'nullable|string',
            'stok_solar' => 'required|in:'.implode(',', StokSolar::values()),
            'foto_stok_solar' => 'nullable|image|max:5120',
            'foto_stok_solar_metadata' => 'nullable',
            'odo_akhir' => 'nullable|numeric|min:0',
            'foto_odo_akhir' => 'nullable|image|max:5120',
            'foto_odo_akhir_metadata' => 'nullable',
            'jam_selesai_operasi' => 'nullable|date_format:H:i',
            'hm_akhir' => 'nullable|numeric|min:0',
            'client_uuid' => 'nullable|string|max:36',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        $armada = Armada::where('id', $validated['armada_id'])->firstOrFail();

        if (! $this->driverHolds($armada->id, $karyawan->id)) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        $fotoStok = $this->storeFoto($request->file('foto_stok_solar') ?? $validated['foto_stok_solar'] ?? null, 'armada/checklist');
        $fotoOdo = $this->storeFoto($request->file('foto_odo_akhir') ?? $validated['foto_odo_akhir'] ?? null, 'armada/checklist');

        if (! $fotoStok) {
            return $this->error('Foto indikator stok solar wajib diisi.', 422);
        }
        if (! $fotoOdo) {
            return $this->error($armada->tipe_unit === 'alat_berat' ? 'Foto HM wajib diisi.' : 'Foto ODO wajib diisi.', 422);
        }

        try {
            $akhir = app(RecordChecklistAkhirAction::class)->execute($armada, [
                'tanggal' => now()->toDateString(),
                'items' => $validated['items'],
                'stok_solar' => $validated['stok_solar'],
                'foto_stok_solar' => $fotoStok,
                'foto_stok_solar_metadata' => $this->decodeMetadata($validated['foto_stok_solar_metadata'] ?? null),
                'odo_akhir' => $validated['odo_akhir'] ?? null,
                'foto_odo_akhir' => $fotoOdo,
                'foto_odo_akhir_metadata' => $this->decodeMetadata($validated['foto_odo_akhir_metadata'] ?? null),
                'jam_selesai_operasi' => $validated['jam_selesai_operasi'] ?? null,
                'hm_akhir' => $validated['hm_akhir'] ?? null,
                'dicatat_oleh_karyawan_id' => $karyawan->id,
                'client_uuid' => $validated['client_uuid'] ?? null,
            ]);
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }

        $awal = $armada->checklists()->whereDate('tanggal', now()->toDateString())->first();

        return $this->success(
            $this->checklistItemPayload($armada, now()->toDateString(), $awal, $akhir, collect(), $karyawan),
            'Checklist akhir tersimpan.'
        );
    }

    /**
     * GET /api/mobile/armada/pengisian-solar?armada_id=&tanggal=
     */
    public function indexPengisianSolar(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'nullable|string|exists:armadas,id',
            'tanggal' => 'nullable|date',
        ]);

        $armadaIds = $this->activeArmadas($request)->pluck('id')->all();

        $query = ArmadaPengisianSolar::with('karyawan')->whereIn('armada_id', $armadaIds);

        if (! empty($validated['armada_id'])) {
            $query->where('armada_id', $validated['armada_id']);
        }
        if (! empty($validated['tanggal'])) {
            $query->whereDate('tanggal', $validated['tanggal']);
        }

        $items = $query->orderByDesc('tanggal')->orderByDesc('waktu')
            ->get()
            ->map(fn (ArmadaPengisianSolar $p) => $this->pengisianPayload($p))
            ->values();

        return $this->success(['items' => $items], 'Riwayat pengisian solar.');
    }

    /**
     * POST /api/mobile/armada/pengisian-solar (multipart, idempotency).
     */
    public function storePengisianSolar(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'tanggal' => 'nullable|date|before_or_equal:today',
            'odo_atau_hm' => 'required|numeric|min:0',
            'liter' => 'required|numeric|min:0.01',
            'nominal_rp' => 'required|numeric|min:0.01',
            'foto_odo' => 'nullable|image|max:5120',
            'foto_odo_metadata' => 'nullable',
            'foto_nota' => 'nullable|image|max:5120',
            'foto_nota_metadata' => 'nullable',
            'catatan' => 'nullable|string|max:1000',
            'client_uuid' => 'required|string|max:36',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        $armada = Armada::where('id', $validated['armada_id'])->firstOrFail();

        if (! $this->driverHolds($armada->id, $karyawan->id)) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        // Idempotency.
        if ($existing = ArmadaPengisianSolar::where('client_uuid', $validated['client_uuid'])->first()) {
            return $this->success($this->pengisianPayload($existing), 'Pengisian solar sudah pernah dikirim.');
        }

        $fotoOdo = $this->storeFoto($request->file('foto_odo') ?? $validated['foto_odo'] ?? null, 'armada/solar');
        $fotoNota = $this->storeFoto($request->file('foto_nota') ?? $validated['foto_nota'] ?? null, 'armada/solar');

        if (! $fotoOdo) {
            return $this->error('Foto ODO saat isi wajib diisi.', 422);
        }
        if (! $fotoNota) {
            return $this->error('Foto nota wajib diisi.', 422);
        }

        $pengisian = app(RecordPengisianSolarAction::class)->execute($armada, [
            'tanggal' => $validated['tanggal'] ?? now()->toDateString(),
            'odo_atau_hm' => $validated['odo_atau_hm'],
            'liter' => $validated['liter'],
            'nominal_rp' => $validated['nominal_rp'],
            'foto_odo' => $fotoOdo,
            'foto_odo_metadata' => $this->decodeMetadata($validated['foto_odo_metadata'] ?? null),
            'foto_nota' => $fotoNota,
            'foto_nota_metadata' => $this->decodeMetadata($validated['foto_nota_metadata'] ?? null),
            'catatan' => $validated['catatan'] ?? null,
            'karyawan_id' => $karyawan->id,
            'dicatat_oleh' => $request->user()->id,
            'client_uuid' => $validated['client_uuid'],
        ]);

        return $this->success(
            array_merge($this->pengisianPayload($pengisian), [
                'peringatan' => $this->odoAwalWarning($armada, (float) $validated['odo_atau_hm']),
            ]),
            'Pengisian solar tersimpan.'
        );
    }

    /**
     * POST /api/mobile/armada/pengisian-solar/{pengisianSolar} (update).
     */
    public function updatePengisianSolar(Request $request, ArmadaPengisianSolar $pengisianSolar)
    {
        $validated = $request->validate([
            'tanggal' => 'nullable|date|before_or_equal:today',
            'odo_atau_hm' => 'nullable|numeric|min:0',
            'liter' => 'nullable|numeric|min:0.01',
            'nominal_rp' => 'nullable|numeric|min:0.01',
            'foto_odo' => 'nullable|image|max:5120',
            'foto_odo_metadata' => 'nullable',
            'foto_nota' => 'nullable|image|max:5120',
            'foto_nota_metadata' => 'nullable',
            'catatan' => 'nullable|string|max:1000',
            'client_uuid' => 'required|string|max:36',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        if (! $this->driverHolds($pengisianSolar->armada_id, $karyawan->id)) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        $fotoOdo = $this->storeFoto($request->file('foto_odo') ?? $validated['foto_odo'] ?? null, 'armada/solar');
        $fotoNota = $this->storeFoto($request->file('foto_nota') ?? $validated['foto_nota'] ?? null, 'armada/solar');

        $pengisian = app(RecordPengisianSolarAction::class)->update($pengisianSolar, [
            'tanggal' => $validated['tanggal'] ?? null,
            'odo_atau_hm' => $validated['odo_atau_hm'] ?? null,
            'liter' => $validated['liter'] ?? null,
            'nominal_rp' => $validated['nominal_rp'] ?? null,
            'foto_odo' => $fotoOdo,
            'foto_odo_metadata' => $this->decodeMetadata($validated['foto_odo_metadata'] ?? null),
            'foto_nota' => $fotoNota,
            'foto_nota_metadata' => $this->decodeMetadata($validated['foto_nota_metadata'] ?? null),
            'catatan' => $validated['catatan'] ?? null,
            'client_uuid' => $validated['client_uuid'],
        ]);

        return $this->success($this->pengisianPayload($pengisian), 'Pengisian solar diperbarui.');
    }

    /**
     * DELETE /api/mobile/armada/pengisian-solar/{pengisianSolar}
     */
    public function deletePengisianSolar(Request $request, ArmadaPengisianSolar $pengisianSolar)
    {
        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        if (! $this->driverHolds($pengisianSolar->armada_id, $karyawan->id)) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        app(RecordPengisianSolarAction::class)->delete($pengisianSolar);

        return $this->success(['id' => $pengisianSolar->id], 'Pengisian solar dihapus.');
    }

    /**
     * Peringatan non-blocking bila ODO pengisian lebih kecil dari ODO awal hari itu.
     */
    private function odoAwalWarning(Armada $armada, float $odo): ?string
    {
        $awal = $armada->checklists()->whereDate('tanggal', now()->toDateString())->first();
        $pembanding = $awal?->odo_pagi ?? $awal?->hm_odo;

        if ($pembanding !== null && $odo < (float) $pembanding) {
            return 'ODO/HM pengisian lebih kecil dari ODO awal hari ini.';
        }

        return null;
    }

    private function driverHolds(string $armadaId, string $karyawanId): bool
    {
        return ArmadaDriver::where('armada_id', $armadaId)
            ->where('karyawan_id', $karyawanId)
            ->where('status', 'aktif')
            ->exists();
    }

    /**
     * POST /api/mobile/armada/odo-awal-proyek
     * Catat ODO awal armada di sebuah proyek (sekali per armada x proyek).
     */
    public function storeOdoAwalProyek(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'proyek_id' => 'nullable|string|exists:proyeks,id',
            'titik_id' => 'nullable|string|exists:titiks,id',
            'odo_awal' => 'required|numeric|min:0',
            'jarak_ke_pusat_km' => 'nullable|numeric|min:0',
            'tanggal' => 'nullable|date|before_or_equal:today',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        $held = ArmadaDriver::where('armada_id', $validated['armada_id'])
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->exists();

        if (! $held) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        $armada = Armada::with('titik.proyek')->where('id', $validated['armada_id'])->firstOrFail();

        $proyek = null;
        if (! empty($validated['proyek_id'])) {
            $proyek = Proyek::find($validated['proyek_id']);
        } elseif (! empty($validated['titik_id'])) {
            $proyek = \App\Domain\Core\Models\Titik::with('proyek')->find($validated['titik_id'])?->proyek;
        }

        if (! $proyek) {
            $proyek = $armada->titik?->proyek;
        }

        if (! $proyek) {
            $proyek = Proyek::first();
        }

        if (! $proyek) {
            return $this->error('Proyek untuk armada ini belum ditentukan.', 422);
        }

        try {
            $odo = app(RecordOdoAwalProyekAction::class)->execute($armada, $proyek, [
                'odo_awal' => $validated['odo_awal'],
                'jarak_ke_pusat_km' => $validated['jarak_ke_pusat_km'] ?? null,
                'dicatat_oleh_karyawan_id' => $karyawan->id,
                'tanggal' => $validated['tanggal'] ?? now()->toDateString(),
            ]);
        } catch (ValidationException $e) {
            return $this->error('ODO awal proyek untuk armada ini sudah pernah dicatat.', 422, $e->errors());
        }

        return $this->success([
            'id' => $odo->id,
            'armada_id' => $odo->armada_id,
            'proyek_id' => $odo->proyek_id,
            'odo_awal' => (float) $odo->odo_awal,
            'jarak_ke_pusat_km' => $odo->jarak_ke_pusat_km !== null ? (float) $odo->jarak_ke_pusat_km : null,
            'tanggal' => $odo->tanggal->toDateString(),
        ], 'ODO awal proyek tersimpan.');
    }

    /**
     * GET /api/mobile/armada/odo-awal-proyek?armada_id=
     * Riwayat ODO awal proyek (1 baris per armada x proyek).
     */
    public function indexOdoAwalProyek(Request $request)
    {
        $request->validate([
            'armada_id' => 'nullable|string|exists:armadas,id',
        ]);

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->success(['items' => []]);
        }

        $query = ArmadaOdoAwalProyek::with(['armada', 'proyek'])
            ->whereIn('armada_id', $this->activeArmadas($request)->pluck('id'));

        if (! empty($request->input('armada_id'))) {
            $query->where('armada_id', $request->input('armada_id'));
        }

        $items = $query->orderByDesc('created_at')->get()->map(fn (ArmadaOdoAwalProyek $odo) => [
            'id' => $odo->id,
            'armada_id' => $odo->armada_id,
            'armada_plat' => $odo->armada?->plat_nomor,
            'proyek_id' => $odo->proyek_id,
            'proyek_nama' => $odo->proyek?->nama,
            'odo_awal' => (float) $odo->odo_awal,
            'jarak_ke_pusat_km' => $odo->jarak_ke_pusat_km !== null ? (float) $odo->jarak_ke_pusat_km : null,
            'tanggal' => $odo->tanggal->toDateString(),
        ]);

        return $this->success(['items' => $items], 'Riwayat ODO awal proyek.');
    }

    /**
     * GET /api/mobile/armada/helper
     * Daftar helper milik PIC yang login (Bagian 21.6). Visibility object-level:
     * helper muncul kalau armada-nya dipegang PIC user ini, atau user adalah creator-nya.
     */
    public function indexHelper(Request $request)
    {
        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->success(['items' => []]);
        }

        $heldArmadaIds = collect(\App\Support\ArmadaOwnership::heldIds($request->user()));

        $today = now()->toDateString();

        $helpers = HelperArmada::with([
            'armada',
            'presensis' => fn ($q) => $q->whereDate('tanggal', $today),
        ])
            ->where('status', 'aktif')
            ->whereDate('durasi_mulai', '<=', $today)
            ->where(fn ($q) => $q->whereNull('durasi_selesai')->orWhereDate('durasi_selesai', '>=', $today))
            ->where(function ($q) use ($heldArmadaIds, $request) {
                $q->whereIn('armada_id', $heldArmadaIds)
                    ->orWhere('created_by', $request->user()->id);
            })
            ->latest('durasi_mulai')
            ->get();

        $items = $helpers->map(fn (HelperArmada $h) => [
            'id' => $h->id,
            'armada_id' => $h->armada_id,
            'armada_plat' => $h->armada?->plat_nomor,
            'nama' => $h->nama,
            'no_hp' => $h->no_hp,
            'foto' => $h->foto,
            'honor' => (float) $h->honor,
            'durasi_mulai' => $h->durasi_mulai?->toDateString(),
            'durasi_selesai' => $h->durasi_selesai?->toDateString(),
            'status' => $h->status,
            'presensi_hari_ini' => $h->presensis->first() ? [
                'tanggal' => $h->presensis->first()->tanggal->toDateString(),
                'check_in' => $h->presensis->first()->check_in?->format('H:i:s'),
                'foto_check_in' => $h->presensis->first()->foto_check_in,
                'check_out' => $h->presensis->first()->check_out?->format('H:i:s'),
                'foto_check_out' => $h->presensis->first()->foto_check_out,
            ] : null,
        ]);

        return $this->success(['items' => $items], 'Helper milik PIC.');
    }

    /**
     * POST /api/mobile/armada/helper/{helper}/presensi
     * PIC mengabsenkan helper (check-in / check-out + foto). Helper tidak punya akun.
     */
    public function storeHelperPresensi(Request $request, HelperArmada $helper)
    {
        $this->authorize('presensi', $helper);

        $validated = $request->validate([
            'tipe' => 'required|in:check_in,check_out',
            'tanggal' => 'nullable|date|before_or_equal:today',
            'foto' => 'required|image|max:5120',
        ]);

        $foto = $this->storeFoto($request->file('foto') ?? $validated['foto'] ?? null);
        if (! $foto) {
            return $this->error('Foto presensi helper wajib diisi.', 422);
        }

        try {
            $presensi = app(RecordHelperPresensiAction::class)->execute($helper, $request->user(), [
                'tipe' => $validated['tipe'],
                'tanggal' => $validated['tanggal'] ?? now()->toDateString(),
                'foto' => $foto,
            ]);
        } catch (ValidationException $e) {
            return $this->error('Presensi helper ditolak.', 422, $e->errors());
        }

        return $this->success([
            'id' => $presensi->id,
            'helper_armada_id' => $presensi->helper_armada_id,
            'tanggal' => $presensi->tanggal->toDateString(),
            'check_in' => $presensi->check_in?->format('H:i:s'),
            'foto_check_in' => $presensi->foto_check_in,
            'check_out' => $presensi->check_out?->format('H:i:s'),
            'foto_check_out' => $presensi->foto_check_out,
            'dicatat_oleh' => $presensi->dicatat_oleh,
        ], 'Presensi helper tersimpan.');
    }

    /**
     * POST /api/mobile/armada/checklist-major
     * Mencatat Checklist Major (Serah Terima Kendaraan / Sewa Alat) - Bagian 21.10.
     */
    public function submitChecklistMajor(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'tipe' => 'nullable|in:berangkat,kembali',
            'odo_atau_hm' => 'nullable|numeric|min:0',
            'tanggal' => 'nullable|date',
            'catatan' => 'nullable|string|max:2000',
            'ditandatangani_oleh' => 'nullable|string|max:255',
            'items' => 'nullable',
            'photos' => 'nullable|array',
            'foto_kondisi' => 'nullable|array',
        ]);

        $armada = Armada::with('titik.proyek')->where('id', $validated['armada_id'])->firstOrFail();

        // Cari atau buat transaksi sewa aktif/terkini untuk armada ini
        $sewa = SewaAlatJam::where('armada_id', $armada->id)->latest('tanggal')->first();
        if (! $sewa) {
            $sewa = SewaAlatJam::create([
                'armada_id' => $armada->id,
                'tipe_sewa' => 'internal',
                'penyewa_nama' => 'Internal / Proyek ' . ($armada->titik?->proyek?->nama ?? 'SBPS'),
                'penyewa_pt' => 'SBPS Corp',
                'penyewa_alamat' => $armada->titik?->alamat ?? 'Lokasi Proyek',
                'penyewa_penanggung_jawab' => $request->user()?->name ?? 'Driver',
                'penyewa_no_hp' => $request->user()?->phone ?? '08',
                'harga_per_jam_snapshot' => 0,
                'status' => 'disetujui',
                'tanggal' => $validated['tanggal'] ?? now()->toDateString(),
                'hm_awal' => $validated['odo_atau_hm'] ?? 0,
                'hm_akhir' => $validated['odo_atau_hm'] ?? 0,
                'jumlah_jam' => 0,
            ]);
        }

        // Upload foto kondisi
        $fotoPaths = [];
        $uploadedPhotos = $request->file('photos') ?? $request->file('foto_kondisi') ?? [];
        if (is_array($uploadedPhotos)) {
            foreach ($uploadedPhotos as $photo) {
                if ($photo && method_exists($photo, 'store')) {
                    $fotoPaths[] = $photo->store('armada/serah-terima/'.now()->format('Y/m'), 'public');
                }
            }
        }

        // Parse items
        $rawItems = $request->input('items', []);
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            if (is_array($decoded)) {
                $rawItems = $decoded;
            }
        }

        $items = [];
        if (is_array($rawItems)) {
            foreach ($rawItems as $idx => $item) {
                if (is_array($item)) {
                    $label = $item['label'] ?? $item['item'] ?? ('Item ' . ($idx + 1));
                    $status = $item['status'] ?? $item['kondisi'] ?? 'baik';
                    $catatanItem = $item['catatan'] ?? null;
                    $items[] = [
                        'item' => $label,
                        'kondisi' => ($status === 'baik' ? 'baik' : 'rusak'),
                        'catatan' => $catatanItem,
                    ];
                }
            }
        }

        $tipe = $validated['tipe'] ?? 'berangkat';

        $checklist = app(RecordChecklistSerahTerimaAction::class)->execute($sewa, $tipe, [
            'odo_atau_hm' => $validated['odo_atau_hm'] ?? null,
            'tanggal' => $validated['tanggal'] ?? now()->toDateString(),
            'catatan' => $validated['catatan'] ?? null,
            'ditandatangani_oleh' => $validated['ditandatangani_oleh'] ?? null,
            'items' => $items,
            'foto_kondisi' => $fotoPaths,
        ], $request->user());

        return $this->success([
            'id' => $checklist->id,
            'armada_id' => $checklist->armada_id,
            'sewa_alat_jam_id' => $checklist->sewa_alat_jam_id,
            'tipe' => $checklist->tipe,
            'tanggal' => $checklist->tanggal?->toDateString(),
            'odo_atau_hm' => $checklist->odo_atau_hm,
            'catatan' => $checklist->catatan,
            'items_count' => $checklist->details->count(),
            'items' => $checklist->details->map(fn ($d) => [
                'id' => $d->id,
                'item' => $d->item,
                'kondisi' => $d->kondisi,
                'catatan' => $d->catatan,
            ]),
        ], 'Checklist major serah terima berhasil disimpan.');
    }

    /**
     * Simpan foto dari upload file (multipart). Path string TIDAK lagi
     * diterima — semua foto armada wajib berupa upload file (Bagian 4).
     */
    private function storeFoto($file, string $prefix = 'foto/checklist'): ?string
    {
        if ($file !== null && method_exists($file, 'store')) {
            return $file->store($prefix.'/'.now()->format('Y/m'), 'public');
        }

        return null;
    }

    /**
     * Terima metadata foto sebagai array atau JSON string (multipart).
     */
    private function decodeMetadata($value): ?array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : null;
        }

        return null;
    }
}

