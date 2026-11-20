<?php

namespace App\Domain\Logistik\Http\Controllers;

use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseTimbang;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Web Logistik (TD-E2, TD-E9): antrean verifikasi ritase (timbang + checklist).
 * Melengkapi endpoint mobile `mobile/logistik/*`.
 */
class LogistikController extends Controller
{
    use FilterableTable;
    public function antrean(Request $request)
    {
        $columns = [
            'tanggal' => ['type' => 'date'],
            'plat_nomor' => ['type' => 'like', 'relation' => 'armada', 'column' => 'plat_nomor'],
            'driver' => ['type' => 'like', 'relation' => 'driver', 'column' => 'nama'],
            'kategori' => ['type' => 'like'],
            'material' => ['type' => 'like'],
            'wajib_jembatan_timbang' => ['type' => 'boolean'],
            'status' => ['type' => 'exact'],
            'ada_selisih' => ['type' => 'boolean'],
        ];

        $query = Ritase::with([
            'armada',
            'driver',
            'muatan',
            'verifikasiLogistik.verifikator',
            'timbang.penimbang',
            'ruteTarif',
            'proyek',
            'titik',
        ])
            ->where(function ($q) {
                $q->where('wajib_jembatan_timbang', true)
                    ->orWhereDoesntHave('verifikasiLogistik')
                    ->orWhereHas('verifikasiLogistik', fn($v) => $v->where('status', 'menunggu'));
            });

        $sort = $this->applyTableQuery($query, $request, $columns, ['tanggal' => 'desc', 'created_at' => 'desc']);

        $rows = $query->paginate($this->tablePerPage($request))->withQueryString();

        return Inertia::render('Logistik/RitaseVerifikasi', [
            'rows' => $rows,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function verifikasi(Request $request, Ritase $ritase)
    {
        $validated = $request->validate([
            'jumlah_verifikasi' => 'required|numeric|min:0',
            'berat_kosong_kg' => 'nullable|numeric|min:0',
            'berat_isi_kg' => 'required|numeric|min:0',
            'berat_netto_kg' => 'nullable|numeric|min:0',
            'tara_sumber' => 'nullable|in:master,timbang_ulang',
            'checklist' => 'nullable',
            'nomor_tiket' => 'nullable|string|max:100',
            'foto_tiket' => 'nullable|image|max:10240',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $fotoTiketPath = null;
        if ($request->hasFile('foto_tiket')) {
            $fotoTiketPath = $request->file('foto_tiket')->store('logistik/tiket/' . now()->format('Y/m'), 'public');
        }

        $beratKosongDikirim = array_key_exists('berat_kosong_kg', $validated)
            && $validated['berat_kosong_kg'] !== null;
        $beratKosong = $beratKosongDikirim
            ? (float) $validated['berat_kosong_kg']
            : (float) ($ritase->armada?->tara_master_kg ?? 0);
        $taraSumber = $beratKosongDikirim
            ? ($validated['tara_sumber'] ?? 'master')
            : 'master';

        $beratNetto = $validated['berat_netto_kg'] ?? max(
            0,
            (float) $validated['berat_isi_kg'] - $beratKosong,
        );

        RitaseTimbang::updateOrCreate(['ritase_id' => $ritase->id], [
            'berat_kosong_kg' => $beratKosong,
            'berat_isi_kg' => $validated['berat_isi_kg'],
            'berat_netto_kg' => $beratNetto,
            'tara_sumber' => $taraSumber,
            'nomor_tiket' => $validated['nomor_tiket'] ?? null,
            'foto_tiket' => $fotoTiketPath,
            'ditimbang_oleh' => Auth::id(),
            'ditimbang_pada' => now(),
        ]);

        $checklist = $validated['checklist'] ?? null;
        if (is_string($checklist)) {
            $checklist = json_decode($checklist, true) ?? [];
        }

        RitaseVerifikasi::updateOrCreate(['ritase_id' => $ritase->id, 'tahap' => 'logistik'], [
            'status' => 'terverifikasi',
            'jumlah_verifikasi' => $validated['jumlah_verifikasi'],
            'checklist' => $checklist,
            'catatan' => $validated['catatan'] ?? null,
            'foto' => $fotoTiketPath,
            'diverifikasi_oleh' => Auth::id(),
            'diverifikasi_pada' => now(),
        ]);

        $jumlahDriver = $ritase->muatan?->jumlah_driver ?? (float) ($ritase->jumlah_volume ?: $ritase->jumlah_rit);
        $adaSelisih = abs($jumlahDriver - (float) $validated['jumlah_verifikasi']) > 0.001;

        $ritase->update([
            'ada_selisih' => $adaSelisih,
            'sumber_angka_resmi' => 'logistik',
        ]);

        return back()->with('success', 'Verifikasi ritase logistik tersimpan' . ($adaSelisih ? ' (ada selisih dengan angka driver).' : '.'));
    }
}
