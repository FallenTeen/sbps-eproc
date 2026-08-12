<?php
namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\Invoice;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use Illuminate\Support\Facades\Auth;

class GenerateInvoiceFromProductionAction
{
    public function execute(int $proyekId, array $sessionIds = null): Invoice
    {
        $query = ProductionSession::where('proyek_id', $proyekId)
            ->where('status', 'selesai')
            ->whereDoesntHave('invoiceItems') // belum ditagih
            ->when($sessionIds, fn($q) => $q->whereIn('id', $sessionIds));

        $sessions = $query->get();

        $invoice = Invoice::create([
            'unit_bisnis_id' => $sessions->first()->produk->unit_bisnis_id ?? null,
            'proyek_id' => $proyekId,
            'kode_invoice' => 'INV-' . date('Ymd') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT),
            'tanggal_terbit' => now(),
            'tanggal_jatuh_tempo' => now()->addDays(30),
            'created_by' => Auth::id(),
        ]);

        foreach ($sessions as $session) {
            $revenue = (new CalculateProductionRevenueAction())->execute($session);
            $invoice->items()->create([
                'deskripsi' => "Produksi {$session->produk->nama} - {$session->hasil_output} {$session->produk->satuan_output}",
                'referensi_type' => ProductionSession::class,
                'referensi_id' => $session->id,
                'jumlah' => $session->hasil_output,
                'harga_satuan' => $revenue / $session->hasil_output,
                'subtotal' => $revenue,
            ]);
        }

        return $invoice;
    }
}
