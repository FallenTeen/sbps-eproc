<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Actions\GetPiutangOutstandingAction;
use App\Domain\Finance\Actions\RecordClientPaymentAction;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\PembayaranKlien;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PembayaranKlienController extends Controller
{
    public function index(Request $request, Invoice $invoice)
    {
        $this->authorize('viewAny', PembayaranKlien::class);

        $invoice->load(['unitBisnis', 'proyek', 'items', 'pembayaranKlien.akunKasBank']);

        $total = (float) $invoice->items->sum('subtotal');
        $totalBayar = (float) $invoice->pembayaranKlien->sum('jumlah');
        $sisa = max(0, $total - $totalBayar);

        $akunKasList = AkunKasBank::where('aktif', true)
            ->when($invoice->unit_bisnis_id, fn ($q) => $q->where('unit_bisnis_id', $invoice->unit_bisnis_id))
            ->get(['id', 'nama', 'jenis_kas']);

        return Inertia::render('Finance/PembayaranKlien/Index', [
            'invoice' => [
                'id' => $invoice->id,
                'kode_invoice' => $invoice->kode_invoice,
                'unit_bisnis' => $invoice->unitBisnis ? $invoice->unitBisnis->nama : '-',
                'proyek' => $invoice->proyek ? $invoice->proyek->nama : '-',
                'status' => $invoice->status,
                'tanggal_terbit' => $invoice->tanggal_terbit ? $invoice->tanggal_terbit->format('Y-m-d') : null,
                'tanggal_jatuh_tempo' => $invoice->tanggal_jatuh_tempo ? $invoice->tanggal_jatuh_tempo->format('Y-m-d') : null,
                'pembayarans' => $invoice->pembayaranKlien->map(fn ($p) => [
                    'id' => $p->id,
                    'tanggal' => $p->tanggal ? $p->tanggal->format('Y-m-d') : null,
                    'jumlah' => (float) $p->jumlah,
                    'metode' => $p->metode,
                    'akun_kas' => $p->akunKasBank ? $p->akunKasBank->nama : '-',
                    'dokumen_bukti' => $p->dokumen_bukti,
                    'catatan' => $p->catatan,
                ]),
                'summary' => [
                    'total' => $total,
                    'total_bayar' => $totalBayar,
                    'sisa' => $sisa,
                ],
            ],
            'akunKasList' => $akunKasList,
        ]);
    }

    public function store(Request $request, ?Invoice $invoice = null)
    {
        $this->authorize('create', PembayaranKlien::class);

        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'tanggal' => 'required|date',
            'jumlah' => 'required|numeric|min:1',
            'metode' => 'required|string|max:50',
            'akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'catatan' => 'nullable|string',
        ]);

        $targetInvoice = $invoice && $invoice->id ? $invoice : Invoice::findOrFail($validated['invoice_id']);

        (new RecordClientPaymentAction)->execute($targetInvoice, $validated);

        return redirect()->back()->with('success', 'Pembayaran klien berhasil dicatat.');
    }

    public function outstanding(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $unitBisnisId = $request->input('unit_bisnis_id');
        $proyekId = $request->input('proyek_id');

        $totalOutstanding = (new GetPiutangOutstandingAction)->execute($proyekId, $unitBisnisId);

        $query = Invoice::where('status', '!=', 'lunas')
            ->with(['unitBisnis:id,nama', 'proyek:id,nama', 'items', 'pembayaranKlien'])
            ->when($unitBisnisId, fn ($q) => $q->where('unit_bisnis_id', $unitBisnisId))
            ->when($proyekId, fn ($q) => $q->where('proyek_id', $proyekId))
            ->orderBy('tanggal_jatuh_tempo', 'asc');

        $today = Carbon::today();
        $aging0to30 = 0;
        $aging31to60 = 0;
        $agingOver60 = 0;

        $invoices = $query->get()->map(function ($invoice) use ($today, &$aging0to30, &$aging31to60, &$agingOver60) {
            $total = (float) $invoice->items->sum('subtotal');
            $paid = (float) $invoice->pembayaranKlien->sum('jumlah');
            $sisa = max(0, $total - $paid);

            $dueDate = $invoice->tanggal_jatuh_tempo ? Carbon::parse($invoice->tanggal_jatuh_tempo) : $today;
            // Calculate days overdue (or age of invoice)
            $ageDays = max(0, (int) $dueDate->diffInDays($today, false));

            if ($ageDays <= 30) {
                $agingCategory = '0-30 Hari';
                $aging0to30 += $sisa;
            } elseif ($ageDays <= 60) {
                $agingCategory = '31-60 Hari';
                $aging31to60 += $sisa;
            } else {
                $agingCategory = '>60 Hari';
                $agingOver60 += $sisa;
            }

            return [
                'id' => $invoice->id,
                'kode_invoice' => $invoice->kode_invoice,
                'unit_bisnis' => $invoice->unitBisnis ? $invoice->unitBisnis->nama : '-',
                'proyek_klien' => $invoice->proyek ? $invoice->proyek->nama : ($invoice->catatan ?? '-'),
                'tanggal_terbit' => $invoice->tanggal_terbit ? $invoice->tanggal_terbit->format('Y-m-d') : null,
                'tanggal_jatuh_tempo' => $invoice->tanggal_jatuh_tempo ? $invoice->tanggal_jatuh_tempo->format('Y-m-d') : null,
                'status' => $invoice->status,
                'total' => $total,
                'paid' => $paid,
                'sisa' => $sisa,
                'age_days' => $ageDays,
                'aging_category' => $agingCategory,
            ];
        });

        return Inertia::render('Finance/Invoice/Outstanding', [
            'invoices' => $invoices,
            'unitBisnisList' => UnitBisnis::all(['id', 'nama']),
            'proyekList' => Proyek::all(['id', 'nama']),
            'summary' => [
                'total_outstanding' => $totalOutstanding,
                'aging_0_30' => $aging0to30,
                'aging_31_60' => $aging31to60,
                'aging_over_60' => $agingOver60,
            ],
            'filters' => [
                'unit_bisnis_id' => $unitBisnisId ?? '',
                'proyek_id' => $proyekId ?? '',
            ],
        ]);
    }
}
