<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Actions\RecordChecklistHarianAction;
use App\Domain\Fleet\Actions\RecordHelperPresensiAction;
use App\Domain\Fleet\Actions\RecordOdoAwalProyekAction;
use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Domain\Fleet\Models\HelperArmada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Core\Models\Proyek;
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
        $items = $this->activeArmadas($request)->values()->map(function (Armada $a) {
            $latestChecklist = ArmadaChecklistHarian::where('checkable_type', Armada::class)
                ->where('checkable_id', $a->id)
                ->latest('tanggal')
                ->first();
            $latestOdo = $latestChecklist ? ($latestChecklist->odo_sore ?? $latestChecklist->odo_pagi) : null;
            if ($latestOdo === null) {
                $odoAwal = ArmadaOdoAwalProyek::where('armada_id', $a->id)->latest('tanggal')->first();
                $latestOdo = $odoAwal ? (float) $odoAwal->odo_awal : null;
            }

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
                'jam_operasional_terkini' => $latestChecklist ? (float) $latestChecklist->hm_odo : null,
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
        $armadas = $this->activeArmadas($request);

        $items = $armadas->map(function (Armada $a) use ($today) {
            $checklist = ArmadaChecklistHarian::where('checkable_type', Armada::class)
                ->where('checkable_id', $a->id)
                ->whereDate('tanggal', $today)
                ->first();

            return $this->checklistPayload($a, $today, $checklist);
        })->values();

        return $this->success(['items' => $items], 'Checklist harian armada.');
    }

    private function checklistPayload(Armada $a, string $tanggal, ?ArmadaChecklistHarian $checklist): array
    {
        return [
            'armada_id' => $a->id,
            'plat_nomor' => $a->plat_nomor,
            'kode_unit' => $a->kode_unit,
            'jenis' => $a->jenis,
            'tipe_unit' => $a->tipe_unit,
            'tanggal' => $tanggal,
            'sudah_isi' => $checklist !== null,
            'checklist_id' => $checklist?->id,
            'status' => $checklist?->status ?? 'berjalan',
            'kondisi_baik' => $checklist?->kondisi_baik,
            'item_bermasalah' => $checklist?->item_bermasalah,
            'solar_liter' => $checklist ? (float) $checklist->solar_liter : null,
            'solar_harga_rp' => $checklist ? (float) $checklist->solar_harga_rp : null,
            'odo_pagi' => $checklist ? (float) $checklist->odo_pagi : null,
            'foto_odo_pagi' => $checklist?->foto_odo_pagi,
            'odo_sore' => $checklist ? (float) $checklist->odo_sore : null,
            'foto_odo_sore' => $checklist?->foto_odo_sore,
            'jam_mulai_operasi' => $checklist?->jam_mulai_operasi,
            'jam_selesai_operasi' => $checklist?->jam_selesai_operasi,
            'hm_odo' => $checklist ? (float) $checklist->hm_odo : null,
            'odo_anomali' => (bool) ($checklist?->odo_anomali ?? false),
        ];
    }

    /**
     * POST /api/mobile/armada/checklist
     * Mencatat (create/update) checklist satu armada untuk hari ini (2-stage:
     * pagi = odo_pagi/jam_mulai; sore = odo_sore/jam_selesai). Idempoten via
     * (armada_id, tanggal) dan option client_uuid.
     */
    public function submitChecklist(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string|max:1000',
            'status' => 'nullable|in:berjalan,selesai',
            'solar_liter' => 'nullable|numeric|min:0',
            'solar_harga_rp' => 'nullable|numeric|min:0',
            'odo_pagi' => 'nullable|numeric|min:0',
            'foto_odo_pagi' => 'nullable',
            'odo_sore' => 'nullable|numeric|min:0',
            'foto_odo_sore' => 'nullable',
            'jam_mulai_operasi' => 'nullable|date_format:H:i',
            'jam_selesai_operasi' => 'nullable|date_format:H:i',
            'hm_odo' => 'nullable|numeric|min:0',
            'client_uuid' => 'nullable|string|max:36',
        ]);

        // Idempotency by client_uuid
        if (! empty($validated['client_uuid'])) {
            $existingByUuid = ArmadaChecklistHarian::where('client_uuid', $validated['client_uuid'])->first();
            if ($existingByUuid) {
                return $this->success([
                    'checklist_id' => $existingByUuid->id,
                    'armada_id' => $existingByUuid->checkable_id,
                    'tanggal' => $existingByUuid->tanggal->toDateString(),
                    'sudah_ada' => true,
                ], 'Checklist sudah pernah dikirim.');
            }
        }

        $karyawan = $this->currentKaryawan($request);
        if (! $karyawan) {
            return $this->error('Akun tidak terhubung ke data karyawan.', 403);
        }

        $armada = Armada::where('id', $validated['armada_id'])->firstOrFail();

        // Pastikan armada benar-benar dipegang driver saat ini.
        $held = ArmadaDriver::where('armada_id', $validated['armada_id'])
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->exists();

        if (! $held) {
            return $this->error('Armada bukan milik driver ini.', 403);
        }

        $today = now()->toDateString();

        $checklist = app(RecordChecklistHarianAction::class)->execute($armada, [
            'tanggal' => $today,
            'kondisi_baik' => (bool) $validated['kondisi_baik'],
            'item_bermasalah' => $validated['item_bermasalah'] ?? null,
            'dicatat_oleh_karyawan_id' => $karyawan->id,
            'dicatat_oleh' => $request->user()->id,
            'status' => $validated['status'] ?? null,
            'solar_liter' => $validated['solar_liter'] ?? null,
            'solar_harga_rp' => $validated['solar_harga_rp'] ?? null,
            'odo_pagi' => $validated['odo_pagi'] ?? null,
            'foto_odo_pagi' => $this->storeFoto($request->file('foto_odo_pagi') ?? $validated['foto_odo_pagi'] ?? null),
            'odo_sore' => $validated['odo_sore'] ?? null,
            'foto_odo_sore' => $this->storeFoto($request->file('foto_odo_sore') ?? $validated['foto_odo_sore'] ?? null),
            'jam_mulai_operasi' => $validated['jam_mulai_operasi'] ?? null,
            'jam_selesai_operasi' => $validated['jam_selesai_operasi'] ?? null,
            'hm_odo' => $validated['hm_odo'] ?? null,
            'client_uuid' => $validated['client_uuid'] ?? null,
        ]);

        return $this->success($this->checklistPayload($armada, $today, $checklist), 'Checklist harian tersimpan.');
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

        $picArmadaIds = ArmadaPenanggungJawab::where('karyawan_id', $karyawan->id)
            ->whereNull('sampai')
            ->pluck('armada_id');

        $today = now()->toDateString();

        $helpers = HelperArmada::with([
            'armada',
            'presensis' => fn ($q) => $q->whereDate('tanggal', $today),
        ])
            ->whereIn('armada_id', $picArmadaIds)
            ->orWhere('created_by', $request->user()->id)
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
        $validated = $request->validate([
            'tipe' => 'required|in:check_in,check_out',
            'tanggal' => 'nullable|date|before_or_equal:today',
            'foto' => 'required',
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

    private function storeFoto($file): ?string
    {
        if (is_string($file) && $file !== '') {
            return $file;
        }

        if ($file !== null && method_exists($file, 'store')) {
            return $file->store('foto/checklist/'.now()->format('Y/m'), 'public');
        }

        return null;
    }
}
