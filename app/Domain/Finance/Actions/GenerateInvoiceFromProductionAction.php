<?php
namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\Invoice;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use Illuminate\Support\Facades\Auth;

class GenerateInvoiceFromProductionAction
{
    public function execute(string $proyekId, array $sessionIdsOrOptions = null): Invoice
    {
        $sessionIds = null;
        $options = [];
        if (is_array($sessionIdsOrOptions)) {
            if (isset($sessionIdsOrOptions[0]) && is_string($sessionIdsOrOptions[0])) {
                $sessionIds = $sessionIdsOrOptions;
            } else {
                $options = $sessionIdsOrOptions;
                $sessionIds = $options['session_ids'] ?? null;
            }
        }

        $query = ProductionSession::whereHas('titik', function ($q) use ($proyekId) {
            $q->where('proyek_id', $proyekId);
        })
            ->where('status', 'selesai')
            ->whereDoesntHave('invoiceItems') // belum ditagih
            ->when($sessionIds, fn($q) => $q->whereIn('id', $sessionIds));

        $sessions = $query->get();

        $proyek = \App\Domain\Core\Models\Proyek::findOrFail($proyekId);

        $invoice = Invoice::create([
            'unit_bisnis_id' => $proyek->unit_bisnis_id,
            'proyek_id' => $proyekId,
            'kode_invoice' => 'INV-' . date('Ymd') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT),
            'status' => 'draft',
            'tanggal_terbit' => $options['tanggal_terbit'] ?? now(),
            'tanggal_jatuh_tempo' => isset($options['termin_pembayaran_hari']) ? now()->addDays($options['termin_pembayaran_hari']) : now()->addDays(30),
            'catatan' => $options['catatan'] ?? null,
            'created_by' => $options['created_by'] ?? Auth::id(),
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
