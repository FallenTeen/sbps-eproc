<?php

namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\Invoice;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseBiayaLain;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GenerateInvoiceFromRitaseAction
{
    /**
     * Generate invoice dari ritase yang sudah disetujui dan belum ditagih.
     *
     * @param int $proyekId ID proyek (optional, bisa null jika customer eksternal)
     * @param string|null $customer Nama customer eksternal (jika tidak terkait proyek)
     * @param array|null $ritaseIds Array ID ritase spesifik (jika null, ambil semua yang belum ditagih)
     * @param int|null $unitBisnisId Untuk memastikan unit bisnis sesuai
     * @return Invoice
     */
    public function execute(
        ?int $proyekId = null,
        ?string $customer = null,
        ?array $ritaseIds = null,
        ?int $unitBisnisId = null
    ): Invoice {
        // Query ritase yang eligible
        $query = Ritase::where('status', 'disetujui')
            ->whereNull('invoice_id') // Belum pernah ditagih
            ->when($proyekId, function ($q) use ($proyekId) {
                return $q->where('proyek_id', $proyekId);
            })
            ->when($customer, function ($q) use ($customer) {
                return $q->where('customer', $customer);
            })
            ->when($ritaseIds, function ($q) use ($ritaseIds) {
                return $q->whereIn('id', $ritaseIds);
            });

        // Jika unitBisnisId diberikan, filter melalui relasi armada
        if ($unitBisnisId) {
            $query->whereHas('armada', function ($q) use ($unitBisnisId) {
                $q->where('unit_bisnis_id', $unitBisnisId);
            });
        }

        $ritases = $query->get();

        if ($ritases->isEmpty()) {
            throw new \Exception('Tidak ada ritase yang dapat ditagih.');
        }

        // Ambil unit bisnis dari ritase pertama (asumsi semua ritase dalam satu unit)
        $unitBisnisId = $unitBisnisId ?? $ritases->first()->armada->unit_bisnis_id;

        // Buat invoice
        $invoice = DB::transaction(function () use ($ritases, $proyekId, $unitBisnisId, $customer) {
            $invoice = Invoice::create([
                'unit_bisnis_id' => $unitBisnisId,
                'proyek_id' => $proyekId,
                'kode_invoice' => $this->generateInvoiceCode($unitBisnisId),
                'tanggal_terbit' => now(),
                'tanggal_jatuh_tempo' => now()->addDays(30),
                'created_by' => Auth::id(),
                'catatan' => $customer ? "Invoice untuk customer eksternal: {$customer}" : null,
            ]);

            // Tambahkan item per ritase atau kelompokkan berdasarkan rute/kategori?
            // Di sini kita buat satu item per ritase, atau bisa dikelompokkan.
            // Sesuai manual, satu baris invoice bisa mewakili satu transaksi sumber.
            foreach ($ritases as $ritase) {
                $deskripsi = "Ritase {$ritase->kategori} - {$ritase->armada->plat_nomor} - {$ritase->jumlah_rit} rit";
                $subtotal = $ritase->total_upah_rit + $ritase->biayaLain->sum('jumlah');

                $invoice->items()->create([
                    'deskripsi' => $deskripsi,
                    'referensi_type' => Ritase::class,
                    'referensi_id' => $ritase->id,
                    'jumlah' => $ritase->jumlah_rit,
                    'harga_satuan' => $ritase->tarif_per_rit_snapshot,
                    'subtotal' => $subtotal,
                ]);

                // Tandai ritase sebagai sudah ditagih
                $ritase->update(['status' => 'ditagih', 'invoice_id' => $invoice->id]);
            }

            return $invoice;
        });

        return $invoice->load('items');
    }

    /**
     * Generate kode invoice unik per unit bisnis.
     */
    private function generateInvoiceCode(int $unitBisnisId): string
    {
        $unitKode = \App\Domain\Core\Models\UnitBisnis::find($unitBisnisId)->kode;
        $year = date('Y');
        $lastInvoice = Invoice::where('unit_bisnis_id', $unitBisnisId)
            ->whereYear('created_at', $year)
            ->latest('created_at')
            ->first();

        $sequence = $lastInvoice ? intval(substr($lastInvoice->kode_invoice, -3)) + 1 : 1;
        $sequence = str_pad($sequence, 3, '0', STR_PAD_LEFT);

        return "INV-{$unitKode}-{$year}-{$sequence}";
    }
}
