<?php

namespace App\Http\Controllers;

use App\Domain\Finance\Models\Invoice;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistAkhir;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaPengisianSolar;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Security\Models\SecurityChecklistRun;
use App\Domain\Security\Models\SecurityChecklistTemplate;
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
                    'body' => "PO #{$po->nomor_po} - ".Supplier::find($po->supplier_id)?->nama.' (Rp '.number_format($po->total_amount, 0, ',', '.').')',
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
                    'body' => "{$armada->kode_unit} ({$armada->plat_nomor}) - servis terakhir: ".Carbon::parse($armada->tanggal_servis_terakhir)->format('d M Y'),
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
                ->get()
                ->map(fn ($checklist) => [
                    'id' => 'checklist_'.$checklist->id,
                    'type' => 'checklist_kondisi_buruk',
                    'title' => 'Checklist Awal: Kondisi Tidak Baik',
                    'body' => ($checklist->checkable->plat_nomor ?? $checklist->checkable->nama ?? '-')." - {$checklist->item_bermasalah}",
                    'action_url' => "/fleet/checklist-harian/{$checklist->id}",
                    'is_read' => false,
                    'time_ago' => Carbon::parse($checklist->tanggal)->diffForHumans(),
                ]);

            $kondisiBurukAkhir = ArmadaChecklistAkhir::with('armada')
                ->where('kondisi_baik', false)
                ->whereDate('tanggal', '>=', now()->subDay())
                ->orderByDesc('tanggal')
                ->take(5)
                ->get()
                ->map(fn ($checklist) => [
                    'id' => 'checklist_akhir_'.$checklist->id,
                    'type' => 'checklist_kondisi_buruk',
                    'title' => 'Checklist Akhir: Kondisi Tidak Baik',
                    'body' => ($checklist->armada?->plat_nomor ?? $checklist->armada?->kode_unit ?? '-')." - {$checklist->item_bermasalah}",
                    'action_url' => "/fleet/armada/{$checklist->armada_id}",
                    'is_read' => false,
                    'time_ago' => Carbon::parse($checklist->tanggal)->diffForHumans(),
                ]);

            foreach ($kondisiBuruk->concat($kondisiBurukAkhir) as $notification) {
                $notifications[] = $notification;
            }
        }

        // ─── 2c. Pengisian Solar Tanpa Nota (TD-A5) ──────────────────────────
        if ($user->hasAnyPermission(['manage pengisian solar', 'manage fleet'])) {
            $hari = (int) config('fleet.nota_reminder_days', 3);

            $tanpaNota = ArmadaPengisianSolar::with('armada')
                ->where('nota_lengkap', false)
                ->whereDate('tanggal', '<=', now()->subDays($hari))
                ->orderByDesc('tanggal')
                ->take(5)
                ->get()
                ->map(fn ($pengisian) => [
                    'id' => 'solar_nota_'.$pengisian->id,
                    'type' => 'solar_nota_belum_lengkap',
                    'title' => 'Pengisian Solar: Nota Belum Lengkap',
                    'body' => ($pengisian->armada?->kode_unit ?? '-')
                        ." - tanggal {$pengisian->tanggal?->format('d M Y')} (Rp "
                        .number_format($pengisian->nominal_rp ?? 0, 0, ',', '.')
                        ."), lebih dari {$hari} hari tanpa nota",
                    'action_url' => '/fleet/pengisian-solar',
                    'is_read' => false,
                    'time_ago' => Carbon::parse($pengisian->tanggal)->diffForHumans(),
                ]);

            foreach ($tanpaNota as $notification) {
                $notifications[] = $notification;
            }
        }

        // ─── 2d. Checklist Security Belum Dijalankan (TD-F3) ──────────────────
        // Template aktif yang batas waktu (`jam_selesai`) hari ini sudah lewat
        // tetapi belum ada run dengan periode yang sama pada tanggal ini.
        if ($user->hasPermissionTo('manage security checklist')) {
            $nowTime = now()->format('H:i');
            $hariIni = strtolower(now()->locale('id')->isoFormat('dddd'));

            $templates = SecurityChecklistTemplate::where('aktif', true)
                ->whereNotNull('jam_selesai')
                ->where('jam_selesai', '<', $nowTime)
                ->get();

            $runPeriodes = SecurityChecklistRun::whereDate('tanggal', now()->toDateString())
                ->pluck('periode')
                ->all();

            foreach ($templates as $template) {
                if (in_array($template->periode, $runPeriodes, true)) {
                    continue;
                }

                $hari = is_array($template->hari) ? array_map('strtolower', $template->hari) : [];
                if (! empty($hari) && ! in_array($hariIni, $hari, true)) {
                    continue;
                }

                $notifications[] = [
                    'id' => 'security_checklist_'.$template->id.'_'.now()->toDateString(),
                    'type' => 'security_checklist_belum',
                    'title' => 'Checklist Security Belum Dijalankan',
                    'body' => "Template \"{$template->nama}\" (periode {$template->periode}) belum dijalankan; batas waktu pukul {$template->jam_selesai}.",
                    'action_url' => '/security/checklist-template',
                    'is_read' => false,
                    'time_ago' => 'sekarang',
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
                    'body' => "Invoice #{$inv->nomor_invoice} - Rp ".number_format($inv->total_tagihan, 0, ',', '.'),
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
