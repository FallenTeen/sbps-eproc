<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\AssignDriverToArmadaAction;
use App\Domain\Fleet\Actions\EndDowntimeAction;
use App\Domain\Fleet\Actions\RecordBBMAction;
use App\Domain\Fleet\Actions\RecordChecklistHarianAction;
use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Actions\RecordServiceHistoryAction;
use App\Domain\Fleet\Actions\RecordSewaAlatJamAction;
use App\Domain\Fleet\Actions\StartDowntimeAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArmadaController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Armada::class);

        $query = Armada::with(['unitBisnis', 'titik', 'currentDriver.karyawan']);

        if (! $request->user()->hasRole('Owner')) {
            $gcs = UnitBisnis::where('kode', 'GCS')->first();
            $unitId = $request->user()->unit_bisnis_id ?? $gcs?->id;
            if ($unitId) {
                $query->where('unit_bisnis_id', $unitId);
            }
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('jenis') && $request->jenis) {
            $query->where('jenis', $request->jenis);
        }

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('kode_unit', 'like', '%'.$request->search.'%')
                    ->orWhere('plat_nomor', 'like', '%'.$request->search.'%');
            });
        }

        $armadas = $query->paginate(15)->withQueryString();

        return Inertia::render('Fleet/Armada/Index', [
            'armadas' => $armadas,
            'filters' => $request->only(['status', 'jenis', 'search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Armada::class);

        $user = auth()->user();
        $unitBisnisQuery = UnitBisnis::aktif();
        if ($user->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $user->unit_bisnis_id);
        }
        $unitBisnis = $unitBisnisQuery->get();
        $titiksQuery = Titik::aktif();
        if ($user->unit_bisnis_id) {
            $titiksQuery->whereHas('proyek', fn ($q) => $q->where('unit_bisnis_id', $user->unit_bisnis_id));
        }
        $titiks = $titiksQuery->get();
        $drivers = Karyawan::aktif()->where('tipe', '!=', 'borongan_rit')->get();

        return Inertia::render('Fleet/Armada/Create', [
            'unitBisnis' => $unitBisnis,
            'titiks' => $titiks,
            'drivers' => $drivers,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Armada::class);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'plat_nomor' => 'required|unique:armadas',
            'kode_unit' => 'required|unique:armadas',
            'jenis' => 'required|in:dump_truck,alat_berat,truck_molen,lainnya',
'tipe_unit' => 'nullable|in:armada_jalan,alat_berat',
            'model_tarif' => 'required|in:ritase,sewa_jam,internal',
            'tahun' => 'nullable|integer',
            'kapasitas' => 'nullable|string',
            'status' => 'nullable|in:aktif,servis,nonaktif',
            'titik_id' => 'nullable|exists:titiks,id',
            'tanggal_mulai_pakai' => 'nullable|date',
        ]);
        Armada::create($validated);

        return redirect()->route('fleet.armada.index')->with('success', 'Armada berhasil ditambahkan.');
    }

    public function show(Armada $armada)
    {
        $this->authorize('view', $armada);

        $armada->load([
            'unitBisnis',
            'titik',
            'serviceHistories',
            'checklists' => fn ($q) => $q->with('dicatatOleh')->latest('tanggal')->limit(30),
            'bbmLogs' => fn ($q) => $q->latest('tanggal')->limit(30),
            'downtimes' => fn ($q) => $q->latest('mulai')->limit(10),
            'ritases' => fn ($q) => $q->with(['driver', 'ruteTarif', 'biayaLain'])->latest('tanggal')->limit(50),
            'sewaAlatJams' => fn ($q) => $q->with('proyek')->latest('tanggal')->limit(50),
            'driverAssignments' => fn ($q) => $q->with('karyawan')->latest('tanggal_mulai'),
        ]);

        $user = auth()->user();
        $proyeksQuery = Proyek::aktif();
        if ($user->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $titiksQuery = Titik::aktif();
        if ($user->unit_bisnis_id) {
            $titiksQuery->whereHas('proyek', fn ($q) => $q->where('unit_bisnis_id', $user->unit_bisnis_id));
        }

        $canRecordRitase = $user->can('recordRitase', $armada);
        $canRecordSewa = $user->can('recordSewa', $armada);
        $canUpdate = $user->can('update', $armada);

        return Inertia::render('Fleet/Armada/Show', [
            'armada' => $armada,
            'options' => [
                'drivers' => Karyawan::aktif()->where('tipe', '!=', 'borongan_rit')->get(['id', 'nama', 'jabatan']),
                'proyeks' => $proyeksQuery->get(['id', 'nama', 'kode_proyek']),
                'ruteTarifs' => RuteTarif::aktif()->get(['id', 'lokasi_asal', 'lokasi_tujuan', 'tarif_per_rit']),
                'titiks' => $titiksQuery->get(['id', 'nama']),
            ],
            'can' => [
                'recordRitase' => $canRecordRitase,
                'recordSewa' => $canRecordSewa,
                'update' => $canUpdate,
                'recordService' => $canUpdate,
                'recordChecklist' => $canUpdate,
                'recordBbm' => $canUpdate,
                'startDowntime' => $canUpdate,
                'assignDriver' => $canUpdate,
            ],
        ]);
    }

    public function edit(Armada $armada)
    {
        $this->authorize('update', $armada);

        $user = auth()->user();
        $unitBisnisQuery = UnitBisnis::aktif();
        if ($user->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $user->unit_bisnis_id);
        }
        $unitBisnis = $unitBisnisQuery->get();
        $titiksQuery = Titik::aktif();
        if ($user->unit_bisnis_id) {
            $titiksQuery->whereHas('proyek', fn ($q) => $q->where('unit_bisnis_id', $user->unit_bisnis_id));
        }
        $titiks = $titiksQuery->get();

        return Inertia::render('Fleet/Armada/Edit', [
            'armada' => $armada,
            'unitBisnis' => $unitBisnis,
            'titiks' => $titiks,
        ]);
    }

    public function update(Request $request, Armada $armada)
    {
        $this->authorize('update', $armada);

        $validated = $request->validate([
            'plat_nomor' => 'required|unique:armadas,plat_nomor,'.$armada->id,
            'kode_unit' => 'required|unique:armadas,kode_unit,'.$armada->id,
            'jenis' => 'required|in:dump_truck,alat_berat,truck_molen,lainnya',
'tipe_unit' => 'nullable|in:armada_jalan,alat_berat',
            'model_tarif' => 'required|in:ritase,sewa_jam,internal',
            'tahun' => 'nullable|integer',
            'kapasitas' => 'nullable|string',
            'status' => 'nullable|in:aktif,servis,nonaktif',
            'titik_id' => 'nullable|exists:titiks,id',
            'tanggal_mulai_pakai' => 'nullable|date',
        ]);
        $armada->update($validated);

        return redirect()->route('fleet.armada.index')->with('success', 'Armada diperbarui.');
    }

    public function destroy(Armada $armada)
    {
        $this->authorize('delete', $armada);

        $armada->delete();

        return redirect()->route('fleet.armada.index')->with('success', 'Armada dihapus.');
    }

    public function recordRitase(Request $request, Armada $armada)
    {
        $this->authorize('recordRitase', $armada);

        $data = $request->validate([
            'driver_karyawan_id' => 'required|exists:karyawans,id',
            'tanggal' => 'required|date',
            'rute_tarif_id' => 'nullable|exists:rute_tarifs,id',
            'kategori' => 'nullable|string',
            'material' => 'nullable|string',
            'jumlah_rit' => 'required|integer|min:1',
            'satuan_volume' => 'required|in:tonase,ritase,m3,harian',
            'jumlah_volume' => 'nullable|numeric|min:0',
            'tarif_per_rit_snapshot' => 'nullable|numeric|min:0',
            'nominal' => 'nullable|numeric|min:0',
            'proyek_id' => 'nullable|exists:proyeks,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'customer' => 'nullable|string',
            'catatan' => 'nullable|string',
            'biaya_lain' => 'nullable|array',
            'biaya_lain.*.jenis' => 'required|in:bbm,upah_kenek,uang_makan,insentif,standby,lainnya',
            'biaya_lain.*.jumlah' => 'required|numeric|min:0',
            'biaya_lain.*.catatan' => 'nullable|string',
        ]);
        $data['armada_id'] = $armada->id;
        $ritase = (new RecordRitaseAction)->execute($data);

        return back()->with('success', "Ritase dicatat: {$ritase->jumlah_rit} rit");
    }

    public function recordSewa(Request $request, Armada $armada)
    {
        $this->authorize('recordSewa', $armada);

        $data = $request->validate([
            'tipe_sewa' => 'required|in:internal,eksternal',
            'proyek_id' => 'nullable|exists:proyeks,id',
            'penyewa_eksternal' => 'nullable|string',
            'penyewa_nama' => 'nullable|string',
            'penyewa_pt' => 'nullable|string',
            'penyewa_alamat' => 'nullable|string',
            'penyewa_penanggung_jawab' => 'nullable|string',
            'penyewa_no_hp' => 'nullable|string',
            'lokasi_pekerjaan' => 'nullable|string',
            'harga_per_jam_snapshot' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'hm_awal' => 'nullable|numeric|min:0',
            'hm_akhir' => 'nullable|numeric|min:0',
            'jumlah_jam' => 'required|numeric|min:0.1',
            'catatan' => 'nullable|string',
        ]);
        $data['armada_id'] = $armada->id;
        $sewa = (new RecordSewaAlatJamAction)->execute($data);

        return back()->with('success', "Sewa alat dicatat: {$sewa->jumlah_jam} jam");
    }

    public function recordService(Request $request, Armada $armada)
    {
        $this->authorize('recordService', $armada);

        $data = $request->validate([
            'tanggal' => 'required|date',
            'jenis_servis' => 'nullable|string',
            'biaya' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);
        $service = (new RecordServiceHistoryAction)->execute($armada, $data);

        return back()->with('success', 'Servis dicatat.');
    }

    public function recordChecklist(Request $request, Armada $armada)
    {
        $this->authorize('recordChecklist', $armada);

        $data = $request->validate([
            'tanggal' => 'required|date',
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string',
            'dicatat_oleh_karyawan_id' => 'required|exists:karyawans,id',
            'status' => 'nullable|in:berjalan,selesai',
            'solar_liter' => 'nullable|numeric|min:0',
            'solar_harga_rp' => 'nullable|numeric|min:0',
            'odo_pagi' => 'nullable|numeric|min:0',
            'foto_odo_pagi' => 'nullable|string',
            'odo_sore' => 'nullable|numeric|min:0',
            'foto_odo_sore' => 'nullable|string',
            'jam_mulai_operasi' => 'nullable|date_format:H:i',
            'jam_selesai_operasi' => 'nullable|date_format:H:i',
            'hm_odo' => 'nullable|numeric|min:0',
            'client_uuid' => 'nullable|string|max:36',
        ]);
        (new RecordChecklistHarianAction)->execute($armada, $data);

        return back()->with('success', 'Checklist harian dicatat.');
    }

    public function recordBbm(Request $request, Armada $armada)
    {
        $this->authorize('recordBbm', $armada);

        $data = $request->validate([
            'tanggal' => 'required|date',
            'liter' => 'required|numeric|min:0.01',
            'biaya' => 'nullable|numeric|min:0',
            'jam_operasional_saat_isi' => 'nullable|numeric|min:0',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);
        (new RecordBBMAction)->execute($armada, $data);

        return back()->with('success', 'BBM dicatat.');
    }

    public function startDowntime(Request $request, Armada $armada)
    {
        $this->authorize('startDowntime', $armada);

        $data = $request->validate([
            'penyebab' => 'nullable|string',
            'kategori' => 'required|in:kerusakan,menunggu_sparepart,lainnya',
            'catatan' => 'nullable|string',
        ]);
        (new StartDowntimeAction)->execute($armada, $data);

        return back()->with('success', 'Downtime dimulai.');
    }

    public function endDowntime(string|int $armadaId, string|int $downtimeId)
    {
        $armada = Armada::findOrFail($armadaId);
        $this->authorize('endDowntime', $armada);

        $downtime = DowntimeLog::findOrFail($downtimeId);
        (new EndDowntimeAction)->execute($downtime);

        return back()->with('success', 'Downtime selesai.');
    }

    public function assignDriver(Request $request, Armada $armada)
    {
        $this->authorize('assignDriver', $armada);

        $data = $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'tipe' => 'required|in:standby,kondisional',
            'tanggal_mulai' => 'required|date',
        ]);
        $data['armada_id'] = $armada->id;
        (new AssignDriverToArmadaAction)->execute($data);

        return back()->with('success', 'Driver ditugaskan.');
    }
}
