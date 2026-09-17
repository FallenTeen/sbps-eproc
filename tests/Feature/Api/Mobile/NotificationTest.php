<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function insertNotification(string $userId, array $data = [], ?string $readAt = null): string
{
    $id = (string) Str::uuid();

    DB::table('notifications')->insert([
        'id' => $id,
        'type' => 'App\Notifications\MobileNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $userId,
        'data' => json_encode(array_merge([
            'title' => 'Judul Notifikasi',
            'body' => 'Isi notifikasi',
            'action_url' => '/api/mobile/dashboard',
        ], $data)),
        'read_at' => $readAt,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $id;
}

beforeEach(function () {
    [$this->user, $this->token] = createMobileUserWithToken('Mandor Titik');
});

test('index mengembalikan daftar notifikasi dan unread count', function () {
    insertNotification($this->user->id);
    insertNotification($this->user->id, ['title' => 'Sudah dibaca'], now());

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/notifications')
        ->assertOk()
        ->assertJsonPath('data.unread_count', 1)
        ->assertJsonCount(2, 'data.notifications');
});

test('index punya id notifikasi (bukan id record) plus category & route_id', function () {
    $id = insertNotification($this->user->id, [
        'title' => 'Servis Armada',
        'action_url' => '/fleet/servis-armada/abc-123-def',
        'id' => 'rec-1',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/notifications')
        ->assertOk()
        ->assertJsonPath('data.notifications.0.id', $id)
        ->assertJsonPath('data.notifications.0.category', 'servis')
        ->assertJsonPath('data.notifications.0.route', '/armada/servis')
        ->assertJsonPath('data.notifications.0.route_id', 'rec-1');
});

test('category berasal dari data eksplisit, tipe, lalu sistem', function () {
    insertNotification($this->user->id, [
        'title' => 'Explicit',
        'category' => 'formulir',
    ]);
    insertNotification($this->user->id, [
        'title' => 'Sistem default',
        'action_url' => '/entah/apa',
    ]);
    insertNotification($this->user->id, [
        'title' => 'Eksternal',
        'action_url' => 'https://example.com',
    ]);

    $items = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/notifications')
        ->assertOk()
        ->json('data.notifications');

    $notifications = collect($items)->keyBy('title');
    expect($notifications->count())->toBe(3);
    expect($notifications['Eksternal']['category'])->toBe('sistem');
    expect($notifications['Sistem default']['category'])->toBe('sistem');
    expect($notifications['Explicit']['category'])->toBe('formulir');
});

test('route_id hanya dikenali untuk segmen terakhir berupa angka/uuid', function () {
    insertNotification($this->user->id, [
        'id' => 17,
        'action_url' => '/fleet/armada/17',
    ]);
    insertNotification($this->user->id, [
        'action_url' => '/inventory/request/minta-baru',
    ]);

    $items = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/notifications')
        ->assertOk()
        ->json('data.notifications');

    $notifications = collect($items)->keyBy('route');
    expect($notifications['/armada']['route_id'])->toBe('17');
    expect($notifications['/inventory']['route_id'])->toBeNull();
});

test('markRead menandai notifikasi sudah dibaca', function () {
    $id = insertNotification($this->user->id);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/notifications/{$id}/read")
        ->assertOk();

    $this->assertDatabaseHas('notifications', [
        'id' => $id,
    ]);
    expect(DB::table('notifications')->where('id', $id)->value('read_at'))->not->toBeNull();
});

test('markRead menolak notifikasi milik user lain', function () {
    [$otherUser, $otherToken] = createMobileUserWithToken('Owner');
    $id = insertNotification($otherUser->id);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/notifications/{$id}/read")
        ->assertStatus(404);
});
