<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    use ApiResponse;

    /** Kategori notifikasi yang dikenali mobile (Phase 16 action center). */
    private const CATEGORIES = [
        'approval', 'servis', 'stok', 'produksi', 'presensi', 'formulir', 'sistem',
    ];

    /**
     * GET /api/mobile/notifications
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = $user->notifications()->latest()->take(50)->get();

        return $this->success([
            'notifications' => $notifications->map(fn (DatabaseNotification $n) => [
                // `id` = id NOTIFIKASI (basis markRead). ID record tujuan
                // deep-link disandang `route_id` (Phase 16 — bukan lagi
                // menimpa `id` seperti sebelumnya).
                'id' => $n->id,
                'type' => class_basename($n->type),
                'category' => $this->category($n),
                'title' => $n->data['title'] ?? 'Notifikasi',
                'body' => $n->data['body'] ?? '',
                'action_url' => $n->data['action_url'] ?? null,
                'route' => $this->mobileRoute($n->data),
                'route_id' => $this->mobileRouteId($n->data),
                'is_read' => (bool) $n->read_at,
                'time' => $n->created_at->toIso8601String(),
            ]),
            'unread_count' => $user->unreadNotifications()->count(),
        ], 'Daftar notifikasi.');
    }

    /**
     * POST /api/mobile/notifications/{id}/read
     */
    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);

        $notification->markAsRead();

        return $this->success(null, 'Notifikasi ditandai sudah dibaca.');
    }

    /**
     * Klasifikasi jujur dari data & tipe notifikasi (bukan tebakan client).
     * Prioritas: `data['category']` eksplisit → keyword class/route → 'sistem'.
     */
    private function category(DatabaseNotification $n): string
    {
        $data = $n->data;

        if (! empty($data['category'])) {
            $explicit = strtolower((string) $data['category']);
            if (in_array($explicit, self::CATEGORIES, true)) {
                return $explicit;
            }
            return 'sistem';
        }

        $type = strtolower(class_basename($n->type));
        // Tidak semua pencipta notifikasi mengirim `data['route']`, jadi
        // turunan web action_url ikut dilihat (sama seperti mobileRoute).
        $haystacks = [
            'approval' => ['approval', 'pending', 'verif', 'disetujui', 'persetujuan'],
            'servis' => ['servis', 'service', 'mainten'],
            'stok' => ['stok', 'stock', 'inventory'],
            'produksi' => ['produksi', 'production', 'slump', 'beton'],
            'presensi' => ['presensi', 'attendance', 'absen', 'checkin', 'checkout', 'check-out'],
            'formulir' => ['formulir', 'laporan', 'report'],
        ];

        $sources = array_values(array_filter([
            $type,
            strtolower((string) ($data['route'] ?? '')),
            strtolower((string) ($data['action_url'] ?? '')),
        ], fn ($v) => $v !== ''));

        foreach ($haystacks as $category => $needles) {
            foreach ($needles as $needle) {
                foreach ($sources as $source) {
                    if (str_contains($source, $needle)) {
                        return $category;
                    }
                }
            }
        }

        return 'sistem';
    }

    /**
     * Base route mobile untuk deep-link. `data['route']` (pencipta notifikasi)
     * menang; fallback dari action_url web dengan pola yang JELAS.
     */
    private function mobileRoute(array $data): ?string
    {
        if (! empty($data['route'])) {
            return rtrim((string) $data['route'], '/');
        }

        $actionUrl = (string) ($data['action_url'] ?? '');
        return match (true) {
            str_starts_with($actionUrl, '/fleet/armada/') => '/armada',
            str_starts_with($actionUrl, '/fleet/checklist-harian/') => '/armada/checklist',
            str_starts_with($actionUrl, '/fleet/servis-armada/') => '/armada/servis',
            str_starts_with($actionUrl, '/inventory/') => '/inventory',
            str_starts_with($actionUrl, '/qc/') => '/qc',
            str_starts_with($actionUrl, '/produksi/') => '/produksi',
            str_starts_with($actionUrl, '/presensi/') => '/presensi',
            str_starts_with($actionUrl, '/dashboard/') => '/dashboard',
            str_starts_with($actionUrl, '/workshop/') => '/workshop',
            str_starts_with($actionUrl, '/formulir/') => '/formulir',
            default => null,
        };
    }

    /**
     * ID record tujuan deep-link. Hanya segmen terakhir yang berupa UUID
     * atau angka dianggap ID — path dekoratif (unit-saya, ajuan, ...) bukan.
     */
    private function mobileRouteId(array $data): ?string
    {
        if (! empty($data['id'])) {
            return (string) $data['id'];
        }

        $actionUrl = trim((string) ($data['action_url'] ?? ''), '/');
        if ($actionUrl === '') {
            return null;
        }

        $segments = explode('/', $actionUrl);
        $last = (string) (end($segments) ?: '');
        if ($last === '') {
            return null;
        }

        $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $last);
        $isNumeric = preg_match('/^\d+$/', $last);

        return ($isUuid === 1 || $isNumeric === 1) ? $last : null;
    }
}