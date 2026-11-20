<?php

namespace App\Domain\Inventory\Services;

use App\Domain\Inventory\Models\StokOpname;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\StokMutasi;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Widget ringkas untuk Dashboard Inventory (Bagian 21.7): nilai stok,
 * PO menunggu approval, item mendekati habis - semua dihitung on-the-fly.
 */
class InventoryDashboardAggregator
{
    private const SUMBER_LABELS = [
        'opname' => 'Opname',
        'request_sparepart' => 'Request sparepart',
        'pembelian' => 'Pembelian',
        'produksi' => 'Produksi',
        'manual' => 'Manual',
    ];

    public function getMetrics(): array
    {
        $bahanBakus = BahanBaku::where('aktif', true)->get();
        $totalItem = $bahanBakus->count();

        // Saldo total per bahan baku (1 query agregat, bukan per-item).
        $saldos = StokMutasi::query()
            ->selectRaw('bahan_baku_id, sum(case when tipe = "masuk" then jumlah else -jumlah end) as saldo')
            ->groupBy('bahan_baku_id')
            ->pluck('saldo', 'bahan_baku_id');

        // Harga beli terbaru yang aktif per bahan baku.
        $hargaTerbaru = $bahanBakus->mapWithKeys(function ($bahanBaku) {
            $harga = $bahanBaku->hargaBeli()
                ->where('berlaku_dari', '<=', now())
                ->where(function ($q) {
                    $q->whereNull('berlaku_sampai')->orWhere('berlaku_sampai', '>=', now());
                })
                ->orderBy('berlaku_dari', 'desc')
                ->first();

            return [$bahanBaku->id => $harga ? (float) $harga->harga : 0.0];
        });

        $nilaiStok = 0.0;
        $stokPerItem = [];
        foreach ($bahanBakus as $bahanBaku) {
            $saldo = (float) $saldos->get($bahanBaku->id, 0);
            $stokPerItem[] = [
                'id' => $bahanBaku->id,
                'kode' => $bahanBaku->kode,
                'nama' => $bahanBaku->nama,
                'satuan' => $bahanBaku->satuan,
                'kategori' => $bahanBaku->kategori,
                'saldo' => $saldo,
            ];
            $nilaiStok += $saldo * $hargaTerbaru[$bahanBaku->id];
        }

        asort($stokPerItem);

        $mendekatiHabis = collect($stokPerItem)
            ->filter(fn ($item) => $item['saldo'] <= 10)
            ->sortBy('saldo')
            ->take(8)
            ->values();

        $poPendingApproval = PurchaseOrder::whereIn('status', [
            'menunggu_approval_finance',
            'menunggu_approval_owner',
        ])->count();

        $opnameTerbaru = StokOpname::with(['bahanBaku', 'titik', 'dicatatOleh'])
            ->latest('tanggal')
            ->latest('created_at')
            ->take(6)
            ->get()
            ->map(function (StokOpname $o) {
                return [
                    'id' => $o->id,
                    'tanggal' => $o->tanggal->toDateString(),
                    'item' => $o->bahanBaku?->nama,
                    'satuan' => $o->bahanBaku?->satuan,
                    'titik' => $o->titik?->nama,
                    'saldo_sistem' => (float) $o->saldo_sistem,
                    'saldo_fisik' => (float) $o->saldo_fisik,
                    'selisih' => (float) $o->selisih,
                ];
            });

        $mutasiTerbaru = StokMutasi::with(['bahanBaku', 'titik'])
            ->latest('tanggal')
            ->latest('created_at')
            ->take(8)
            ->get()
            ->map(function (StokMutasi $m) {
                return [
                    'id' => $m->id,
                    'tanggal' => $m->tanggal->toDateString(),
                    'item' => $m->bahanBaku?->nama,
                    'satuan' => $m->bahanBaku?->satuan,
                    'titik' => $m->titik?->nama,
                    'tipe' => $m->tipe,
                    'jumlah' => (float) $m->jumlah,
                ];
            });

        return [
            'total_item' => $totalItem,
            'nilai_stok' => $nilaiStok,
            'po_pending_approval' => $poPendingApproval,
            'mendekati_habis' => $mendekatiHabis,
            'opname_terbaru' => $opnameTerbaru,
            'mutasi_terbaru' => $mutasiTerbaru,
        ];
    }

    public static function sumberMutasi(StokMutasi $m): string
    {
        $referensiType = (string) $m->referensi_type;

        return match (true) {
            str_contains($referensiType, 'StokOpname') => 'opname',
            str_contains($referensiType, 'PengajuanServis') => 'request_sparepart',
            str_contains($referensiType, 'PurchaseOrder') => 'pembelian',
            str_contains($referensiType, 'ProductionSession') => 'produksi',
            default => 'manual',
        };
    }

    public static function minimumStok(BahanBaku $bahanBaku): float
    {
        return (float) ($bahanBaku->stok_minimum ?? 10);
    }

    public function getTrend(int $hari = 7): array
    {
        $hari = max(1, min(30, $hari));
        $mulai = today()->subDays($hari - 1)->toDateString();

        $mutasi = StokMutasi::query()
            ->where('tanggal', '>=', $mulai)
            ->get(['tanggal', 'tipe', 'jumlah']);

        $perTanggal = $mutasi->groupBy(fn (StokMutasi $m) => $m->tanggal->toDateString());

        $trend = [];
        for ($i = $hari - 1; $i >= 0; $i--) {
            $tanggal = today()->subDays($i)->toDateString();
            $baris = $perTanggal->get($tanggal, collect());

            $trend[] = [
                'tanggal' => $tanggal,
                'masuk' => (float) $baris->where('tipe', 'masuk')->sum('jumlah'),
                'keluar' => (float) $baris->where('tipe', 'keluar')->sum('jumlah'),
            ];
        }

        return $trend;
    }

    public function getMutasi(array $filter = []): array
    {
        $sumber = $filter['sumber'] ?? 'semua';

        $rows = $this->filterMutasiQuery($filter)
            ->with(['bahanBaku', 'titik', 'createdBy'])
            ->latest('tanggal')
            ->latest('created_at')
            ->get()
            ->filter(function (StokMutasi $m) use ($sumber) {
                return $sumber === 'semua' || self::sumberMutasi($m) === $sumber;
            });

        return $rows->map(function (StokMutasi $m) {
            $sumber = self::sumberMutasi($m);
            $referensi = $m->referensi_type
                ? class_basename((string) $m->referensi_type).' #'.$m->referensi_id
                : '-';

            return [
                'id' => $m->id,
                'bahan_baku_id' => $m->bahan_baku_id,
                'tanggal' => $m->tanggal?->toDateString() ?? '-',
                'waktu' => $m->created_at?->format('H:i') ?? '-',
                'item' => $m->bahanBaku?->nama ?? '-',
                'satuan' => $m->bahanBaku?->satuan ?? '-',
                'tipe' => $m->tipe,
                'jumlah' => (float) $m->jumlah,
                'sumber' => $sumber,
                'sumber_label' => self::SUMBER_LABELS[$sumber] ?? 'Manual',
                'referensi' => $referensi,
                'titik' => $m->titik?->nama ?? '-',
                'catatan' => $m->catatan,
                'created_by' => $m->createdBy
                    ? ($m->createdBy->nama_lengkap ?? $m->createdBy->name)
                    : 'Sistem',
            ];
        })->values()->all();
    }

    public function getKanban(array $filter = []): array
    {
        $mutasi = collect($this->getMutasi($filter));

        return [
            'masuk' => $mutasi->where('tipe', 'masuk')->take(8)->values()->all(),
            'tersedia' => collect($this->getSaldo())
                ->where('saldo', '>', 0)
                ->sortBy('saldo')
                ->take(8)
                ->values()
                ->all(),
            'keluar' => $mutasi->where('tipe', 'keluar')->take(8)->values()->all(),
        ];
    }

    public function getSaldo(): array
    {
        $bahanBakus = BahanBaku::where('aktif', true)->get();

        $saldos = StokMutasi::query()
            ->selectRaw('bahan_baku_id, sum(case when tipe = "masuk" then jumlah else -jumlah end) as saldo')
            ->groupBy('bahan_baku_id')
            ->pluck('saldo', 'bahan_baku_id');

        $terakhir = StokMutasi::query()
            ->selectRaw('bahan_baku_id, max(tanggal) as terakhir')
            ->groupBy('bahan_baku_id')
            ->pluck('terakhir', 'bahan_baku_id');

        $hargaTerbaru = $bahanBakus->mapWithKeys(function ($bahanBaku) {
            $harga = $bahanBaku->hargaBeli()
                ->where('berlaku_dari', '<=', now())
                ->where(function ($q) {
                    $q->whereNull('berlaku_sampai')->orWhere('berlaku_sampai', '>=', now());
                })
                ->orderBy('berlaku_dari', 'desc')
                ->first();

            return [$bahanBaku->id => $harga ? (float) $harga->harga : 0.0];
        });

        $saldo = $bahanBakus->map(function (BahanBaku $bahanBaku) use ($saldos, $terakhir, $hargaTerbaru) {
            $jumlah = (float) $saldos->get($bahanBaku->id, 0);
            $minimum = self::minimumStok($bahanBaku);
            $tanggalTerakhir = $terakhir->get($bahanBaku->id);

            return [
                'id' => $bahanBaku->id,
                'kode' => $bahanBaku->kode,
                'nama' => $bahanBaku->nama,
                'satuan' => $bahanBaku->satuan,
                'kategori' => $bahanBaku->kategori,
                'saldo' => $jumlah,
                'nilai' => $jumlah * $hargaTerbaru[$bahanBaku->id],
                'status' => $jumlah <= 0 ? 'Kosong' : ($jumlah <= $minimum ? 'Menipis' : 'Aman'),
                'terakhir_bergerak' => $tanggalTerakhir
                    ? Carbon::parse($tanggalTerakhir)->toDateString()
                    : null,
            ];
        })->sortBy('saldo')->values()->all();

        return $saldo;
    }

    public function getOpname(): array
    {
        $rows = StokOpname::with(['bahanBaku', 'titik'])
            ->latest('tanggal')
            ->latest('created_at')
            ->take(20)
            ->get()
            ->map(function (StokOpname $o) {
                return [
                    'id' => $o->id,
                    'bahan_baku_id' => $o->bahan_baku_id,
                    'tanggal' => $o->tanggal->toDateString(),
                    'item' => $o->bahanBaku?->nama ?? '-',
                    'satuan' => $o->bahanBaku?->satuan ?? '-',
                    'titik' => $o->titik?->nama ?? '-',
                    'saldo_sistem' => (float) $o->saldo_sistem,
                    'saldo_fisik' => (float) $o->saldo_fisik,
                    'selisih' => (float) $o->selisih,
                ];
            })
            ->sortByDesc(fn (array $o) => abs($o['selisih']) > 0 ? 1 : 0)
            ->values()
            ->all();

        return $rows;
    }

    public function getActions(array $filter = []): array
    {
        $sumber = $filter['sumber'] ?? 'semua';
        $titik = $filter['titik'] ?? 'semua';
        $kategori = $filter['kategori'] ?? 'semua';
        $rentang = (int) ($filter['rentang'] ?? 30);

        $filterAktif = $sumber !== 'semua'
            || $titik !== 'semua'
            || $kategori !== 'semua'
            || $rentang !== 30;

        $saldo = collect($this->getSaldo());
        $opname = collect($this->getOpname());

        if ($filterAktif) {
            $ids = collect($this->getMutasi($filter))
                ->pluck('bahan_baku_id')
                ->filter()
                ->unique()
                ->all();

            $saldo = $saldo->whereIn('id', $ids);
            $opname = $opname->whereIn('bahan_baku_id', $ids);
        }

        $actions = [];

        foreach ($opname->where('selisih', '!=', 0)->take(3) as $o) {
            $tanda = $o['selisih'] > 0 ? '+' : '';
            $actions[] = [
                'id' => 'opname-'.$o['id'],
                'prioritas' => 1,
                'judul' => 'Periksa selisih opname',
                'detail' => $o['item'].': selisih '.$tanda.$o['selisih'].' '.$o['satuan'],
                'href' => route('inventory.stok-opname.index'),
                'label' => 'Lihat opname',
            ];
        }

        $menipis = $saldo->whereIn('status', ['Kosong', 'Menipis']);
        if ($menipis->isNotEmpty()) {
            $actions[] = [
                'id' => 'stok-menipis',
                'prioritas' => 2,
                'judul' => 'Buat/cek PO',
                'detail' => $menipis->count().' item berada di bawah stok minimum',
                'href' => route('procurement.bahan-baku.index'),
                'label' => 'Lihat stok',
            ];
        }

        $poPending = PurchaseOrder::whereIn('status', [
            'menunggu_approval_finance',
            'menunggu_approval_owner',
        ])->count();

        if ($poPending > 0) {
            $actions[] = [
                'id' => 'po-pending',
                'prioritas' => 3,
                'judul' => 'Cek persetujuan PO',
                'detail' => $poPending.' PO menunggu persetujuan',
                'href' => route('procurement.purchase-orders.approval-queue'),
                'label' => 'Buka antrean',
            ];
        }

        $slow = $saldo->filter(function (array $item) {
            if (! $item['terakhir_bergerak']) {
                return true;
            }

            return Carbon::parse($item['terakhir_bergerak'])->lt(today()->subDays(30));
        });

        if ($slow->isNotEmpty()) {
            $actions[] = [
                'id' => 'slow-moving',
                'prioritas' => 4,
                'judul' => 'Evaluasi slow moving',
                'detail' => $slow->count().' item tanpa mutasi lebih dari 30 hari',
                'href' => route('inventory.dashboard'),
                'label' => 'Lihat saldo',
            ];
        }

        return collect($actions)
            ->sortBy('prioritas')
            ->take(8)
            ->values()
            ->all();
    }

    private function filterMutasiQuery(array $filter): Builder
    {
        $query = StokMutasi::query()
            ->where('tanggal', '>=', today()->subDays((int) ($filter['rentang'] ?? 30)));

        if (($filter['titik'] ?? 'semua') !== 'semua') {
            $query->where('titik_id', $filter['titik']);
        }

        if (($filter['kategori'] ?? 'semua') !== 'semua') {
            $query->whereHas('bahanBaku', function (Builder $q) use ($filter) {
                $q->where('kategori', $filter['kategori']);
            });
        }

        return $query;
    }
}
