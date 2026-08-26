<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    [$this->user, $this->token] = createMobileUserWithToken('Mandor Titik');
});

test('request ke-61 dalam satu menit ditolak 429 dengan envelope JSON', function () {
    for ($i = 0; $i < 60; $i++) {
        $this->withToken($this->token)
            ->withHeaders(mobileAuthHeaders())
            ->getJson('/api/mobile/user')
            ->assertOk();
    }

    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/user');

    $response->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJson([
            'status' => 'error',
            'message' => 'Terlalu banyak permintaan, coba lagi sebentar.',
            'errors' => null,
        ]);
});

test('tracking/batch dibatasi 20 request per menit', function () {
    $payload = fn () => [
        'batch_id' => (string) Str::uuid(),
        'locations' => [
            ['latitude' => -7.123, 'longitude' => 110.123, 'recorded_at' => now()->toIso8601String()],
        ],
    ];

    for ($i = 0; $i < 20; $i++) {
        $this->withToken($this->token)
            ->withHeaders(mobileAuthHeaders())
            ->postJson('/api/mobile/tracking/batch', $payload());
    }

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/tracking/batch', $payload())
        ->assertStatus(429)
        ->assertJsonPath('message', 'Terlalu banyak permintaan, coba lagi sebentar.');
});

test('upload dibatasi 30 request per menit', function () {
    $postUpload = function () {
        return $this->withToken($this->token)
            ->withHeaders(mobileIdemHeaders())
            ->post('/api/mobile/upload', [
                'client_uuid' => (string) Str::uuid(),
                'file_type' => 'foto',
                'files' => [UploadedFile::fake()->image('foto.jpg', 10, 10)],
            ]);
    };

    for ($i = 0; $i < 30; $i++) {
        // Abaikan hasil per-request yang sudah diuji di UploadTest.
        $postUpload()->assertStatus(201);
    }

    $postUpload()
        ->assertStatus(429)
        ->assertJsonPath('message', 'Terlalu banyak permintaan, coba lagi sebentar.');
});

test('login dibatasi 5 percobaan per menit per email dan IP', function () {
    $attempt = fn (string $email) => $this->postJson('/api/mobile/login', [
        'email' => $email,
        'password' => 'password-salah',
    ], mobileAuthHeaders());

    for ($i = 0; $i < 5; $i++) {
        $attempt('korban@example.com')->assertStatus(401);
    }

    // Percobaan ke-6 untuk email sama → 429 (bukan 401).
    $attempt('korban@example.com')
        ->assertStatus(429)
        ->assertHeader('Retry-After');

    // Email berbeda dari IP yang sama masih dinilai normal (401).
    $attempt('lain@example.com')->assertStatus(401);
});
