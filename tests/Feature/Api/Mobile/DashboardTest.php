<?php

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    [$this->user, $this->token] = createMobileUserWithToken('Mandor Titik');
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
});

test('overview mengembalikan ringkasan per titik', function () {
    Presensi::create([
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'check_in' => now(),
        'status_validasi' => 'valid',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/dashboard/overview')
        ->assertOk()
        ->assertJsonStructure(['data' => [
            'tanggal', 'total_titik',
            'items' => [['titik_id', 'titik', 'proyek', 'sdm_count', 'armada_count', 'presensi_today', 'produksi_today']],
        ]])
        ->assertJsonPath('data.total_titik', 1)
        ->assertJsonPath('data.items.0.presensi_today', 1);
});

test('titik detail mengembalikan detail titik dengan RAB', function () {
    Rab::factory()->for($this->proyek)->bahanBaku()->create([
        'rencana' => 1000000,
        'titik_id' => $this->titik->id,
        'created_by' => $this->user->id,
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson("/api/mobile/dashboard/titik/{$this->titik->id}")
        ->assertOk()
        ->assertJsonPath('data.titik.id', $this->titik->id)
        ->assertJsonStructure(['data' => [
            'titik', 'sdm', 'armada', 'produksi_hari_ini', 'presensi_hari_ini',
            'rab' => ['total_rencana', 'total_realisasi', 'persentase'],
        ]])
        ->assertJsonPath('data.rab.total_rencana', 1000000);
});

test('titik detail menolak titik yang tidak ada', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/dashboard/titik/'.(string) Str::uuid())
        ->assertStatus(404);
});
