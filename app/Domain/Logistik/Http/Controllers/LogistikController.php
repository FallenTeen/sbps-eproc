<?php

namespace App\Domain\Logistik\Http\Controllers;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseTimbang;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Web Logistik (TD-E2, TD-E9): antrean verifikasi ritase (timbang + checklist)
 * dan Tara Master per unit. Melengkapi endpoint mobile `mobile/logistik/*`.
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

        $query = Ritase::with(['armada', 'driver', 'muatan', 'verifikasiLogistik', 'timbang', 'ruteTarif'])
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
            'berat_kosong_kg' => 'required|numeric|min:0',
            'berat_isi_kg' => 'required|numeric|min:0',
            'berat_netto_kg' => 'required|numeric|min:0',
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

        RitaseTimbang::updateOrCreate(['ritase_id' => $ritase->id], [
            'berat_kosong_kg' => $validated['berat_kosong_kg'],
            'berat_isi_kg' => $validated['berat_isi_kg'],
            'berat_netto_kg' => $validated['berat_netto_kg'],
            'tara_sumber' => $validated['tara_sumber'] ?? 'master',
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

    public function taraMaster(Request $request)
    {
        $columns = [
            'plat_nomor' => ['type' => 'like'],
            'kode_unit' => ['type' => 'like'],
            'jenis' => ['type' => 'exact'],
            'tara_master_kg' => ['type' => 'like'],
            'tara_diperbarui_pada' => ['type' => 'date'],
        ];

        $query = Armada::query();

        $sort = $this->applyTableQuery($query, $request, $columns, ['plat_nomor' => 'asc']);

        $rows = $query->paginate($this->tablePerPage($request))->withQueryString();

        return Inertia::render('Logistik/TaraMaster', [
            'rows' => $rows,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function updateTara(Request $request, Armada $armada)
    {
        $validated = $request->validate(['tara_master_kg' => 'required|numeric|min:0']);

        $armada->update([
            'tara_master_kg' => $validated['tara_master_kg'],
            'tara_diperbarui_pada' => now(),
            'data_diperbarui_pada' => now(),
            'data_diperbarui_oleh' => Auth::id(),
        ]);

        return back()->with('success', 'Tara master ' . $armada->plat_nomor . ' diperbarui.');
    }
}
