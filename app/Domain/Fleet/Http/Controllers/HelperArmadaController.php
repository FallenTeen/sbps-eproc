<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\StoreHelperArmadaAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\HelperArmada;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Helper Armada (Bagian 21.6) — CRUD via web, tab "Helper" di detail armada.
 * Hanya tampil untuk PIC armada terkait (object-level ownership, bukan role).
 */
class HelperArmadaController extends Controller
{
    public function store(Request $request, Armada $armada): RedirectResponse
    {
        $this->authorize('create', [HelperArmada::class, $armada]);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:30',
            'foto' => 'nullable|image|max:2048',
            'honor' => 'nullable|numeric|min:0',
            'durasi_mulai' => 'required|date',
            'durasi_selesai' => 'nullable|date|after_or_equal:durasi_mulai',
            'status' => 'nullable|in:aktif,selesai',
        ]);

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

    public function update(Request $request, Armada $armada, HelperArmada $helper): RedirectResponse
    {
        $this->authorize('update', $helper);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:30',
            'foto' => 'nullable|image|max:2048',
            'honor' => 'nullable|numeric|min:0',
            'durasi_mulai' => 'required|date',
            'durasi_selesai' => 'nullable|date|after_or_equal:durasi_mulai',
            'status' => 'nullable|in:aktif,selesai',
        ]);

        (new StoreHelperArmadaAction)->execute([
            'armada_id' => $armada->id,
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

    public function destroy(Request $request, Armada $armada, HelperArmada $helper): RedirectResponse
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