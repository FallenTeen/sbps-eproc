<?php

use App\Domain\Shared\Models\Dokumen;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    [$this->user, $this->token] = createMobileUserWithToken('SDM Lapangan Kondisional');
});

test('upload menyimpan dokumen beserta media', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/upload', [
            'files' => [
                UploadedFile::fake()->image('bukti-1.jpg'),
                UploadedFile::fake()->image('bukti-2.jpg'),
            ],
            'file_type' => 'foto',
            'kategori' => 'dokumentasi',
            'catatan' => 'Bukti lapangan',
        ]);

    $response->assertStatus(201)
        ->assertJsonCount(2, 'data');

    expect(Dokumen::count())->toBe(2);
    expect(Dokumen::first()->getFirstMediaUrl('file'))->not->toBe('');
});

test('upload menolak tanpa file', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/upload', [
            'file_type' => 'pdf',
        ])
        ->assertStatus(422);
});

test('upload menolak file_type tidak dikenal', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/upload', [
            'files' => [UploadedFile::fake()->image('x.jpg')],
            'file_type' => 'exe',
        ])
        ->assertStatus(422);
});

test('destroy menghapus dokumen', function () {
    $dokumen = Dokumen::create([
        'nama' => 'foto-lama.jpg',
        'kategori' => 'foto',
        'tipe' => 'image/jpeg',
        'catatan' => null,
        'uploaded_by' => $this->user->id,
    ]);
    $dokumen->addMedia(UploadedFile::fake()->image('foto-lama.jpg'))->toMediaCollection('file', 'public');

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->deleteJson("/api/mobile/upload/{$dokumen->id}")
        ->assertOk();

    expect(Dokumen::find($dokumen->id))->toBeNull();
});

test('destroy menolak dokumen milik user lain', function () {
    [$otherUser, $otherToken] = createMobileUserWithToken('Mandor Titik');

    $dokumen = Dokumen::create([
        'nama' => 'foto-orang-lain.jpg',
        'kategori' => 'foto',
        'tipe' => 'image/jpeg',
        'catatan' => null,
        'uploaded_by' => $otherUser->id,
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->deleteJson("/api/mobile/upload/{$dokumen->id}")
        ->assertStatus(403);
});
