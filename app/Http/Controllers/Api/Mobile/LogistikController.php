<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseTimbang;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use App\Support\KaryawanTitikScope;
use Illuminate\Http\Request;

class LogistikController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/logistik/ritase/antrean
     * Antrean ritase yang memerlukan verifikasi timbang / muatan logistik (TD-E6, TD-E9).
     */
    public function antrean(Request $request)
    {
        $titikIds = KaryawanTitikScope::activeTitikIds($request->user());

        $ritases = Ritase::with(['armada', 'ruteTarif', 'proyek', 'titik', 'muatan', 'verifikasiLogistik', 'timbang', 'driver'])
            ->when($titikIds, fn ($q, $ids) => $q->whereIn('titik_id', $ids))
            ->where(function ($q) {
                $q->where('wajib_jembatan_timbang', true)
                    ->orWhereDoesntHave('verifikasiLogistik')
                    ->orWhereHas('verifikasiLogistik', fn ($v) => $v->where('status', 'menunggu'));
            })
            ->latest('tanggal')
            ->latest('created_at')
            ->take(50)
            ->get();

        $items = $ritases->map(fn (Ritase $r) => [
            'id' => $r->id,
            'tanggal' => $r->tanggal?->toDateString(),
            'kategori' => $r->kategori,
            'material' => $r->material,
            'jumlah_rit' => $r->jumlah_rit,
            'tarif_per_rit_snapshot' => (float) $r->tarif_per_rit_snapshot,
            'total_upah_rit' => $r->totalUpahRit,
            'status' => $r->status,
            'catatan' => $r->catatan,
            'customer' => $r->customer,
            'armada_plat' => $r->armada?->plat_nomor,
            'driver_nama' => $r->driver?->nama,
            'rute' => $r->ruteTarif ? [
                'id' => $r->ruteTarif->id,
                'asal' => $r->ruteTarif->lokasi_asal,
                'tujuan' => $r->ruteTarif->lokasi_tujuan,
            ] : null,
            'proyek' => $r->proyek?->nama,
            'titik' => $r->titik?->nama,
            'wajib_jembatan_timbang' => (bool) $r->wajib_jembatan_timbang,
            'status_verifikasi_logistik' => $r->verifikasiLogistik?->status ?? 'menunggu',
            'jumlah_driver' => $r->muatan?->jumlah_driver ?? (float) ($r->jumlah_volume ?: $r->jumlah_rit),
            'jumlah_verifikasi_logistik' => $r->verifikasiLogistik?->jumlah_verifikasi,
            'satuan_muatan' => $r->muatan?->satuan ?? $r->satuan_volume,
            'ada_selisih' => (bool) $r->ada_selisih,
            'tara_master_kg' => (float) ($r->armada?->tara_master_kg ?? 0),
            'berat_kosong_kg' => $r->timbang?->berat_kosong_kg,
            'berat_isi_kg' => $r->timbang?->berat_isi_kg,
            'berat_netto_kg' => $r->timbang?->berat_netto_kg,
        ]);

        return $this->success(['items' => $items], 'Antrean verifikasi ritase logistik.');
    }

    /**
     * POST /api/mobile/logistik/ritase/{id}/verifikasi
     * Submit verifikasi dan timbang ritase oleh Logistik (TD-E4, TD-E5).
     */
    public function verifikasi(Request $request, $id)
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

        $ritase = Ritase::with(['muatan', 'armada'])->findOrFail($id);
        $user = $request->user();

        $fotoTiketPath = null;
        if ($request->hasFile('foto_tiket')) {
            $fotoTiketPath = $request->file('foto_tiket')->store('logistik/tiket/'.now()->format('Y/m'), 'public');
        }

        // 1. Simpan data timbang (TD-E5)
        $timbang = RitaseTimbang::updateOrCreate(
            ['ritase_id' => $ritase->id],
            [
                'berat_kosong_kg' => $validated['berat_kosong_kg'],
                'berat_isi_kg' => $validated['berat_isi_kg'],
                'berat_netto_kg' => $validated['berat_netto_kg'],
                'tara_sumber' => $validated['tara_sumber'] ?? 'master',
                'nomor_tiket' => $validated['nomor_tiket'] ?? null,
                'foto_tiket' => $fotoTiketPath,
                'ditimbang_oleh' => $user->id,
                'ditimbang_pada' => now(),
            ]
        );

        // 2. Decode checklist if JSON string
        $checklist = $validated['checklist'] ?? null;
        if (is_string($checklist)) {
            $checklist = json_decode($checklist, true) ?? [];
        }

        // 3. Simpan verifikasi logistik (TD-E4)
        $verifikasi = RitaseVerifikasi::updateOrCreate(
            ['ritase_id' => $ritase->id, 'tahap' => 'logistik'],
            [
                'status' => 'terverifikasi',
                'jumlah_verifikasi' => $validated['jumlah_verifikasi'],
                'checklist' => $checklist,
                'catatan' => $validated['catatan'] ?? null,
                'foto' => $fotoTiketPath,
                'diverifikasi_oleh' => $user->id,
                'diverifikasi_pada' => now(),
            ]
        );

        // 4. Deteksi selisih (TD-E7)
        $jumlahDriver = $ritase->muatan?->jumlah_driver ?? (float) ($ritase->jumlah_volume ?: $ritase->jumlah_rit);
        $adaSelisih = abs($jumlahDriver - (float) $validated['jumlah_verifikasi']) > 0.001;

        $ritase->update([
            'ada_selisih' => $adaSelisih,
            'sumber_angka_resmi' => 'logistik',
        ]);

        return $this->success([
            'ritase_id' => $ritase->id,
            'status' => 'terverifikasi',
            'ada_selisih' => $adaSelisih,
            'jumlah_verifikasi' => (float) $validated['jumlah_verifikasi'],
            'berat_netto_kg' => (float) $validated['berat_netto_kg'],
        ], 'Verifikasi ritase logistik berhasil disimpan.');
    }

    /**
     * GET /api/mobile/logistik/tara-master
     * Daftar tara master armada (TD-E2).
     */
    public function taraMaster()
    {
        $armadas = Armada::select('id', 'plat_nomor', 'kode_unit', 'jenis', 'tara_master_kg', 'tara_diperbarui_pada')
            ->orderBy('plat_nomor')
            ->get();

        return $this->success($armadas, 'Daftar tara master armada.');
    }

    /**
     * PUT /api/mobile/logistik/tara-master/{armada}
     * Update tara master armada (TD-E2).
     */
    public function updateTaraMaster(Request $request, Armada $armada)
    {
        $validated = $request->validate([
            'tara_master_kg' => 'required|numeric|min:0',
        ]);

        $armada->update([
            'tara_master_kg' => $validated['tara_master_kg'],
            'tara_diperbarui_pada' => now(),
            'data_diperbarui_pada' => now(),
            'data_diperbarui_oleh' => $request->user()->id,
        ]);

        return $this->success($armada->fresh(), 'Tara master armada berhasil diperbarui.');
    }
}
