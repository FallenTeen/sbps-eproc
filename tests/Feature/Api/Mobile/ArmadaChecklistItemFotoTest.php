<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Enums\StokSolar;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->create([
        'unit_bisnis_id' => $this->unit->id,
        'tipe_unit' => 'armada_jalan',
    ]);

    $this->user = User::factory()->create();
    $this->driver = Karyawan::create([
        'user_id' => $this->user->id,
        'nama' => 'Driver Test',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);

    ArmadaDriver::create([
        'armada_id' => $this->armada->id,
        'karyawan_id' => $this->driver->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDays(1),
        'status' => 'aktif',
    ]);

    Role::findOrCreate('Driver Armada', 'web');
    $this->user->assignRole('Driver Armada');
    $this->token = $this->user->createToken('mobile-test')->plainTextToken;
});

test('foto item bermasalah diunggah sebagai file dan tersimpan', function () {
    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [
                ['bagian' => 'Ban', 'kondisi' => 'baik'],
                [
                    'bagian' => 'Rem',
                    'kondisi' => 'rusak',
                    'catatan' => 'Rem blong',
                    'foto' => UploadedFile::fake()->image('rem.jpg'),
                ],
            ],
            'stok_solar' => StokSolar::Setengah->value,
            'odo_pagi' => 10100,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('odo.jpg'),
        ], mobileIdemHeaders())
        ->assertOk();

    $awal = ArmadaChecklistHarian::firstOrFail();
    $foto = collect($awal->items)->firstWhere('bagian', 'Rem')['foto'];

    expect($foto)->toStartWith('armada/checklist/');
    Storage::disk('public')->assertExists($foto);
});

test('client baru (kirim file item) tanpa foto pada kondisi bermasalah ditolak 422', function () {
    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [
                [
                    'bagian' => 'Ban',
                    'kondisi' => 'rusak',
                    'catatan' => 'robek',
                    'foto' => UploadedFile::fake()->image('ban.jpg'),
                ],
                ['bagian' => 'Rem', 'kondisi' => 'perlu_perhatian', 'catatan' => 'tipis'],
            ],
            'stok_solar' => StokSolar::Setengah->value,
            'odo_pagi' => 10200,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('odo.jpg'),
        ], mobileIdemHeaders())
        ->assertStatus(422)
        ->assertJsonPath('message', 'Foto wajib untuk kondisi bermasalah.');

    $this->assertDatabaseCount('armada_checklist_harians', 0);
});

test('foto item string path (app lama) tetap diterima tanpa file', function () {
    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [[
                'bagian' => 'Rem',
                'kondisi' => 'perlu_perhatian',
                'catatan' => 'tipis',
                'foto' => 'armada/checklist/2020/01/lama.jpg',
            ]],
            'stok_solar' => StokSolar::Setengah->value,
            'odo_pagi' => 10300,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('odo.jpg'),
        ], mobileIdemHeaders())
        ->assertOk();

    $awal = ArmadaChecklistHarian::firstOrFail();
    $foto = collect($awal->items)->firstWhere('bagian', 'Rem')['foto'];

    expect($foto)->toBe('armada/checklist/2020/01/lama.jpg');
});

test('item perlu perhatian tanpa foto (app lama, tanpa file item) tetap boleh', function () {
    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [
                ['bagian' => 'Ban', 'kondisi' => 'baik'],
                ['bagian' => 'Rem', 'kondisi' => 'perlu_perhatian', 'catatan' => 'tipis'],
            ],
            'stok_solar' => StokSolar::Setengah->value,
            'odo_pagi' => 10400,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('odo.jpg'),
        ], mobileIdemHeaders())
        ->assertOk();

    $this->assertDatabaseCount('armada_checklist_harians', 1);
});
