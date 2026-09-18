<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordOdoAwalProyekAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->create(['kode' => 'U-'.((string) Illuminate\Support\Str::uuid())]);
    $this->armada = Armada::factory()->for($this->unit)->create();

    // Driver terhubung ke user (untuk endpoint mobile armada)
    $this->user = User::factory()->create(['is_active' => true]);
    $this->driver = Karyawan::factory()->create(['user_id' => $this->user->id]);

    ArmadaDriver::create([
        'armada_id' => $this->armada->id,
        'karyawan_id' => $this->driver->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDays(3),
        'status' => 'aktif',
    ]);

    // Token mobile
    Role::findOrCreate('Driver Armada', 'web');
    $this->user->assignRole('Driver Armada');
    $this->token = $this->user->createToken('mobile-test')->plainTextToken;
});

// ========== MOBILE: CHECKLIST HARIAN ==========

test('checklist-hari-ini menyertakan tipe_unit dan field ODO/solar', function () {
    $payload = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/armada/checklist-hari-ini');

    $payload->assertOk()
        ->assertJsonPath('data.items.0.armada_id', $this->armada->id)
        ->assertJsonPath('data.items.0.tipe_unit', 'armada_jalan')
        ->assertJsonPath('data.items.0.sudah_isi', false)
        ->assertJsonPath('data.items.0.status', 'berjalan')
        ->assertJsonStructure([
            'data' => [
                'items' => [[
                    'armada_id', 'plat_nomor', 'kode_unit', 'jenis', 'tipe_unit', 'tanggal',
                    'sudah_isi', 'checklist_id', 'status', 'kondisi_baik', 'item_bermasalah',
                    'solar_liter', 'solar_harga_rp', 'odo_pagi', 'foto_odo_pagi',
                    'odo_sore', 'foto_odo_sore', 'jam_mulai_operasi', 'jam_selesai_operasi',
                    'hm_odo', 'odo_anomali',
                ]],
            ],
        ]);
});

test('checklist pagi armada_jalan tercatat berjalan dengan odo_pagi dan foto', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $this->armada->id,
            'kondisi_baik' => true,
            'odo_pagi' => 10050,
            'foto_odo_pagi' => 'foto/checklist/2026/09/pagi.jpg',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.odo_pagi', 10050)
        ->assertJsonPath('data.foto_odo_pagi', 'foto/checklist/2026/09/pagi.jpg')
        ->assertJsonPath('data.status', 'berjalan');

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'odo_pagi' => 10050,
        'status' => 'berjalan',
    ]);
});

test('checklist dengan solar otomatis mencatat bbm_log', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $this->armada->id,
            'kondisi_baik' => true,
            'solar_liter' => 40,
            'solar_harga_rp' => 600000,
        ])
        ->assertOk();

    $this->assertDatabaseHas('bbm_logs', [
        'serviceable_id' => $this->armada->id,
        'liter' => 40,
        'biaya' => 600000,
        'dicatat_oleh' => $this->user->id,
    ]);
});

test('checklist sore dengan odo_sore < odo_pagi ditandai anomali dan status selesai', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $this->armada->id,
            'kondisi_baik' => true,
            'odo_pagi' => 10050,
        ])
        ->assertOk();

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $this->armada->id,
            'kondisi_baik' => true,
            'odo_sore' => 10040,
            'foto_odo_sore' => 'foto/checklist/2026/09/sore.jpg',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'selesai')
        ->assertJsonPath('data.odo_anomali', true);

    // satu baris per armada per hari (tidak dobel)
    $this->assertDatabaseCount('armada_checklist_harians', 1);
    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'odo_pagi' => 10050,
        'odo_sore' => 10040,
        'odo_anomali' => 1,
        'status' => 'selesai',
    ]);
});

test('submit checklist pada armada yang tidak dipegang driver ditolak 403', function () {
    $armadaLain = Armada::factory()->for($this->unit)->create();

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $armadaLain->id,
            'kondisi_baik' => true,
        ])
        ->assertStatus(403);
});

test('client_uuid idempotent tidak membuat data dobel', function () {
    $uuid = (string) Illuminate\Support\Str::uuid();

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $this->armada->id,
            'kondisi_baik' => true,
            'odo_pagi' => 10060,
            'client_uuid' => $uuid,
        ])
        ->assertOk();

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $this->armada->id,
            'kondisi_baik' => true,
            'odo_pagi' => 10061,
            'client_uuid' => $uuid,
        ])
        ->assertOk()
        ->assertJsonPath('data.sudah_ada', true);

    $this->assertDatabaseCount('armada_checklist_harians', 1);
});

test('checklist alat_berat memakai jam operasional dan hm_odo', function () {
    $excavator = Armada::factory()->for($this->unit)->alatBerat()->create();
    ArmadaDriver::create([
        'armada_id' => $excavator->id,
        'karyawan_id' => $this->driver->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDays(1),
        'status' => 'aktif',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $excavator->id,
            'kondisi_baik' => true,
            'jam_mulai_operasi' => '07:30',
            'hm_odo' => 1200.5,
        ])
        ->assertOk()
        ->assertJsonPath('data.hm_odo', 1200.5)
        ->assertJsonPath('data.status', 'berjalan');

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $excavator->id,
        'jam_mulai_operasi' => '07:30:00',
        'hm_odo' => 1200.5,
        'status' => 'berjalan',
    ]);

    // selesai operasi -> status selesai otomatis
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/armada/checklist', [
            'armada_id' => $excavator->id,
            'kondisi_baik' => true,
            'jam_selesai_operasi' => '16:00',
            'hm_odo' => 1213,
        ])
        ->assertOk();

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $excavator->id,
        'jam_selesai_operasi' => '16:00:00',
        'status' => 'selesai',
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
        ->assertJsonPath('data.items.0.armada_id', $this->armada->id)
        ->assertJsonPath('data.items.0.proyek_nama', $proyek->nama)
        ->assertJsonPath('data.items.0.odo_awal', 9000);
});

// ========== WEB: RECORD CHECKLIST (extended) ==========

test('record-checklist web menerima solar dan ODO (extended)', function () {
    Permission::findOrCreate('manage fleet');
    $this->user->givePermissionTo('manage fleet');
    $this->actingAs($this->user);

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-checklist', $this->armada->id),
        [
            'tanggal' => now()->toDateString(),
            'kondisi_baik' => true,
            'dicatat_oleh_karyawan_id' => $this->driver->id,
            'odo_pagi' => 10500,
            'foto_odo_pagi' => 'foto/checklist/web/pagi.jpg',
            'solar_liter' => 35,
            'solar_harga_rp' => 525000,
        ],
    )->assertRedirect();

    $this->assertDatabaseHas('armada_checklist_harians', [
        'checkable_id' => $this->armada->id,
        'odo_pagi' => 10500,
        'solar_liter' => 35,
    ]);

    $this->assertDatabaseHas('bbm_logs', [
        'serviceable_id' => $this->armada->id,
        'liter' => 35,
        'dicatat_oleh' => $this->user->id,
    ]);
});

test('model checklist baru meng-cast field ODO/solar dengan benar', function () {
    $checklist = ArmadaChecklistHarian::create([
        'checkable_type' => Armada::class,
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => true,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
        'odo_pagi' => 10000,
        'solar_liter' => 40,
        'odo_anomali' => false,
    ]);

    expect($checklist->odo_pagi)->toBeFloat();
    expect((float) $checklist->odo_pagi)->toBe(10000.0);
    expect((float) $checklist->solar_liter)->toBe(40.0);
    expect($checklist->odo_anomali)->toBeFalse();
});