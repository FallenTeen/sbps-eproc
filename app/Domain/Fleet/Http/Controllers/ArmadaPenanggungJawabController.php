<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\ActivateCadanganPenanggungJawabAction;
use App\Domain\Fleet\Actions\AssignPenanggungJawabArmadaAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArmadaPenanggungJawabController extends Controller
{
    public function index(Armada $armada): Response
    {
        $this->authorize('view', $armada);

        $armada->load(['penanggungJawabs.karyawan']);

        return Inertia::render('Fleet/Armada/PenanggungJawab', [
            'armada' => $armada,
            'penanggungJawabs' => $armada->penanggungJawabs,
            'active_penanggung_jawab' => $armada->active_penanggung_jawab,
            'options' => [
                'karyawans' => Karyawan::aktif()->get(['id', 'nama', 'jabatan']),
            ],
        ]);
    }

    public function store(Request $request, Armada $armada): RedirectResponse
    {
        $this->authorize('create', ArmadaPenanggungJawab::class);

        $validated = $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'peran' => 'required|in:utama,cadangan',
            'mulai_dari' => 'required|date',
            'alasan' => 'nullable|string|max:255',
        ]);

        (new AssignPenanggungJawabArmadaAction)->execute([
            ...$validated,
            'armada_id' => $armada->id,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Penanggung jawab ditugaskan.');
    }

    public function activateCadangan(Request $request, Armada $armada): RedirectResponse
    {
        $this->authorize('update', $armada);

        $validated = $request->validate([
            'karyawan_id' => 'nullable|exists:karyawans,id',
            'tanggal' => 'required|date',
            'alasan' => 'nullable|string|max:255',
        ]);

        (new ActivateCadanganPenanggungJawabAction)->execute([
            ...$validated,
            'armada_id' => $armada->id,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Cadangan diaktifkan sebagai PIC.');
    }
}