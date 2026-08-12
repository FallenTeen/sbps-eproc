<?php

namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\Invoice;
use App\Domain\Fleet\Models\SewaAlatJam;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GenerateInvoiceFromSewaAlatAction
{
    /**
     * Generate invoice dari sewa alat yang sudah disetujui dan belum ditagih.
     *
     * @param int $proyekId ID proyek (optional)
     * @param string|null $penyewaEksternal Nama penyewa eksternal (jika tidak terkait proyek)
     * @param array|null $sewaIds Array ID sewa spesifik
     * @param int|null $unitBisnisId Untuk memastikan unit bisnis sesuai
     * @return Invoice
     */
    public function execute(
        ?int $proyekId = null,
        ?string $penyewaEksternal = null,
        ?array $sewaIds = null,
        ?int $unitBisnisId = null
    ): Invoice {
        // Query sewa yang eligible
        $query = SewaAlatJam::where('status', 'disetujui')
            ->whereNull('invoice_id') // Belum pernah ditagih
            ->when($proyekId, function ($q) use ($proyekId) {
                return $q->where('proyek_id', $proyekId);
            })
            ->when($penyewaEksternal, function ($q) use ($penyewaEksternal) {
                return $q->where('penyewa_eksternal', $penyewaEksternal);
            })
            ->when($sewaIds, function ($q) use ($sewaIds) {
                return $q->whereIn('id', $sewaIds);
            });

        // Filter unit bisnis
        if ($unitBisnisId) {
            $query->whereHas('armada', function ($q) use ($unitBisnisId) {
                $q->where('unit_bisnis_id', $unitBisnisId);
            });
        }

        $sewaList = $query->get();

        if ($sewaList->isEmpty()) {
            throw new \Exception('Tidak ada sewa alat yang dapat ditagih.');
        }

        // Ambil unit bisnis
        $unitBisnisId = $unitBisnisId ?? $sewaList->first()->armada->unit_bisnis_id;

        // Buat invoice
        $invoice = DB::transaction(function () use ($sewaList, $proyekId, $unitBisnisId, $penyewaEksternal) {
            $invoice = Invoice::create([
                'unit_bisnis_id' => $unitBisnisId,
                'proyek_id' => $proyekId,
                'kode_invoice' => $this->generateInvoiceCode($unitBisnisId),
                'tanggal_terbit' => now(),
                'tanggal_jatuh_tempo' => now()->addDays(30),
                'created_by' => Auth::id(),
                'catatan' => $penyewaEksternal ? "Sewa untuk pihak eksternal: {$penyewaEksternal}" : null,
            ]);

            foreach ($sewaList as $sewa) {
                $subtotal = $sewa->jumlah_jam * $sewa->harga_per_jam_snapshot;
                $deskripsi = "Sewa {$sewa->armada->nama} - {$sewa->tanggal} - {$sewa->jumlah_jam} jam";

                $invoice->items()->create([
                    'deskripsi' => $deskripsi,
                    'referensi_type' => SewaAlatJam::class,
                    'referensi_id' => $sewa->id,
                    'jumlah' => $sewa->jumlah_jam,
                    'harga_satuan' => $sewa->harga_per_jam_snapshot,
                    'subtotal' => $subtotal,
                ]);

                // Tandai sewa sebagai sudah ditagih
                $sewa->update(['status' => 'ditagih', 'invoice_id' => $invoice->id]);
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
