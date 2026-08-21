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
