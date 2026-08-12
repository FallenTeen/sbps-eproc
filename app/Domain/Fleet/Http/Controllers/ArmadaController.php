<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Actions\RecordSewaAlatJamAction;
use App\Domain\Fleet\Actions\RecordServiceHistoryAction;
use App\Domain\Fleet\Actions\RecordChecklistHarianAction;
use App\Domain\Fleet\Actions\RecordBBMAction;
use App\Domain\Fleet\Actions\StartDowntimeAction;
use App\Domain\Fleet\Actions\EndDowntimeAction;
use App\Domain\Fleet\Actions\AssignDriverToArmadaAction;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ArmadaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $armadas = Armada::with(['unitBisnis', 'titik', 'currentDriver'])
            ->paginate(15);
        return Inertia::render('Fleet/Armada/Index', ['armadas' => $armadas]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $titiks = Titik::aktif()->get();
        $drivers = Karyawan::aktif()->where('tipe', '!=', 'borongan_rit')->get();
        return Inertia::render('Fleet/Armada/Create', ['titiks' => $titiks, 'drivers' => $drivers]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'plat_nomor' => 'required|unique:armada',
            'kode_unit' => 'required|unique:armada',
            'jenis' => 'required|in:dump_truck,alat_berat,truck_molen,lainnya',
            'model_tarif' => 'required|in:ritase,sewa_jam,internal',
            'tahun' => 'nullable|integer',
            'kapasitas' => 'nullable|string',
            'titik_id' => 'nullable|exists:titik,id',
            'tanggal_mulai_pakai' => 'nullable|date',
        ]);
        Armada::create($validated);
        return redirect()->route('fleet.armada.index')->with('success', 'Armada berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Armada $armada)
    {
        $armada->load([
            'unitBisnis',
            'titik',
            'serviceHistories',
            'checklists' => fn($q) => $q->latest('tanggal')->limit(30),
            'bbmLogs' => fn($q) => $q->latest('tanggal')->limit(30),
            'downtimes' => fn($q) => $q->latest('mulai')->limit(10),
            'ritases' => fn($q) => $q->latest('tanggal')->limit(50),
            'sewaAlatJams' => fn($q) => $q->latest('tanggal')->limit(50),
            'driverAssignments' => fn($q) => $q->with('karyawan')->latest('tanggal_mulai'),
        ]);
        return Inertia::render('Fleet/Armada/Show', ['armada' => $armada]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Armada $armada)
    {
        $titiks = Titik::aktif()->get();
        return Inertia::render('Fleet/Armada/Edit', ['armada' => $armada, 'titiks' => $titiks]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Armada $armada)
    {
        $validated = $request->validate([
            'plat_nomor' => 'required|unique:armada,plat_nomor,' . $armada->id,
            'kode_unit' => 'required|unique:armada,kode_unit,' . $armada->id,
            'jenis' => 'required|in:dump_truck,alat_berat,truck_molen,lainnya',
            'model_tarif' => 'required|in:ritase,sewa_jam,internal',
            'tahun' => 'nullable|integer',
            'kapasitas' => 'nullable|string',
            'titik_id' => 'nullable|exists:titik,id',
            'status' => 'in:aktif,servis,nonaktif',
            'tanggal_mulai_pakai' => 'nullable|date',
        ]);
        $armada->update($validated);
        return redirect()->route('fleet.armada.index')->with('success', 'Armada diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Armada $armada)
    {
        $armada->delete();
        return redirect()->route('fleet.armada.index')->with('success', 'Armada dihapus.');
    }

    // ===== Action tambahan =====

    public function recordRitase(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'driver_karyawan_id' => 'required|exists:karyawan,id',
            'tanggal' => 'required|date',
            'rute_tarif_id' => 'nullable|exists:rute_tarif,id',
            'kategori' => 'nullable|string',
            'material' => 'nullable|string',
            'jumlah_rit' => 'required|integer|min:1',
            'tarif_per_rit_snapshot' => 'nullable|numeric|min:0',
            'proyek_id' => 'nullable|exists:proyek,id',
            'titik_id' => 'nullable|exists:titik,id',
            'customer' => 'nullable|string',
            'catatan' => 'nullable|string',
            'biaya_lain' => 'nullable|array',
            'biaya_lain.*.jenis' => 'required|in:bbm,upah_kenek,uang_makan,insentif,standby,lainnya',
            'biaya_lain.*.jumlah' => 'required|numeric|min:0',
            'biaya_lain.*.catatan' => 'nullable|string',
        ]);
        $data['armada_id'] = $armada->id;
        $ritase = (new RecordRitaseAction())->execute($data);
        return back()->with('success', "Ritase dicatat: {$ritase->jumlah_rit} rit");
    }

    public function recordSewa(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'proyek_id' => 'nullable|exists:proyek,id',
            'penyewa_eksternal' => 'nullable|string',
            'lokasi_pekerjaan' => 'nullable|string',
            'harga_per_jam_snapshot' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'hm_awal' => 'nullable|numeric|min:0',
            'hm_akhir' => 'nullable|numeric|min:0',
            'jumlah_jam' => 'required|numeric|min:0.1',
            'catatan' => 'nullable|string',
        ]);
        $data['armada_id'] = $armada->id;
        $sewa = (new RecordSewaAlatJamAction())->execute($data);
        return back()->with('success', "Sewa alat dicatat: {$sewa->jumlah_jam} jam");
    }

    public function recordService(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'tanggal' => 'required|date',
            'jenis_servis' => 'nullable|string',
            'biaya' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);
        $service = (new RecordServiceHistoryAction())->execute($armada, $data);
        return back()->with('success', 'Servis dicatat.');
    }

    public function recordChecklist(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'tanggal' => 'required|date',
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string',
            'dicatat_oleh_karyawan_id' => 'required|exists:karyawan,id',
        ]);
        (new RecordChecklistHarianAction())->execute($armada, $data);
        return back()->with('success', 'Checklist harian dicatat.');
    }

    public function recordBbm(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'tanggal' => 'required|date',
            'liter' => 'required|numeric|min:0.01',
            'biaya' => 'nullable|numeric|min:0',
            'jam_operasional_saat_isi' => 'nullable|numeric|min:0',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);
        (new RecordBBMAction())->execute($armada, $data);
        return back()->with('success', 'BBM dicatat.');
    }

    public function startDowntime(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'penyebab' => 'nullable|string',
            'kategori' => 'required|in:kerusakan,menunggu_sparepart,lainnya',
            'catatan' => 'nullable|string',
        ]);
        (new StartDowntimeAction())->execute($armada, $data);
        return back()->with('success', 'Downtime dimulai.');
    }

    public function endDowntime(string|int $armadaId, string|int $downtimeId)
    {
        $downtime = \App\Domain\Fleet\Models\DowntimeLog::findOrFail($downtimeId);
        (new EndDowntimeAction())->execute($downtime);
        return back()->with('success', 'Downtime selesai.');
    }

    public function assignDriver(Request $request, Armada $armada)
    {
        $data = $request->validate([
            'karyawan_id' => 'required|exists:karyawan,id',
            'tipe' => 'required|in:standby,kondisional',
            'tanggal_mulai' => 'required|date',
        ]);
        $data['armada_id'] = $armada->id;
        (new AssignDriverToArmadaAction())->execute($data);
        return back()->with('success', 'Driver ditugaskan.');
    }
}
