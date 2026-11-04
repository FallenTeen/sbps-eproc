<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\PerpanjangDokumenBerkalaAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ArmadaDokumenBerkalaController extends Controller
{
    public function store(Request $request, Armada $armada)
    {
        $validated = $request->validate([
            'jenis' => 'required|in:pajak_tahunan,stnk_5_tahunan,kir',
            'nomor_dokumen' => 'nullable|string|max:255',
            'tanggal_terbit' => 'nullable|date',
            'tanggal_jatuh_tempo' => 'required|date',
            'nominal_biaya' => 'nullable|numeric|min:0',
            'wilayah' => 'nullable|string|max:255',
            'tempat_pembayaran' => 'nullable|string|max:255',
            'teknis_pembayaran' => 'nullable|string|max:1000',
            'reminder_hari_sebelum' => 'nullable|array',
            'reminder_hari_sebelum.*' => 'integer|min:1',
            'catatan' => 'nullable|string|max:2000',
            'meta' => 'nullable|array',
            'scan_dokumen' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:10240',
        ]);

        $dokumen = $armada->dokumenBerkalas()->create([
            'jenis' => $validated['jenis'],
            'nomor_dokumen' => $validated['nomor_dokumen'] ?? null,
            'tanggal_terbit' => $validated['tanggal_terbit'] ?? null,
            'tanggal_jatuh_tempo' => $validated['tanggal_jatuh_tempo'],
            'nominal_biaya' => $validated['nominal_biaya'] ?? null,
            'wilayah' => $validated['wilayah'] ?? null,
            'tempat_pembayaran' => $validated['tempat_pembayaran'] ?? null,
            'teknis_pembayaran' => $validated['teknis_pembayaran'] ?? null,
            'reminder_hari_sebelum' => $validated['reminder_hari_sebelum'] ?? [30, 14, 7],
            'catatan' => $validated['catatan'] ?? null,
            'meta' => $validated['meta'] ?? null,
        ]);

        if ($request->hasFile('scan_dokumen')) {
            $dokumen->addMediaFromRequest('scan_dokumen')->toMediaCollection('scan_dokumen');
        }

        $armada->update([
            'data_diperbarui_pada' => now(),
            'data_diperbarui_oleh' => $request->user()?->id,
        ]);

        return back()->with('success', 'Dokumen berkala berhasil ditambahkan.');
    }

    public function update(Request $request, Armada $armada, ArmadaDokumenBerkala $dokumen)
    {
        $validated = $request->validate([
            'nomor_dokumen' => 'nullable|string|max:255',
            'tanggal_terbit' => 'nullable|date',
            'tanggal_jatuh_tempo' => 'required|date',
            'nominal_biaya' => 'nullable|numeric|min:0',
            'wilayah' => 'nullable|string|max:255',
            'tempat_pembayaran' => 'nullable|string|max:255',
            'teknis_pembayaran' => 'nullable|string|max:1000',
            'reminder_hari_sebelum' => 'nullable|array',
            'reminder_hari_sebelum.*' => 'integer|min:1',
            'catatan' => 'nullable|string|max:2000',
            'meta' => 'nullable|array',
            'scan_dokumen' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:10240',
        ]);

        $dokumen->update([
            'nomor_dokumen' => $validated['nomor_dokumen'] ?? $dokumen->nomor_dokumen,
            'tanggal_terbit' => $validated['tanggal_terbit'] ?? $dokumen->tanggal_terbit,
            'tanggal_jatuh_tempo' => $validated['tanggal_jatuh_tempo'],
            'nominal_biaya' => $validated['nominal_biaya'] ?? $dokumen->nominal_biaya,
            'wilayah' => $validated['wilayah'] ?? $dokumen->wilayah,
            'tempat_pembayaran' => $validated['tempat_pembayaran'] ?? $dokumen->tempat_pembayaran,
            'teknis_pembayaran' => $validated['teknis_pembayaran'] ?? $dokumen->teknis_pembayaran,
            'reminder_hari_sebelum' => $validated['reminder_hari_sebelum'] ?? $dokumen->reminder_hari_sebelum,
            'catatan' => $validated['catatan'] ?? $dokumen->catatan,
            'meta' => $validated['meta'] ?? $dokumen->meta,
        ]);

        if ($request->hasFile('scan_dokumen')) {
            $dokumen->addMediaFromRequest('scan_dokumen')->toMediaCollection('scan_dokumen');
        }

        $armada->update([
            'data_diperbarui_pada' => now(),
            'data_diperbarui_oleh' => $request->user()?->id,
        ]);

        return back()->with('success', 'Dokumen berkala berhasil diperbarui.');
    }

    public function perpanjang(Request $request, Armada $armada, ArmadaDokumenBerkala $dokumen)
    {
        $validated = $request->validate([
            'tanggal_jatuh_tempo_baru' => 'required|date|after:today',
            'nominal_biaya' => 'nullable|numeric|min:0',
            'nomor_dokumen_baru' => 'nullable|string|max:255',
            'catatan' => 'nullable|string|max:2000',
            'scan_dokumen' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:10240',
        ]);

        app(PerpanjangDokumenBerkalaAction::class)->execute(
            $dokumen,
            $request->user(),
            $validated,
            $request->file('scan_dokumen'),
        );

        return back()->with('success', "Dokumen {$dokumen->jenis_label} berhasil diperpanjang.");
    }

    public function destroy(Armada $armada, ArmadaDokumenBerkala $dokumen)
    {
        $dokumen->delete();

        return back()->with('success', 'Dokumen berkala berhasil dihapus.');
    }
}
