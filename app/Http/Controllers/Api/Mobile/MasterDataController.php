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
}
