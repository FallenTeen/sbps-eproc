<?php
namespace App\Http\Controllers;

use App\Domain\Core\Models\Proyek;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Finance\Models\Invoice;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller {
    public function index() {
        $user = Auth::user();
        $stats = [];

        if ($user->hasRole('Owner') || $user->hasRole('Admin Keuangan')) {
            $stats['total_proyek_aktif'] = Proyek::where('status', 'aktif')->count();
            $stats['po_menunggu_approval'] = PurchaseOrder::whereIn('status', ['menunggu_approval_finance', 'menunggu_approval_owner'])->count();
            $stats['piutang_outstanding'] = Invoice::whereNotIn('status', ['lunas'])->sum('subtotal');
            $stats['produksi_hari_ini'] = ProductionSession::whereDate('mulai', today())->sum('hasil_output');
            $stats['ritase_hari_ini'] = Ritase::with('armada')->whereDate('tanggal', today())->get()->take(5);
            $stats['sesi_produksi_berjalan'] = ProductionSession::with(['produk', 'mesin'])->where('status', 'berjalan')->get();
        } elseif ($user->hasRole('Koordinator GCS')) {
            $stats['ritase_hari_ini'] = Ritase::with('armada')->whereDate('tanggal', today())->get();
            // ... etc
        } else {
            $stats = []; // default
        }

        return Inertia::render('Dashboard', ['stats' => $stats]);
    }
}
