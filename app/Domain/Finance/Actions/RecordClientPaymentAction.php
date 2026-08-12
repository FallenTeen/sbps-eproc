<?php
namespace App\Domain\Finance\Actions;
use App\Domain\Finance\Models\PembayaranKlien;
use App\Domain\Finance\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Domain\Finance\Models\MutasiKasBank;

class RecordClientPaymentAction
{
    public function execute(Invoice $invoice, array $data): PembayaranKlien
    {
        return DB::transaction(function () use ($invoice, $data) {
            $payment = PembayaranKlien::create([
                'invoice_id' => $invoice->id,
                'tanggal' => $data['tanggal'],
                'jumlah' => $data['jumlah'],
                'metode' => $data['metode'] ?? null,
                'akun_kas_bank_id' => $data['akun_kas_bank_id'],
                'dicatat_oleh' => Auth::id(),
                'dokumen_bukti' => $data['dokumen_bukti'] ?? null,
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Update status invoice
            $totalPaid = $invoice->pembayaranKlien->sum('jumlah');
            if ($totalPaid >= $invoice->items->sum('subtotal')) {
                $invoice->update(['status' => 'lunas']);
            } else {
                $invoice->update(['status' => 'lunas_sebagian']);
            }

            // Catat mutasi kas (masuk)
            MutasiKasBank::create([
                'akun_kas_bank_id' => $data['akun_kas_bank_id'],
                'kategori' => 'PENERIMAAN PIUTANG',
                'tipe' => 'masuk',
                'jumlah' => $data['jumlah'],
                'referensi_type' => PembayaranKlien::class,
                'referensi_id' => $payment->id,
                'tanggal' => $data['tanggal'],
                'catatan' => "Pembayaran invoice {$invoice->kode_invoice}",
                'created_by' => Auth::id(),
            ]);

            return $payment;
        });
    }
}
