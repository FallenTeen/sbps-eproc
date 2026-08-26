<?php

namespace App\Http\Controllers;

use App\Domain\Finance\Models\Invoice;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Build the full list of virtual notifications for the authenticated user.
     */
    private function buildNotifications(): array
    {
        $user = Auth::user();
        $notifications = [];

        // ─── 1. PO Waiting Approval ────────────────────────────────────────────
        if ($user->hasPermissionTo('approve procurement')) {
            $pending = PurchaseOrder::where('status', 'submitted')
                ->orderByDesc('created_at')
                ->take(5)
                ->get();

            foreach ($pending as $po) {
                $notifications[] = [
                    'id' => 'po_'.$po->id,
                    'type' => 'po_approval',
                    'title' => 'PO Menunggu Approval',
                    'body' => "PO #{$po->nomor_po} – ".Supplier::find($po->supplier_id)?->nama.' (Rp '.number_format($po->total_amount, 0, ',', '.').')',
                    'action_url' => "/procurement/po/{$po->id}",
                    'is_read' => false,
                    'time_ago' => Carbon::parse($po->created_at)->diffForHumans(),
                ];
            }
        }

        // ─── 2. Servis Armada Jatuh Tempo ─────────────────────────────────────
        if ($user->hasAnyPermission(['manage fleet', 'manage formulir lapangan'])) {
            $servisDue = Armada::where('status', 'aktif')
                ->whereNotNull('tanggal_servis_terakhir')
                ->get()
                ->filter(fn ($a) => Carbon::parse($a->tanggal_servis_terakhir)->addDays(90)->isPast())
                ->take(5);

            foreach ($servisDue as $armada) {
                $notifications[] = [
                    'id' => 'servis_'.$armada->id,
                    'type' => 'servis_jatuh_tempo',
                    'title' => 'Armada Perlu Diservis',
                    'body' => "{$armada->nama_unit} ({$armada->nomor_polisi}) — servis terakhir: ".Carbon::parse($armada->tanggal_servis_terakhir)->format('d M Y'),
                    'action_url' => "/fleet/armada/{$armada->id}",
                    'is_read' => false,
                    'time_ago' => 'sekarang',
                ];
            }
        }

        // ─── 2b. Checklist Harian Kondisi Tidak Baik ──────────────────────────
        if ($user->hasAnyPermission(['manage fleet', 'manage production', 'view fleet', 'view production'])) {
            $kondisiBuruk = ArmadaChecklistHarian::with('checkable')
                ->where('kondisi_baik', false)
                ->whereDate('tanggal', '>=', now()->subDay())
                ->orderByDesc('tanggal')
                ->take(5)
                ->get();

            foreach ($kondisiBuruk as $checklist) {
                $namaCheckable = $checklist->checkable->plat_nomor
                    ?? $checklist->checkable->nama
                    ?? '-';

                $notifications[] = [
                    'id' => 'checklist_'.$checklist->id,
                    'type' => 'checklist_kondisi_buruk',
                    'title' => 'Checklist: Kondisi Tidak Baik',
                    'body' => "{$namaCheckable} — {$checklist->item_bermasalah}",
                    'action_url' => "/fleet/checklist-harian/{$checklist->id}",
                    'is_read' => false,
                    'time_ago' => Carbon::parse($checklist->tanggal)->diffForHumans(),
                ];
            }
        }

        // ─── 3. Invoice Jatuh Tempo ───────────────────────────────────────────
        if ($user->hasAnyPermission(['manage finance', 'view owner dashboard'])) {
            $invoiceDue = Invoice::where('status', 'terkirim')
                ->whereNotNull('tanggal_jatuh_tempo')
                ->where('tanggal_jatuh_tempo', '<=', now()->addDays(7))
                ->orderBy('tanggal_jatuh_tempo')
                ->take(5)
                ->get();

            foreach ($invoiceDue as $inv) {
                $due = Carbon::parse($inv->tanggal_jatuh_tempo);
                $label = $due->isPast() ? 'LEWAT JATUH TEMPO' : ('Jatuh tempo '.$due->diffForHumans());
                $notifications[] = [
                    'id' => 'inv_'.$inv->id,
                    'type' => 'invoice_jatuh_tempo',
                    'title' => 'Invoice '.$label,
                    'body' => "Invoice #{$inv->nomor_invoice} — Rp ".number_format($inv->total_tagihan, 0, ',', '.'),
                    'action_url' => "/finance/invoice/{$inv->id}",
                    'is_read' => false,
                    'time_ago' => $due->diffForHumans(),
                ];
            }
        }

        return $notifications;
    }

    /**
     * Show all notifications as an Inertia page.
     * Also serves JSON for AJAX requests from the notification bell dropdown.
     */
    public function index(Request $request)
    {
        $notifications = $this->buildNotifications();
        $sorted = collect($notifications)->sortByDesc('time_ago')->values()->all();
        $unreadCount = count(array_filter($sorted, fn ($n) => ! $n['is_read']));

        if ($request->wantsJson()) {
            return response()->json([
                'notifications' => collect($sorted)->take(20)->values()->all(),
                'unread_count' => $unreadCount,
            ]);
        }

        return Inertia::render('Notifications/Index', [
            'notifications' => $sorted,
            'unread_count' => $unreadCount,
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
