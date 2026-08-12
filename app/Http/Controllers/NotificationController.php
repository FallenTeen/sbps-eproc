<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Return JSON list of notifications for the authenticated user.
     * Uses a hybrid approach: DB notifications + rule-based generated alerts.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $notifications = [];

        // ─── 1. PO Waiting Approval ────────────────────────────────────────────
        if ($user->hasPermissionTo('approve procurement')) {
            $pending = \App\Domain\Procurement\Models\PurchaseOrder::where('status', 'submitted')
                ->orderByDesc('created_at')
                ->take(5)
                ->get();

            foreach ($pending as $po) {
                $notifications[] = [
                    'id'         => 'po_' . $po->id,
                    'type'       => 'po_approval',
                    'title'      => 'PO Menunggu Approval',
                    'body'       => "PO #{$po->nomor_po} – " . \App\Domain\Procurement\Models\Supplier::find($po->supplier_id)?->nama . ' (Rp ' . number_format($po->total_amount, 0, ',', '.') . ')',
                    'action_url' => "/procurement/po/{$po->id}",
                    'is_read'    => false,
                    'time_ago'   => Carbon::parse($po->created_at)->diffForHumans(),
                ];
            }
        }

        // ─── 2. Servis Armada Jatuh Tempo ─────────────────────────────────────
        if ($user->hasAnyPermission(['manage fleet', 'manage formulir lapangan'])) {
            $servisDue = \App\Domain\Fleet\Models\Armada::where('status', 'aktif')
                ->whereNotNull('tanggal_servis_terakhir')
                ->get()
                ->filter(fn ($a) => Carbon::parse($a->tanggal_servis_terakhir)->addDays(90)->isPast())
                ->take(5);

            foreach ($servisDue as $armada) {
                $notifications[] = [
                    'id'         => 'servis_' . $armada->id,
                    'type'       => 'servis_jatuh_tempo',
                    'title'      => 'Armada Perlu Diservis',
                    'body'       => "{$armada->nama_unit} ({$armada->nomor_polisi}) — servis terakhir: " . Carbon::parse($armada->tanggal_servis_terakhir)->format('d M Y'),
                    'action_url' => "/fleet/armada/{$armada->id}",
                    'is_read'    => false,
                    'time_ago'   => 'sekarang',
                ];
            }
        }

        // ─── 3. Invoice Jatuh Tempo ───────────────────────────────────────────
        if ($user->hasAnyPermission(['manage finance', 'view owner dashboard'])) {
            $invoiceDue = \App\Domain\Finance\Models\Invoice::where('status', 'terkirim')
                ->whereNotNull('tanggal_jatuh_tempo')
                ->where('tanggal_jatuh_tempo', '<=', now()->addDays(7))
                ->orderBy('tanggal_jatuh_tempo')
                ->take(5)
                ->get();

            foreach ($invoiceDue as $inv) {
                $due = Carbon::parse($inv->tanggal_jatuh_tempo);
                $label = $due->isPast() ? 'LEWAT JATUH TEMPO' : ('Jatuh tempo ' . $due->diffForHumans());
                $notifications[] = [
                    'id'         => 'inv_' . $inv->id,
                    'type'       => 'invoice_jatuh_tempo',
                    'title'      => 'Invoice ' . $label,
                    'body'       => "Invoice #{$inv->nomor_invoice} — Rp " . number_format($inv->total_tagihan, 0, ',', '.'),
                    'action_url' => "/finance/invoice/{$inv->id}",
                    'is_read'    => false,
                    'time_ago'   => $due->diffForHumans(),
                ];
            }
        }

        // Sort by most recent and cap at 20
        $sorted = collect($notifications)->take(20)->values()->all();

        return response()->json([
            'notifications' => $sorted,
            'unread_count'  => count(array_filter($sorted, fn($n) => !$n['is_read'])),
        ]);
    }

    /**
     * Mark a single notification as read.
     * Since these are virtual/generated, we just return success.
     */
    public function markRead(string $id)
    {
        // For DB-backed notifications, we would update the record here.
        // For now we return success so the frontend can optimistically update.
        return response()->json(['success' => true]);
    }

    /**
     * Mark all as read.
     */
    public function markAllRead(Request $request)
    {
        return response()->json(['success' => true]);
    }
}
