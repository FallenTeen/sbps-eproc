<?php

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function formulirPayload(array $extra = []): array
{
    return array_merge([
        'aktivitas_dilakukan' => 'Pengecoran jalan raya',
        'kondisi_area' => 'Bersih',
        'kendala' => 'Curah hujan tinggi',
        'catatan_tambahan' => 'Perlu tambahan pekerja',
        'photos' => [UploadedFile::fake()->image('formulir.jpg')],
    ], $extra);
}

beforeEach(function () {
    Storage::fake('public');

    [$this->user, $this->token] = createMobileUserWithToken('SDM Lapangan Kondisional');
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
});

test('formulir store berhasil setelah check-in', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', [
            'titik_id' => $this->titik->id,
            'latitude' => $this->titik->latitude,
            'longitude' => $this->titik->longitude,
            'photo' => UploadedFile::fake()->image('checkin.jpg'),
        ]);

    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/formulir/store', formulirPayload());

    $response->assertStatus(201)
        ->assertJsonPath('data.id', fn ($id) => !is_null($id));

    $this->assertDatabaseHas('formulir_lapangans', [
        'aktivitas_dilakukan' => 'Pengecoran jalan raya',
    ]);
});

test('formulir store tanpa check-in ditolak', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/formulir/store', formulirPayload())
        ->assertStatus(422);
});

test('formulir ganda dalam sehari ditolak', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', [
            'titik_id' => $this->titik->id,
            'latitude' => $this->titik->latitude,
            'longitude' => $this->titik->longitude,
            'photo' => UploadedFile::fake()->image('checkin.jpg'),
        ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/formulir/store', formulirPayload());

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/formulir/store', formulirPayload(['kondisi_area' => 'Kotor']))
        ->assertStatus(422);
});

test('formulir hari ini mengembalikan data setelah diisi', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', [
            'titik_id' => $this->titik->id,
            'latitude' => $this->titik->latitude,
            'longitude' => $this->titik->longitude,
            'photo' => UploadedFile::fake()->image('checkin.jpg'),
        ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/formulir/store', formulirPayload());

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/formulir/hari-ini')
        ->assertOk()
        ->assertJsonPath('data.aktivitas_dilakukan', 'Pengecoran jalan raya');
});

test('riwayat formulir terpaginate', function () {
    $presensi = \App\Domain\Attendance\Models\Presensi::create([
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'check_in' => now(),
        'status_validasi' => 'valid',
    ]);

    FormulirLapangan::create([
        'presensi_id' => $presensi->id,
        'aktivitas_dilakukan' => 'Pengecoran lama',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/formulir/riwayat')
        ->assertOk()
        ->assertJsonPath('data.pagination.total', 1);
});
