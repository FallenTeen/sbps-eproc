<?php

namespace App\Domain\Security\Http\Controllers;

use App\Domain\Security\Models\SecurityLaporanDarurat;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Web Security - Laporan Darurat (TD-F4): daftar + tindak lanjut.
 * Pelaporan tetap dari mobile (`POST mobile/security/darurat`).
 */
class DaruratController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:baru,ditangani,selesai',
            'tingkat' => 'nullable|in:rendah,sedang,tinggi,siaga,darurat,kritis',
        ]);

        $rows = SecurityLaporanDarurat::with(['pelapor:id,name', 'penangan:id,name'])
            ->when(! empty($validated['status']), fn ($q) => $q->where('status', $validated['status']))
            ->when(! empty($validated['tingkat']), fn ($q) => $q->where('tingkat', $validated['tingkat']))
            ->latest('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Security/Darurat', [
            'rows' => $rows,
            'filters' => $validated,
        ]);
    }

    public function tangani(Request $request, SecurityLaporanDarurat $darurat)
    {
        $validated = $request->validate([
            'status' => 'required|in:ditangani,selesai',
            'catatan_penanganan' => 'nullable|string|max:2000',
        ]);

        $darurat->update([
            'status' => $validated['status'],
            'catatan_penanganan' => $validated['catatan_penanganan'] ?? $darurat->catatan_penanganan,
            'ditangani_oleh' => Auth::id(),
        ]);

        return back()->with('success', 'Laporan darurat diperbarui.');
    }
}
