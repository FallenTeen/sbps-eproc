<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Produk;
use App\Domain\Procurement\Models\BahanBaku;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;

class MasterDataController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/master/mesin
     * Daftar mesin produksi aktif untuk pemilihan sesi produksi.
     */
    public function mesin()
    {
        $items = MesinProduksi::with(['titik:id,nama', 'produkDefault:id,nama,satuan_output'])
            ->aktif()
            ->orderBy('nama')
            ->get()
            ->map(fn (MesinProduksi $m) => [
                'id' => $m->id,
                'nama' => $m->nama,
                'jenis' => $m->jenis,
                'kapasitas' => $m->kapasitas !== null ? (float) $m->kapasitas : null,
                'titik' => $m->titik ? [
                    'id' => $m->titik->id,
                    'nama' => $m->titik->nama,
                ] : null,
                'produk_default' => $m->produkDefault ? [
                    'id' => $m->produkDefault->id,
                    'nama' => $m->produkDefault->nama,
                    'satuan_output' => $m->produkDefault->satuan_output,
                ] : null,
            ])
            ->values();

        return $this->success($items, 'Daftar mesin produksi.');
    }

    /**
     * GET /api/mobile/master/produk
     */
    public function produk()
    {
        $items = Produk::query()
            ->aktif()
            ->orderBy('nama')
            ->get()
            ->map(fn (Produk $p) => [
                'id' => $p->id,
                'nama' => $p->nama,
                'kategori' => $p->kategori,
                'satuan_output' => $p->satuan_output,
            ])
            ->values();

        return $this->success($items, 'Daftar produk.');
    }

    /**
     * GET /api/mobile/master/bahan-baku
     * Untuk override konsumsi bahan baku manual saat menutup sesi.
     */
    public function bahanBaku()
    {
        $items = BahanBaku::query()
            ->bahanBaku()
            ->aktif()
            ->orderBy('nama')
            ->get()
            ->map(fn (BahanBaku $b) => [
                'id' => $b->id,
                'kode' => $b->kode,
                'nama' => $b->nama,
                'satuan' => $b->satuan,
            ])
            ->values();

        return $this->success($items, 'Daftar bahan baku.');
    }

    /**
     * GET /api/mobile/master/armada
     * Daftar seluruh unit armada untuk dropdown pengajuan servis dan monitoring.
     */
    public function armada()
    {
        $items = \App\Domain\Fleet\Models\Armada::query()
            ->with('titik')
            ->where('status', '!=', 'nonaktif')
            ->orderBy('plat_nomor')
            ->get()
            ->map(fn (\App\Domain\Fleet\Models\Armada $a) => [
                'id' => $a->id,
                'plat_nomor' => $a->plat_nomor,
                'kode_unit' => $a->kode_unit ?? $a->kode,
                'jenis' => $a->jenis ?? $a->tipe_unit,
                'status' => $a->status,
                'titik' => $a->titik ? [
                    'id' => $a->titik->id,
                    'nama' => $a->titik->nama,
                ] : null,
                'odo_terkini' => $this->latestOdo($a),
                'jam_operasional_terkini' => $this->latestHm($a),
            ])
            ->values();

        return $this->success($items, 'Daftar master armada.');
    }

    private function latestOdo(\App\Domain\Fleet\Models\Armada $a): ?float
    {
        $checklist = \App\Domain\Fleet\Models\ArmadaChecklistHarian::where('checkable_type', \App\Domain\Fleet\Models\Armada::class)
            ->where('checkable_id', $a->id)
            ->latest('tanggal')
            ->first();
        $odo = $checklist ? ($checklist->odo_sore ?? $checklist->odo_pagi) : null;
        if ($odo === null) {
            $odoAwal = \App\Domain\Fleet\Models\ArmadaOdoAwalProyek::where('armada_id', $a->id)->latest('tanggal')->first();
            $odo = $odoAwal ? (float) $odoAwal->odo_awal : null;
        }
        return $odo ? (float) $odo : null;
    }

    private function latestHm(\App\Domain\Fleet\Models\Armada $a): ?float
    {
        $checklist = \App\Domain\Fleet\Models\ArmadaChecklistHarian::where('checkable_type', \App\Domain\Fleet\Models\Armada::class)
            ->where('checkable_id', $a->id)
            ->latest('tanggal')
            ->first();
        return $checklist ? (float) $checklist->hm_odo : null;
    }
}
