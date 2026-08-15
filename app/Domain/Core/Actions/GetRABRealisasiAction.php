<?php
namespace App\Domain\Core\Actions;

use App\Domain\Core\Models\Rab;
use App\Domain\Procurement\Models\PurchaseOrderItem;
use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Production\Models\ProductionSessionItem;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\HR\Models\GajiPeriode;
use Illuminate\Support\Facades\DB;

class GetRABRealisasiAction
{
    public function execute(Rab $rab): float
    {
        $proyekId = $rab->proyek_id;
        $titikId = $rab->titik_id;
        $kategori = $rab->kategori;

        return match ($kategori) {
            'bahan_baku' => $this->realisasiBahanBaku($proyekId, $titikId),
            'sparepart' => $this->realisasiSparepart($proyekId, $titikId),
            'sdm_tetap', 'sdm_kondisional' => $this->realisasiSDM($proyekId, $titikId, $kategori),
            'lainnya' => $this->realisasiLainnya($proyekId, $titikId),
            default => 0,
        };
    }

    private function realisasiBahanBaku($proyekId, $titikId): float
    {
        // Dari PO yang sudah diterima (stok masuk) untuk bahan baku.
        // Jika RAB di level proyek (titik_id null), filter hanya berdasarkan proyek_id.
        // Jika RAB di level titik, filter juga berdasarkan titik_id.
        $query = PurchaseOrderItem::whereHas('purchaseOrder', function ($q) use ($proyekId, $titikId) {
            $q->where('proyek_id', $proyekId)
                ->whereIn('status', ['diterima', 'dibayar_sebagian', 'lunas']);

            if ($titikId !== null) {
                $q->where('titik_id', $titikId);
            }
        })
            ->whereHas('bahanBaku', function ($q) {
                $q->where('kategori', 'bahan_baku');
            })
            ->sum('subtotal');

        return (float) $query;
    }

    private function realisasiSparepart($proyekId, $titikId): float
    {
        // Dari service_history.biaya (untuk armada/mesin di titik ini)
        // service_history polymorphic, kita ambil berdasarkan titik yang terkait dengan armada/mesin
        // Kita perlu relasi: armada/mesin punya titik_id
        // Asumsi: service_history memiliki relasi ke serviceable (armada/mesin) dan kita filter titik_id
        return ServiceHistory::whereHas('serviceable', function ($q) use ($titikId) {
            $q->where('titik_id', $titikId);
        })->sum('biaya');
    }

    private function realisasiSDM($proyekId, $titikId, $kategori): float
    {
        // Dari gaji_periode untuk karyawan yang ditugaskan di titik proyek ini.
        // RAB level titik: filter assignment di titik tersebut.
        // RAB level proyek (titik_id null): filter assignment di semua titik milik proyek.
        $tipe = $kategori === 'sdm_tetap' ? 'tetap' : 'kondisional';

        $query = GajiPeriode::whereHas('karyawan', function ($q) use ($proyekId, $titikId, $tipe) {
            $q->where('tipe', $tipe);

            if ($titikId !== null) {
                $q->whereHas('assignments', function ($q2) use ($titikId) {
                    $q2->where('titik_id', $titikId);
                });
            } else {
                $q->whereHas('assignments', function ($q2) use ($proyekId) {
                    $q2->whereHas('titik', function ($q3) use ($proyekId) {
                        $q3->where('proyek_id', $proyekId);
                    });
                });
            }
        })->sum('total_gaji');

        return (float) $query;
    }

    private function realisasiLainnya($proyekId, $titikId): float
    {
        // Dari pengeluaran manual (tabel pengeluaran) yang belum dibuat
        return 0;
    }
}
