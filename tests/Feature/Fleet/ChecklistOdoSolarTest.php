<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordOdoAwalProyekAction;
use App\Domain\Fleet\Enums\StokSolar;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Storage::fake('public');

    $this->unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->for($this->unit)->create(['tipe_unit' => 'armada_jalan']);
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

    // Token mobile
    Role::findOrCreate('Driver Armada', 'web');
    $this->user->assignRole('Driver Armada');
    $this->token = $this->user->createToken('mobile-test')->plainTextToken;
});

// ========== MOBILE: CHECKLIST HARIAN (kontrak baru: awal/akhir/pengisian) ==========

test('checklist-hari-ini menyertakan tipe_unit dan struktur awal/akhir/pengisian', function () {
    $payload = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/armada/checklist-hari-ini');

    $payload->assertOk()
        ->assertJsonPath('data.items.0.armada_id', $this->armada->id)
        ->assertJsonPath('data.items.0.tipe_unit', 'armada_jalan')
        ->assertJsonPath('data.items.0.sudah_isi', false)
        ->assertJsonPath('data.items.0.status', 'berjalan')
        ->assertJsonPath('data.items.0.awal', null)
        ->assertJsonPath('data.items.0.akhir', null)
        ->assertJsonStructure([
            'data' => [
                'items' => [[
                    'armada_id', 'plat_nomor', 'kode_unit', 'jenis', 'tipe_unit', 'tanggal',
                    'sudah_isi', 'status', 'awal', 'akhir', 'pengisian_solar',
                    'opsi_stok_solar', 'bagian_default',
                ]],
            ],
        ]);
});

test('checklist awal armada_jalan tercatat dengan odo_pagi, stok_solar, dan foto', function () {
    $response = $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [
                ['bagian' => 'Ban', 'kondisi' => 'baik'],
                ['bagian' => 'Rem', 'kondisi' => 'perlu_perhatian', 'catatan' => 'kampas tipis'],
            ],
            'stok_solar' => StokSolar::Setengah->value,
            'odo_pagi' => 10050,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('odo.jpg'),
        ], mobileIdemHeaders());

    $response->assertOk()
        ->assertJsonPath('data.awal.odo_pagi', 10050)
        ->assertJsonPath('data.awal.stok_solar', StokSolar::Setengah->value)
        ->assertJsonPath('data.status', 'berjalan');

    expect($response->json('data.awal.foto_odo_pagi'))->not->toBeNull();
    expect($response->json('data.awal.foto_stok_solar'))->not->toBeNull();

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'odo_pagi' => 10050,
        'stok_solar' => StokSolar::Setengah->value,
    ]);
});

test('pengisian solar menyimpan baris dan menyinkronkan bbm_log', function () {
    $this->withToken($this->token)
        ->post('/api/mobile/armada/pengisian-solar', [
            'armada_id' => $this->armada->id,
            'odo_atau_hm' => 10120,
            'liter' => 40,
            'nominal_rp' => 600000,
            'foto_odo' => UploadedFile::fake()->image('odo.jpg'),
            'foto_nota' => UploadedFile::fake()->image('nota.jpg'),
            'client_uuid' => (string) Str::uuid(),
        ], mobileIdemHeaders())
        ->assertOk();

    $this->assertDatabaseHas('bbm_logs', [
        'serviceable_id' => $this->armada->id,
        'liter' => 40,
        'biaya' => 600000,
        'dicatat_oleh' => $this->user->id,
    ]);
});

test('checklist akhir dengan odo < odo awal ditandai anomali dan status selesai', function () {
    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Setengah->value,
            'odo_pagi' => 10050,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('odo.jpg'),
        ], mobileIdemHeaders())
        ->assertOk();

    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/akhir', [
            'armada_id' => $this->armada->id,
            'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Penuh->value,
            'odo_akhir' => 10040,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_akhir' => UploadedFile::fake()->image('odo.jpg'),
        ], mobileIdemHeaders())
        ->assertOk()
        ->assertJsonPath('data.status', 'selesai')
        ->assertJsonPath('data.akhir.odo_anomali', true);

    $this->assertDatabaseCount('armada_checklist_harians', 1);
    $this->assertDatabaseCount('armada_checklist_akhirs', 1);
    $this->assertDatabaseHas('armada_checklist_akhirs', [
        'armada_id' => $this->armada->id,
        'odo_akhir' => 10040,
        'odo_anomali' => 1,
    ]);
});

test('submit checklist awal pada armada yang tidak dipegang driver ditolak 403', function () {
    $armadaLain = Armada::factory()->for($this->unit)->create();

    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $armadaLain->id,
            'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Penuh->value,
        ], mobileIdemHeaders())
        ->assertStatus(403);
});

test('client_uuid idempotent tidak membuat checklist awal dobel', function () {
    $uuid = (string) Str::uuid();

    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Penuh->value,
            'odo_pagi' => 10060,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('odo.jpg'),
            'client_uuid' => $uuid,
        ], mobileIdemHeaders())
        ->assertOk();

    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Penuh->value,
            'odo_pagi' => 10061,
            'client_uuid' => $uuid,
        ], mobileIdemHeaders())
        ->assertOk();

    $this->assertDatabaseCount('armada_checklist_harians', 1);
});

test('foto string path ditolak 422 (wajib upload file)', function () {
    $this->withToken($this->token)
        ->postJson('/api/mobile/armada/checklist/awal', [
            'armada_id' => $this->armada->id,
            'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Penuh->value,
            'foto_stok_solar' => 'foto/checklist/stok.jpg',
            'foto_odo_pagi' => 'foto/checklist/odo.jpg',
        ], mobileIdemHeaders())
        ->assertStatus(422);

    $this->assertDatabaseCount('armada_checklist_harians', 0);
});

test('checklist alat_berat memakai jam operasional dan hm', function () {
    $excavator = Armada::factory()->for($this->unit)->alatBerat()->create();
    ArmadaDriver::create([
        'armada_id' => $excavator->id,
        'karyawan_id' => $this->driver->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDays(1),
        'status' => 'aktif',
    ]);

    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/awal', [
            'armada_id' => $excavator->id,
            'items' => [['bagian' => 'Body', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::TigaPerempat->value,
            'jam_mulai_operasi' => '07:30',
            'hm_odo' => 1200.5,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_pagi' => UploadedFile::fake()->image('hm.jpg'),
        ], mobileIdemHeaders())
        ->assertOk()
        ->assertJsonPath('data.awal.hm_odo', 1200.5)
        ->assertJsonPath('data.status', 'berjalan');

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $excavator->id,
        'jam_mulai_operasi' => '07:30:00',
        'hm_odo' => 1200.5,
    ]);

    $this->withToken($this->token)
        ->post('/api/mobile/armada/checklist/akhir', [
            'armada_id' => $excavator->id,
            'items' => [['bagian' => 'Body', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Setengah->value,
            'jam_selesai_operasi' => '16:00',
            'hm_akhir' => 1213,
            'foto_stok_solar' => UploadedFile::fake()->image('stok.jpg'),
            'foto_odo_akhir' => UploadedFile::fake()->image('hm.jpg'),
        ], mobileIdemHeaders())
        ->assertOk()
        ->assertJsonPath('data.status', 'selesai');

    $this->assertDatabaseHas('armada_checklist_akhirs', [
        'armada_id' => $excavator->id,
        'jam_selesai_operasi' => '16:00:00',
        'hm_akhir' => 1213,
    ]);
});

// ========== MOBILE: ODO AWAL PROYEK ==========

test('ODO awal proyek tercatat sekali dan duplikat ditolak', function () {
    $proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);

    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/armada/odo-awal-proyek', [
            'armada_id' => $this->armada->id,
            'proyek_id' => $proyek->id,
            'odo_awal' => 9400,
            'jarak_ke_pusat_km' => 78.5,
        ])
        ->assertOk();

    $this->assertDatabaseHas('armada_odo_awal_proyeks', [
        'armada_id' => $this->armada->id,
        'proyek_id' => $proyek->id,
        'odo_awal' => 9400,
    ]);

    // Duplikat -> 422
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/armada/odo-awal-proyek', [
            'armada_id' => $this->armada->id,
            'proyek_id' => $proyek->id,
            'odo_awal' => 9410,
        ])
        ->assertStatus(422);

    $this->assertDatabaseCount('armada_odo_awal_proyeks', 1);
});

test('guard duplikat pada RecordOdoAwalProyekAction melempar ValidationException', function () {
    $proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);

    $action = new RecordOdoAwalProyekAction;
    $action->execute($this->armada, $proyek, [
        'odo_awal' => 9000,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]);

    expect(fn () => $action->execute($this->armada, $proyek, [
        'odo_awal' => 9100,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]))->toThrow(ValidationException::class);
});

test('index ODO awal proyek menampilkan riwayat', function () {
    $proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    ArmadaOdoAwalProyek::create([
        'armada_id' => $this->armada->id,
        'proyek_id' => $proyek->id,
        'odo_awal' => 9000,
        'jarak_ke_pusat_km' => 50,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
        'tanggal' => now()->toDateString(),
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/armada/odo-awal-proyek')
        ->assertOk()
        ->assertJsonPath('data.items.0.armada_id', $this->armada->id);
});

// ========== WEB: CHECKLIST AWAL ==========

test('record checklist web menyimpan odo_pagi dan stok_solar', function () {
    Permission::findOrCreate('manage fleet');
    $this->user->givePermissionTo('manage fleet');

    $response = $this->actingAs($this->user)
        ->post(route('fleet.armada.record-checklist', $this->armada), [
            'tanggal' => now()->toDateString(),
            'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
            'stok_solar' => StokSolar::Setengah->value,
            'odo_pagi' => 10500,
            'dicatat_oleh_karyawan_id' => $this->driver->id,
            'foto_odo_pagi' => 'foto/checklist/web/pagi.jpg',
            'foto_stok_solar' => 'foto/checklist/web/stok.jpg',
        ]);
    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'odo_pagi' => 10500,
        'stok_solar' => StokSolar::Setengah->value,
    ]);
});

test('model checklist baru meng-cast field odo/stok/items dengan benar', function () {
    $checklist = ArmadaChecklistHarian::create([
        'checkable_type' => Armada::class,
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => true,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
        'odo_pagi' => 10000,
        'stok_solar' => StokSolar::Setengah->value,
        'items' => [['bagian' => 'Ban', 'kondisi' => 'baik']],
    ]);

    expect($checklist->odo_pagi)->toBeFloat();
    expect((float) $checklist->odo_pagi)->toBe(10000.0);
    expect($checklist->stok_solar)->toBe(StokSolar::Setengah);
    expect($checklist->items)->toBeArray();
});
