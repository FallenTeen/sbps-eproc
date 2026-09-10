<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/notifications
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = $user->notifications()->latest()->take(50)->get();

        return $this->success([
            'notifications' => $notifications->map(fn (DatabaseNotification $n) => [
                'id' => $n->id,
                'type' => class_basename($n->type),
                'title' => $n->data['title'] ?? 'Notifikasi',
                'body' => $n->data['body'] ?? '',
                'action_url' => $n->data['action_url'] ?? null,
                'route' => $this->mobileRoute($n->data),
                'id' => $this->mobileRouteId($n->data),
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
            default => null,
        };
    }

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
        return end($segments) ?: null;
    }
}
