<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Production\Actions\RecordQCSampleAction;
use App\Domain\Production\Actions\RecordUjiTekanResultAction;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\QCSample;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QcSampleController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', QCSample::class);

        $query = QCSample::with('session.produk');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('session.produk', fn ($q) => $q->where('nama', 'like', "%{$search}%"));
        }

        $samples = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Production/QC/Index', [
            'samples' => $samples,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', QCSample::class);

        $sessions = ProductionSession::with('produk')
            ->whereIn('status', ['berjalan', 'selesai'])
            ->orderByDesc('mulai')
            ->get(['id', 'kode_sesi', 'produk_id', 'status']);

        return Inertia::render('Production/QC/Create', [
            'sessions' => $sessions,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', QCSample::class);

        $validated = $request->validate([
            'production_session_id' => 'required|exists:production_sessions,id',
            'jenis_uji' => 'required|in:slump_test,uji_tekan',
            'nilai_slump' => 'nullable|numeric|min:0',
            'tanggal_uji_tekan_rencana' => 'nullable|date',
            'catatan' => 'nullable|string',
        ]);

        (new RecordQCSampleAction)->execute($validated);

        return back()->with('success', 'Sample QC dicatat.');
    }

    public function update(Request $request, QCSample $qc)
    {
        $this->authorize('update', $qc);

        $validated = $request->validate([
            'jenis_uji' => 'required|in:slump_test,uji_tekan',
            'nilai_slump' => 'nullable|numeric|min:0',
            'tanggal_uji_tekan_rencana' => 'nullable|date',
            'catatan' => 'nullable|string',
        ]);

        $qc->update($validated);

        return back()->with('success', 'Sample QC diperbarui.');
    }

    public function destroy(QCSample $qc)
    {
        $this->authorize('delete', $qc);

        $qc->delete();

        return back()->with('success', 'Sample QC dihapus.');
    }

    public function pending()
    {
        $this->authorize('viewAny', QCSample::class);

        $samples = QCSample::with('session.produk')
            ->menunggu()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Production/QC/Pending', [
            'samples' => $samples,
        ]);
    }

    public function recordResult(Request $request, QCSample $qc)
    {
        $this->authorize('recordResult', $qc);

        $validated = $request->validate([
            'hasil_uji_tekan' => 'required|numeric|min:0',
            'target_mpa' => 'nullable|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        (new RecordUjiTekanResultAction)->execute(
            $qc,
            $validated['hasil_uji_tekan'],
            $validated['catatan'] ?? null,
            $validated['target_mpa'] ?? null,
        );

        return back()->with('success', 'Hasil uji tekan dicatat.');
    }
}
