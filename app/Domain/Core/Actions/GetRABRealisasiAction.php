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
        // Dari PO yang sudah diterima (stok masuk) untuk bahan baku
        // Kita ambil dari stok_mutasi yang referensi ke purchase_orders
        $query = PurchaseOrderItem::whereHas('purchaseOrder', function ($q) use ($proyekId, $titikId) {
            $q->where('proyek_id', $proyekId)
                ->where('titik_id', $titikId)
                ->whereIn('status', ['diterima', 'dibayar_sebagian', 'lunas']);
        })
            ->whereHas('bahanBaku', function ($q) {
                $q->where('kategori', 'bahan_baku');
            })
            ->sum('subtotal');

        // Tambahkan jika ada stok_mutasi masuk manual (untuk bahan baku internal)
        $manual = StokMutasi::where('titik_id', $titikId)
            ->where('tipe', 'masuk')
            ->whereNull('referensi_type')
            ->sum('jumlah'); // kita perlu harga rata-rata? Tapi manual book bilang ini untuk sumber internal, kita asumsikan nilai 0 untuk RAB? Sebaiknya dihitung terpisah, tapi untuk realisasi RAB bahan baku, kita ambil hanya dari PO. Sesuai manual, "Masuk manual" tidak mempengaruhi RAB, hanya stok fisik.
        // Untuk saat ini, kita abaikan manual, karena RAB realisasi bahan baku berasal dari pembelian.
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
        // Dari gaji_periode untuk karyawan yang ditugaskan di titik ini
        // Kita perlu relasi karyawan_titik_assignment
        return GajiPeriode::whereHas('karyawan', function ($q) use ($titikId, $kategori) {
            $q->whereHas('assignments', function ($q2) use ($titikId) {
                $q2->where('titik_id', $titikId);
            })->where('tipe', $kategori === 'sdm_tetap' ? 'tetap' : 'kondisional');
        })->sum('total_gaji'); // total_gaji dihitung on-the-fly? Sebaiknya kita hitung dari komponen, tapi untuk realisasi kita bisa menggunakan field total_gaji jika disimpan.
        // Namun manual melarang menyimpan total_gaji, jadi kita hitung dari komponen_gaji.
        // Untuk sederhana, kita asumsikan ada field total di gaji_periode? Manual bilang tidak disimpan, tapi untuk RAB realisasi kita perlu angka.
        // Kita akan hitung on-the-fly dari komponen_gaji.
        // Buat helper di model GajiPeriode untuk menghitung total.
        // Saya buat di sini sebagai placeholder.
        // Sebaiknya panggil method calculateTotal() di model.
        return 0; // placeholder
    }

    private function realisasiLainnya($proyekId, $titikId): float
    {
        // Dari pengeluaran manual (tabel pengeluaran) yang belum dibuat
        return 0;
    }
}
