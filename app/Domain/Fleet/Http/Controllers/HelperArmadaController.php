<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\StoreHelperArmadaAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\HelperArmada;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Helper Armada (Bagian 21.6 / v7) — CRUD web di halaman `fleet/helper`.
 *
 * Pengelolaan (create/update/delete) khusus pemegang permission
 * `manage helper armada` (Ketua Armada / HR / Owner). Driver mengajukan helper
 * di luar aplikasi, sehingga tidak ada lagu create dari PIC.
 */
class HelperArmadaController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', HelperArmada::class);

        $query = HelperArmada::with(['armada', 'presensis' => fn ($q) => $q->orderByDesc('tanggal')->limit(5)])
            ->latest('durasi_mulai');

        if ($request->filled('armada_id')) {
            $query->where('armada_id', $request->armada_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->user()->unit_bisnis_id) {
            $unitId = $request->user()->unit_bisnis_id;
            $query->whereHas('armada', fn ($q) => $q->where('unit_bisnis_id', $unitId));
        }

        $helpers = $query->paginate(20)->withQueryString();

        return Inertia::render('Fleet/Helper/Index', [
            'helpers' => $helpers,
            'options' => [
                'armadas' => Armada::orderBy('kode_unit')
                    ->with('currentDriver.karyawan')
                    ->get()
                    ->map(fn (Armada $a) => [
                        'id' => $a->id,
                        'kode_unit' => $a->kode_unit,
                        'plat_nomor' => $a->plat_nomor,
                        'driver_aktif' => $a->currentDriver?->karyawan?->nama,
                    ]),
                'statuses' => [
                    ['value' => 'aktif', 'label' => 'Aktif'],
                    ['value' => 'selesai', 'label' => 'Selesai'],
                ],
            ],
            'filters' => $request->only(['armada_id', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'armada_id' => 'required|string|exists:armadas,id',
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:30',
            'foto' => 'nullable|image|max:2048',
            'honor' => 'nullable|numeric|min:0',
            'durasi_mulai' => 'required|date',
            'durasi_selesai' => 'nullable|date|after_or_equal:durasi_mulai',
            'status' => 'nullable|in:aktif,selesai',
        ]);

        $armada = Armada::findOrFail($validated['armada_id']);
        $this->authorize('create', [HelperArmada::class, $armada]);

        (new StoreHelperArmadaAction)->execute([
            'armada_id' => $armada->id,
            'nama' => $validated['nama'],
            'no_hp' => $validated['no_hp'] ?? null,
            'foto' => $this->storeFoto($request),
            'honor' => $validated['honor'] ?? 0,
            'durasi_mulai' => $validated['durasi_mulai'],
            'durasi_selesai' => $validated['durasi_selesai'] ?? null,
            'status' => $validated['status'] ?? 'aktif',
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Helper armada ditambahkan.');
    }

    public function update(Request $request, HelperArmada $helper): RedirectResponse
    {
        $this->authorize('update', $helper);

        $validated = $request->validate([
            'armada_id' => 'sometimes|required|string|exists:armadas,id',
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:30',
            'foto' => 'nullable|image|max:2048',
            'honor' => 'nullable|numeric|min:0',
            'durasi_mulai' => 'required|date',
            'durasi_selesai' => 'nullable|date|after_or_equal:durasi_mulai',
            'status' => 'nullable|in:aktif,selesai',
        ]);

        (new StoreHelperArmadaAction)->execute([
            'armada_id' => $validated['armada_id'] ?? $helper->armada_id,
            'nama' => $validated['nama'],
            'no_hp' => $validated['no_hp'] ?? null,
            'foto' => $this->storeFoto($request) ?? $helper->foto,
            'honor' => $validated['honor'] ?? 0,
            'durasi_mulai' => $validated['durasi_mulai'],
            'durasi_selesai' => $validated['durasi_selesai'] ?? null,
            'status' => $validated['status'] ?? 'aktif',
            'created_by' => $helper->created_by,
        ], $helper);

        return back()->with('success', 'Helper armada diperbarui.');
    }

    public function destroy(Request $request, HelperArmada $helper): RedirectResponse
    {
        $this->authorize('delete', $helper);

        $helper->delete();

        return back()->with('success', 'Helper armada dihapus.');
    }

    private function storeFoto(Request $request): ?string
    {
        if (! $request->hasFile('foto')) {
            return null;
        }

        return $request->file('foto')->store('foto/helper-armada', 'public');
    }
}
