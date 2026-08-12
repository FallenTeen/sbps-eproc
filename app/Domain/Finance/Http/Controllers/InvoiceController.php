<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Proyek;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\Finance\Actions\GenerateInvoiceFromProductionAction;
use App\Domain\Finance\Actions\GenerateInvoiceFromRitaseAction;
use App\Domain\Finance\Actions\GenerateInvoiceFromSewaAlatAction;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status');
        $unitBisnisId = $request->input('unit_bisnis_id');

        $invoices = Invoice::query()
            ->with(['unitBisnis:id,nama', 'proyek:id,nama', 'items', 'pembayaranKlien'])
            ->when($status && $status !== 'all', function ($q) use ($status) {
                return $q->where('status', $status);
            })
            ->when($unitBisnisId, function ($q) use ($unitBisnisId) {
                return $q->where('unit_bisnis_id', $unitBisnisId);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($invoice) {
                $total = $invoice->items->sum('subtotal');
                $totalBayar = $invoice->pembayaranKlien->sum('jumlah');
                $sisa = max(0, $total - $totalBayar);

                return [
                    'id' => $invoice->id,
                    'kode_invoice' => $invoice->kode_invoice,
                    'unit_bisnis' => $invoice->unitBisnis ? $invoice->unitBisnis->nama : '-',
                    'proyek_klien' => $invoice->proyek ? $invoice->proyek->nama : ($invoice->catatan ?? '-'),
                    'tanggal_terbit' => $invoice->tanggal_terbit ? $invoice->tanggal_terbit->format('Y-m-d') : null,
                    'tanggal_jatuh_tempo' => $invoice->tanggal_jatuh_tempo ? $invoice->tanggal_jatuh_tempo->format('Y-m-d') : null,
                    'status' => $invoice->status,
                    'total' => $total,
                    'total_bayar' => $totalBayar,
                    'sisa' => $sisa,
                ];
            });

        return Inertia::render('Finance/Invoice/Index', [
            'invoices' => $invoices,
            'unitBisnisList' => UnitBisnis::all(['id', 'nama']),
            'filters' => [
                'status' => $status ?? 'all',
                'unit_bisnis_id' => $unitBisnisId ?? '',
            ],
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('Finance/Invoice/Create', [
            'unitBisnisList' => UnitBisnis::all(['id', 'nama', 'kode']),
            'proyekList' => Proyek::all(['id', 'nama', 'unit_bisnis_id']),
        ]);
    }

    public function unbilledItems(Request $request)
    {
        $unitBisnisId = $request->input('unit_bisnis_id');
        $proyekId = $request->input('proyek_id');
        $sumber = $request->input('sumber_tagihan'); // produksi, ritase, sewa_alat

        $items = [];

        if ($sumber === 'produksi') {
            $query = ProductionSession::where('status', 'selesai')
                ->whereDoesntHave('invoiceItems')
                ->when($proyekId, fn($q) => $q->where('proyek_id', $proyekId))
                ->with(['produk']);

            $sessions = $query->get();
            $calcAction = new CalculateProductionRevenueAction();

            foreach ($sessions as $session) {
                $revenue = $calcAction->execute($session);
                $items[] = [
                    'id' => $session->id,
                    'deskripsi' => "Produksi {$session->produk->nama} - " . date('d/m/Y', strtotime($session->tanggal)),
                    'jumlah' => (float)$session->hasil_output,
                    'harga_satuan' => $session->hasil_output > 0 ? (float)($revenue / $session->hasil_output) : 0,
                    'subtotal' => (float)$revenue,
                ];
            }
        } elseif ($sumber === 'ritase') {
            $query = Ritase::where('status', 'disetujui')
                ->whereNull('invoice_id')
                ->when($proyekId, fn($q) => $q->where('proyek_id', $proyekId))
                ->when($unitBisnisId, fn($q) => $q->whereHas('armada', fn($a) => $a->where('unit_bisnis_id', $unitBisnisId)))
                ->with(['armada', 'biayaLain']);

            $ritases = $query->get();
            foreach ($ritases as $ritase) {
                $subtotal = (float)($ritase->total_upah_rit + $ritase->biayaLain->sum('jumlah'));
                $items[] = [
                    'id' => $ritase->id,
                    'deskripsi' => "Ritase {$ritase->kategori} - " . ($ritase->armada ? $ritase->armada->plat_nomor : '') . " ({$ritase->jumlah_rit} rit)",
                    'jumlah' => (float)$ritase->jumlah_rit,
                    'harga_satuan' => (float)$ritase->tarif_per_rit_snapshot,
                    'subtotal' => $subtotal,
                ];
            }
        } elseif ($sumber === 'sewa_alat') {
            $query = SewaAlatJam::where('status', 'disetujui')
                ->whereNull('invoice_id')
                ->when($proyekId, fn($q) => $q->where('proyek_id', $proyekId))
                ->when($unitBisnisId, fn($q) => $q->whereHas('armada', fn($a) => $a->where('unit_bisnis_id', $unitBisnisId)))
                ->with(['armada']);

            $sewas = $query->get();
            foreach ($sewas as $sewa) {
                $subtotal = (float)($sewa->jumlah_jam * $sewa->harga_per_jam_snapshot);
                $items[] = [
                    'id' => $sewa->id,
                    'deskripsi' => "Sewa " . ($sewa->armada ? $sewa->armada->nama : 'Alat') . " - " . date('d/m/Y', strtotime($sewa->tanggal)) . " ({$sewa->jumlah_jam} jam)",
                    'jumlah' => (float)$sewa->jumlah_jam,
                    'harga_satuan' => (float)$sewa->harga_per_jam_snapshot,
                    'subtotal' => $subtotal,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'items' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'proyek_id' => 'nullable|exists:proyeks,id',
            'sumber_tagihan' => 'required|in:produksi,ritase,sewa_alat',
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'string',
            'tanggal_jatuh_tempo' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        $proyekId = $validated['proyek_id'] ? (int)$validated['proyek_id'] : null;
        $unitBisnisId = (int)$validated['unit_bisnis_id'];
        $itemIds = $validated['item_ids'];

        if ($validated['sumber_tagihan'] === 'produksi') {
            $invoice = (new GenerateInvoiceFromProductionAction())->execute($proyekId, $itemIds);
        } elseif ($validated['sumber_tagihan'] === 'ritase') {
            $invoice = (new GenerateInvoiceFromRitaseAction())->execute($proyekId, null, $itemIds, $unitBisnisId);
        } else {
            $invoice = (new GenerateInvoiceFromSewaAlatAction())->execute($proyekId, null, $itemIds, $unitBisnisId);
        }

        // Update due date and notes if customized
        $invoice->update([
            'tanggal_jatuh_tempo' => $validated['tanggal_jatuh_tempo'],
            'catatan' => $validated['catatan'] ?? $invoice->catatan,
        ]);

        return redirect()->route('finance.invoice.show', $invoice->id)->with('success', 'Invoice berhasil dibuat.');
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['unitBisnis', 'proyek', 'items', 'pembayaranKlien.akunKasBank']);

        $total = (float)$invoice->items->sum('subtotal');
        $totalBayar = (float)$invoice->pembayaranKlien->sum('jumlah');
        $sisa = max(0, $total - $totalBayar);

        $akunKasList = AkunKasBank::where('aktif', true)
            ->when($invoice->unit_bisnis_id, function ($q) use ($invoice) {
                return $q->where('unit_bisnis_id', $invoice->unit_bisnis_id);
            })
            ->get(['id', 'nama', 'jenis_kas']);

        return Inertia::render('Finance/Invoice/Show', [
            'invoice' => [
                'id' => $invoice->id,
                'kode_invoice' => $invoice->kode_invoice,
                'unit_bisnis_id' => $invoice->unit_bisnis_id,
                'unit_bisnis' => $invoice->unitBisnis ? $invoice->unitBisnis->nama : '-',
                'proyek' => $invoice->proyek ? $invoice->proyek->nama : '-',
                'catatan' => $invoice->catatan,
                'status' => $invoice->status,
                'tanggal_terbit' => $invoice->tanggal_terbit ? $invoice->tanggal_terbit->format('Y-m-d') : null,
                'tanggal_jatuh_tempo' => $invoice->tanggal_jatuh_tempo ? $invoice->tanggal_jatuh_tempo->format('Y-m-d') : null,
                'items' => $invoice->items,
                'pembayarans' => $invoice->pembayaranKlien->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'tanggal' => $p->tanggal ? $p->tanggal->format('Y-m-d') : null,
                        'jumlah' => (float)$p->jumlah,
                        'metode' => $p->metode,
                        'akun_kas' => $p->akunKasBank ? $p->akunKasBank->nama : '-',
                        'dokumen_bukti' => $p->dokumen_bukti,
                        'catatan' => $p->catatan,
                    ];
                }),
                'summary' => [
                    'total' => $total,
                    'total_bayar' => $totalBayar,
                    'sisa' => $sisa,
                ],
            ],
            'akunKasList' => $akunKasList,
        ]);
    }

    public function send(Invoice $invoice)
    {
        $invoice->update(['status' => 'terkirim']);
        return redirect()->back()->with('success', 'Invoice berhasil diubah statusnya menjadi Terkirim.');
    }

    public function getSumberTagihan(Request $request)
    {
        return $this->unbilledItems($request);
    }
}
