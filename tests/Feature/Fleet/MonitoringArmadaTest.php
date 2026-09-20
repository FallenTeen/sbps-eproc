<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\CalculateArmadaUtilizationAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(TestCase::class, RefreshDatabase::class);

function monitoringFleetUser(): User
{
    $user = User::factory()->create();
    Permission::findOrCreate('manage fleet');
    $user->givePermissionTo('manage fleet');

    return $user;
}

/**
 * Pastikan role pengelola armada ada. Idempotent — melindungi test dari
 * ketergantungan state seeding antar-file (RefreshDatabase hanya migrate+seed
 * pada file pertama yang dijalankan).
 */
function monitoringEnsureArmadaRole(): void
{
    Role::firstOrCreate(['name' => 'Kepala Divisi Armada']);
}

beforeEach(function () {
    $this->user = monitoringFleetUser();
    $this->actingAs($this->user);

    // Kode di luar kumpulan default UnitBisnisFactory (GCS/CBP/AMP) agar tidak
    // bertabrakan dengan unit yang dibuat factory relasi lain.
    $this->unitGcs = UnitBisnis::factory()->create(['kode' => 'TA', 'nama' => 'Armada A']);
    $this->unitCbp = UnitBisnis::factory()->create(['kode' => 'TB', 'nama' => 'Armada B']);
    $this->karyawan = Karyawan::factory()->create();
});

function monitoringChecklist(Armada $armada, Karyawan $karyawan, array $overrides = []): ArmadaChecklistHarian
{
    return ArmadaChecklistHarian::factory()->create(array_merge([
        'checkable_type' => Armada::class,
        'checkable_id' => $armada->id,
        'tanggal' => now()->toDateString(),
        'jam_mulai_operasi' => '07:00',
        'jam_selesai_operasi' => '15:00',
        'odo_pagi' => 1000,
        'odo_sore' => 1160,
        'solar_liter' => 80,
        'kondisi_baik' => true,
        'item_bermasalah' => null,
        'dicatat_oleh_karyawan_id' => $karyawan->id,
    ], $overrides));
}

test('user tanpa permission manage fleet ditolak 403', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('fleet.monitoring-armada.index'))->assertStatus(403);
});

test('action menghitung metrik utilisasi per unit (21.11)', function () {
    $action = app(CalculateArmadaUtilizationAction::class);

    $armada = Armada::factory()->for($this->unitGcs)->create();
    $alatBerat = Armada::factory()->for($this->unitGcs)->alatBerat()->create();

    monitoringChecklist($armada, $this->karyawan, [
        'kondisi_baik' => false,
        'item_bermasalah' => 'Oli rembes',
    ]);

    Ritase::factory()->create([
        'armada_id' => $armada->id,
        'tanggal' => now()->toDateString(),
        'jumlah_rit' => 3,
    ]);

    SewaAlatJam::create([
        'armada_id' => $alatBerat->id,
        'tipe_sewa' => 'eksternal',
        'tanggal' => now()->toDateString(),
        'harga_per_jam_snapshot' => 150000,
        'jumlah_jam' => 8,
        'status' => 'disetujui',
    ]);

    $result = $action->execute();

    expect($result['ringkasan']['total_armada'])->toBe(2)
        ->and($result['ringkasan']['total_jam_aktif'])->toBe(8.0)
        ->and($result['ringkasan']['total_odo_km'])->toBe(160.0)
        ->and($result['ringkasan']['total_ritase'])->toBe(3)
        ->and($result['ringkasan']['total_sewa_jam'])->toBe(8.0)
        ->and($result['ringkasan']['unit_bermasalah'])->toBe(1)
        ->and($result['ringkasan']['rasio_hm_jam'])->toBe(0.0)
        ->and($result['rekap_per_tanggal'])->toHaveCount(30)
        ->and($result['rekap_per_tanggal'][29]['jumlah_unit'])->toBe(2)
        ->and($result['per_unit'])->toHaveCount(2);
});

test('action menangani durasi operasi terbalik sebagai nol', function () {
    $action = app(CalculateArmadaUtilizationAction::class);

    $armada = Armada::factory()->for($this->unitGcs)->create();

    monitoringChecklist($armada, $this->karyawan, [
        'jam_mulai_operasi' => '16:00',
        'jam_selesai_operasi' => '06:00',
    ]);

    $result = $action->execute();

    expect($result['per_unit'][0]['total_jam_aktif'])->toBe(0.0)
        ->and($result['ringkasan']['total_jam_aktif'])->toBe(0.0);
});

test('halaman monitoring armada menampilkan ringkasan dan per unit', function () {
    $armada = Armada::factory()->for($this->unitGcs)->create();
    Armada::factory()->for($this->unitCbp)->servis()->create();

    monitoringChecklist($armada, $this->karyawan);

    $this->get(route('fleet.monitoring-armada.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/MonitoringArmada/Index')
            ->where('ringkasan.total_armada', 2)
            ->has('ringkasan.total_jam_aktif')
            ->has('per_unit', 2)
            ->has('rekap_per_tanggal', 30)
            ->has('unit_bisnis', 2));
});

test('halaman monitoring menghormati filter unit bisnis dan status', function () {
    $aktif = Armada::factory()->for($this->unitGcs)->create();
    Armada::factory()->for($this->unitGcs)->servis()->create();
    Armada::factory()->for($this->unitCbp)->create();

    $this->get(route('fleet.monitoring-armada.index', ['unit_bisnis_id' => $this->unitGcs->id, 'status' => 'aktif']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/MonitoringArmada/Index')
            ->where('filters.unit_bisnis_id', $this->unitGcs->id)
            ->where('filters.status', 'aktif')
            ->has('per_unit', 1)
            ->where('per_unit.0.id', $aktif->id));
});

test('endpoint mobile armada-monitoring mengembalikan data monitoring', function () {
    monitoringEnsureArmadaRole();
    [$mobileUser, $token] = createMobileUserWithToken('Kepala Divisi Armada');

    $armada = Armada::factory()->for($this->unitGcs)->create();

    monitoringChecklist($armada, $this->karyawan, [
        'jam_mulai_operasi' => '08:00',
        'jam_selesai_operasi' => '12:00',
        'odo_pagi' => 2000,
        'odo_sore' => 2090,
        'solar_liter' => 40,
    ]);

    $this->app['auth']->forgetGuards();

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/dashboard/armada-monitoring')
        ->assertOk()
        ->assertJsonStructure(['data' => [
            'tanggal_dari', 'tanggal_sampai',
            'ringkasan' => ['total_armada', 'total_hari_unit_operasi', 'total_jam_aktif', 'total_hm', 'rasio_hm_jam', 'total_odo_km', 'total_solar_liter', 'total_ritase', 'total_sewa_jam'],
            'rekap_per_tanggal' => [['tanggal', 'jumlah_unit', 'total_jam_aktif']],
            'per_unit' => [['id', 'kode_unit', 'plat_nomor', 'jenis', 'status', 'aktif', 'total_jam_aktif', 'total_odo_km', 'checklist_hari_ini', 'downtime_aktif', 'servis_menunggu', 'kondisi_terakhir']],
        ]])
        ->assertJsonPath('data.ringkasan.total_armada', 1)
        ->assertJsonPath('data.ringkasan.total_jam_aktif', 4)
        ->assertJsonPath('data.ringkasan.total_odo_km', 90)
        ->assertJsonPath('data.ringkasan.total_solar_liter', 40)
        ->assertJsonPath('data.per_unit.0.total_jam_aktif', 4)
        ->assertJsonPath('data.per_unit.0.checklist_hari_ini', true);
});

test('endpoint mobile armada-status memuat semua status dan by_unit_bisnis', function () {
    monitoringEnsureArmadaRole();
    [$mobileUser, $token] = createMobileUserWithToken('Kepala Divisi Armada');

    Armada::factory()->for($this->unitGcs)->create();
    Armada::factory()->for($this->unitCbp)->servis()->create();
    Armada::factory()->for($this->unitCbp)->nonaktif()->create();

    $this->app['auth']->forgetGuards();

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/dashboard/armada-status')
        ->assertOk()
        ->assertJsonStructure(['data' => [
            'total',
            'items' => [['status', 'jumlah']],
            'by_unit_bisnis' => [['unit_bisnis_id', 'kode', 'nama', 'total', 'items']],
        ]])
        ->assertJsonPath('data.total', 3)
        ->assertJsonCount(3, 'data.items')
        ->assertJsonCount(2, 'data.by_unit_bisnis');
});
