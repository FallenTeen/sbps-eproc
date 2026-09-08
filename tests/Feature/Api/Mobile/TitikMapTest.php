<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use Illuminate\Foundation\Testing\RefreshDatabase;
uses(\Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    [$this->user, $this->token] = createMobileUserWithToken('SDM Lapangan Kondisional');

    $this->proyek1 = Proyek::factory()->internal()->create(['nama' => 'Proyek Alpha', 'created_by' => $this->user->id]);
    $this->proyek2 = Proyek::factory()->internal()->create(['nama' => 'Proyek Beta', 'created_by' => $this->user->id]);

    $this->titikAktif1 = Titik::factory()->create([
        'proyek_id' => $this->proyek1->id,
        'nama' => 'Titik Alpha 1',
        'latitude' => -6.2000000,
        'longitude' => 106.8166667,
        'radius_presensi_meter' => 150,
        'status' => 'aktif',
    ]);

    $this->titikAktif2 = Titik::factory()->create([
        'proyek_id' => $this->proyek2->id,
        'nama' => 'Titik Beta 1',
        'latitude' => -6.9147440,
        'longitude' => 107.6098100,
        'radius_presensi_meter' => 100,
        'status' => 'aktif',
    ]);

    $this->titikNonaktif = Titik::factory()->create([
        'proyek_id' => $this->proyek1->id,
        'nama' => 'Titik Alpha Nonaktif',
        'latitude' => -6.3000000,
        'longitude' => 106.9000000,
        'radius_presensi_meter' => 50,
        'status' => 'nonaktif',
    ]);
});

test('titik map mengembalikan daftar titik aktif dengan envelope success dan koordinat yang benar', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/titik-map');

    $response->assertOk()
        ->assertJsonPath('status', 'success')
        ->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'items' => [
                    '*' => [
                        'id',
                        'nama',
                        'latitude',
                        'longitude',
                        'radius_presensi_meter',
                        'proyek_id',
                        'proyek_nama',
                        'status',
                    ],
                ],
            ],
        ]);

    $items = $response->json('data.items');
    expect($items)->toHaveCount(2);

    $ids = collect($items)->pluck('id')->all();
    expect($ids)->toContain($this->titikAktif1->id);
    expect($ids)->toContain($this->titikAktif2->id);
    expect($ids)->not->toContain($this->titikNonaktif->id);

    $item1 = collect($items)->firstWhere('id', $this->titikAktif1->id);
    expect($item1['latitude'])->toEqualWithDelta(-6.2000000, 0.00001);
    expect($item1['longitude'])->toEqualWithDelta(106.8166667, 0.00001);
    expect($item1['radius_presensi_meter'])->toBe(150);
    expect($item1['proyek_nama'])->toBe('Proyek Alpha');
    expect($item1['status'])->toBe('aktif');
});

test('titik map dapat difilter berdasarkan proyek_id', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/titik-map?proyek_id=' . $this->proyek1->id);

    $response->assertOk();
    $items = $response->json('data.items');
    expect($items)->toHaveCount(1);
    expect($items[0]['id'])->toBe($this->titikAktif1->id);
    expect($items[0]['proyek_id'])->toBe($this->proyek1->id);
});

test('titik map dengan query semua=true mengembalikan titik aktif dan nonaktif', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/titik-map?semua=true');

    $response->assertOk();
    $items = $response->json('data.items');
    expect($items)->toHaveCount(3);

    $ids = collect($items)->pluck('id')->all();
    expect($ids)->toContain($this->titikAktif1->id);
    expect($ids)->toContain($this->titikAktif2->id);
    expect($ids)->toContain($this->titikNonaktif->id);
});

test('titik map menolak request tanpa token sanctum dengan 401', function () {
    $this->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/titik-map')
        ->assertStatus(401);
});

test('titik map menolak request tanpa mobile header dengan 403', function () {
    $this->withToken($this->token)
        ->getJson('/api/mobile/titik-map')
        ->assertStatus(403)
        ->assertJsonPath('status', 'error');
});
