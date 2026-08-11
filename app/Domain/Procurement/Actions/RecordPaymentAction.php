<?php
namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\States\DibayarSebagian;
use App\Domain\Procurement\States\Lunas;
use App\Domain\Finance\Models\MutasiKasBank;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RecordPaymentAction
{
    public function execute(PurchaseOrder $po, array $data): Pembayaran
    {
        return DB::transaction(function () use ($po, $data) {
            $pembayaran = Pembayaran::create([
                'purchase_order_id' => $po->id,
                'jumlah' => $data['jumlah'],
                'tanggal' => $data['tanggal'] ?? now(),
                'metode' => $data['metode'],
                'akun_kas_bank_id' => $data['akun_kas_bank_id'],
                'dicatat_oleh' => Auth::id(),
                'catatan' => $data['catatan'] ?? null,
            ]);

            // Update status PO
            $totalDibayar = $po->pembayaran->sum('jumlah');
            if ($totalDibayar >= $po->total) {
                $po->status->transitionTo(Lunas::class);
            } else {
                $po->status->transitionTo(DibayarSebagian::class);
            }

            // Catat mutasi kas (keluar)
            MutasiKasBank::create([
                'akun_kas_bank_id' => $data['akun_kas_bank_id'],
                'kategori' => 'PEMBAYARAN MATERIAL',
                'tipe' => 'keluar',
                'jumlah' => $data['jumlah'],
                'referensi_type' => Pembayaran::class,
                'referensi_id' => $pembayaran->id,
                'tanggal' => $data['tanggal'] ?? now(),
                'catatan' => "Pembayaran PO {$po->kode_po}",
                'created_by' => Auth::id(),
            ]);

            return $pembayaran;
        });
    }
}
