<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, DatabaseTransactions::class);

function fleetUser(): User
{
    $user = User::factory()->create();
    Permission::findOrCreate('manage fleet');
    $user->givePermissionTo('manage fleet');
    return $user;
}

function makeDriver(string $nama = 'Driver Test'): Karyawan
{
    return Karyawan::create([
        'nama' => $nama,
        'tipe' => 'harian',
        'jabatan' => 'Driver Dump Truck',
        'status' => 'aktif',
    ]);
}

beforeEach(function () {
    $this->user = fleetUser();
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->driver = makeDriver();
});

// ========== ACCESS CONTROL ==========

test('user tanpa permission manage fleet ditolak 403', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('fleet.armada.index'))->assertStatus(403);
});

// ========== INDEX & CREATE ==========

test('index armada menampilkan daftar armada', function () {
    $armada = Armada::factory()->for($this->unit)->create();
    Armada::factory()->for($this->unit)->servis()->create();

    $this->get(route('fleet.armada.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/Armada/Index')
            ->has('armadas.data', 2));
});

test('index armada difilter berdasarkan status', function () {
    Armada::factory()->for($this->unit)->create(['kode_unit' => 'GCS-DT-01']);
    Armada::factory()->for($this->unit)->servis()->create(['kode_unit' => 'GCS-DT-02']);

    $this->get(route('fleet.armada.index', ['status' => 'servis']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/Armada/Index')
            ->has('armadas.data', 1)
            ->where('armadas.data.0.kode_unit', 'GCS-DT-02')
            ->where('filters.status', 'servis'));
});

test('create armada menyediakan unit bisnis dan driver', function () {
    $this->get(route('fleet.armada.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/Armada/Create')
            ->has('unitBisnis', 1)
            ->has('drivers', 1));
});

// ========== STORE ==========

test('store armada berhasil dan redirect ke index', function () {
    $response = $this->post(route('fleet.armada.store'), [
        'unit_bisnis_id' => $this->unit->id,
        'plat_nomor' => 'B 1234 XYZ',
        'kode_unit' => 'GCS-DT-99',
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
        'tahun' => 2020,
        'kapasitas' => '8 m³',
    ]);

    $response->assertRedirect(route('fleet.armada.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('armadas', [
        'plat_nomor' => 'B 1234 XYZ',
        'kode_unit' => 'GCS-DT-99',
        'status' => 'aktif',
    ]);
});

test('store armada menolak plat nomor duplikat', function () {
    Armada::factory()->for($this->unit)->create(['plat_nomor' => 'B 1111 AAA']);

    $this->post(route('fleet.armada.store'), [
        'unit_bisnis_id' => $this->unit->id,
        'plat_nomor' => 'B 1111 AAA',
        'kode_unit' => 'GCS-DT-50',
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
    ])->assertSessionHasErrors('plat_nomor');
});

test('store armada memerlukan unit bisnis', function () {
    $this->post(route('fleet.armada.store'), [
        'plat_nomor' => 'B 2222 BBB',
        'kode_unit' => 'GCS-DT-51',
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
    ])->assertSessionHasErrors('unit_bisnis_id');
});

// ========== SHOW & UPDATE & DESTROY ==========

test('show armada menampilkan detail dan options', function () {
    $armada = Armada::factory()->for($this->unit)->create();
    $ritase = Ritase::create([
        'armada_id' => $armada->id,
        'driver_karyawan_id' => $this->driver->id,
        'tanggal' => now(),
        'jumlah_rit' => 4,
        'tarif_per_rit_snapshot' => 75000,
        'status' => 'draft',
    ]);

    $this->get(route('fleet.armada.show', $armada->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/Armada/Show')
            ->where('armada.id', $armada->id)
            ->has('options.drivers', 1)
            ->has('armada.ritases', 1)
            ->where('armada.ritases.0.id', $ritase->id));
});

test('update armada berhasil', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->put(route('fleet.armada.update', $armada->id), [
        'plat_nomor' => 'D 5555 CDE',
        'kode_unit' => $armada->kode_unit,
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
        'status' => 'servis',
        'kapasitas' => '10 m³',
    ])->assertRedirect(route('fleet.armada.index'));

    $this->assertDatabaseHas('armadas', [
        'id' => $armada->id,
        'plat_nomor' => 'D 5555 CDE',
        'status' => 'servis',
        'kapasitas' => '10 m³',
    ]);
});

test('destroy armada berhasil', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->delete(route('fleet.armada.destroy', $armada->id))
        ->assertRedirect(route('fleet.armada.index'));

    $this->assertDatabaseMissing('armadas', ['id' => $armada->id]);
});

// ========== RITASE ==========

test('record ritase berhasil', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-ritase', $armada->id),
        [
            'driver_karyawan_id' => $this->driver->id,
            'tanggal' => '2026-08-12',
            'jumlah_rit' => 6,
            'tarif_per_rit_snapshot' => 50000,
            'customer' => 'PT Klien',
            'biaya_lain' => [
                ['jenis' => 'upah_kenek', 'jumlah' => 50000],
            ],
        ],
    )->assertRedirect()->assertSessionHas('success');

    $ritase = Ritase::where('armada_id', $armada->id)->first();
    expect($ritase)->not->toBeNull();
    expect($ritase->jumlah_rit)->toBe(6);
    expect($ritase->tarif_per_rit_snapshot)->toEqual(50000);
    expect($ritase->status)->toBe('draft');
    expect($ritase->biayaLain)->toHaveCount(1);
});

test('record ritase memakai tarif dari rute tarif', function () {
    $armada = Armada::factory()->for($this->unit)->create();
    $rute = RuteTarif::create([
        'unit_bisnis_id' => $this->unit->id,
        'lokasi_asal' => 'Basecamp',
        'lokasi_tujuan' => 'Site A',
        'jarak_km' => 15,
        'tarif_per_rit' => 90000,
        'berlaku_dari' => '2026-01-01',
    ]);

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-ritase', $armada->id),
        [
            'driver_karyawan_id' => $this->driver->id,
            'tanggal' => '2026-08-12',
            'rute_tarif_id' => $rute->id,
            'jumlah_rit' => 3,
        ],
    )->assertRedirect();

    $ritase = Ritase::where('armada_id', $armada->id)->first();
    expect($ritase->rute_tarif_id)->toBe($rute->id);
    expect($ritase->tarif_per_rit_snapshot)->toEqual(90000);
    expect($ritase->total_upah_rit)->toEqual(270000);
});

test('record ritase wajib jumlah_rit', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-ritase', $armada->id),
        [
            'driver_karyawan_id' => $this->driver->id,
            'tanggal' => '2026-08-12',
        ],
    )->assertSessionHasErrors('jumlah_rit');
});

// ========== SEWA ALAT ==========

test('record sewa alat berhasil', function () {
    $armada = Armada::factory()->for($this->unit)->alatBerat()->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-sewa', $armada->id),
        [
            'penyewa_eksternal' => 'PT Sewa',
            'harga_per_jam_snapshot' => 150000,
            'tanggal' => '2026-08-12',
            'jumlah_jam' => 8,
        ],
    )->assertRedirect();

    $sewa = SewaAlatJam::where('armada_id', $armada->id)->first();
    expect($sewa)->not->toBeNull();
    expect($sewa->jumlah_jam)->toEqual(8);
    expect($sewa->status)->toBe('draft');
});

test('record sewa menghitung jam otomatis dari HM', function () {
    $armada = Armada::factory()->for($this->unit)->alatBerat()->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-sewa', $armada->id),
        [
            'harga_per_jam_snapshot' => 150000,
            'tanggal' => '2026-08-12',
            'hm_awal' => 100,
            'hm_akhir' => 112.5,
            'jumlah_jam' => 12.5,
        ],
    )->assertRedirect();

    $sewa = SewaAlatJam::where('armada_id', $armada->id)->first();
    expect((float) $sewa->jumlah_jam)->toBe(12.5);
});

// ========== SERVICE ==========

test('record service berhasil dan update tanggal servis terakhir', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-service', $armada->id),
        [
            'tanggal' => '2026-08-12',
            'jenis_servis' => 'Ganti oli',
            'biaya' => 350000,
            'notes' => 'Servis berkala',
        ],
    )->assertRedirect();

    $history = ServiceHistory::where('serviceable_id', $armada->id)->first();
    expect($history)->not->toBeNull();
    expect($history->biaya)->toEqual(350000);

    $armada->refresh();
    expect($armada->tanggal_servis_terakhir->toDateString())->toBe('2026-08-12');
});

// ========== CHECKLIST ==========

test('record checklist harian berhasil', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-checklist', $armada->id),
        [
            'tanggal' => '2026-08-12',
            'kondisi_baik' => true,
            'item_bermasalah' => null,
            'dicatat_oleh_karyawan_id' => $this->driver->id,
        ],
    )->assertRedirect();

    $checklist = ArmadaChecklistHarian::where('checkable_id', $armada->id)->first();
    expect($checklist)->not->toBeNull();
    expect($checklist->kondisi_baik)->toBeTrue();
});

// ========== BBM ==========

test('record bbm berhasil', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.record-bbm', $armada->id),
        [
            'tanggal' => '2026-08-12',
            'liter' => 50,
            'biaya' => 350000,
        ],
    )->assertRedirect();

    $log = BbmLog::where('serviceable_id', $armada->id)->first();
    expect($log)->not->toBeNull();
    expect($log->liter)->toEqual(50);
    expect($log->dicatat_oleh)->toBe($this->user->id);
});

// ========== DOWNTIME ==========

test('start dan end downtime berhasil', function () {
    $armada = Armada::factory()->for($this->unit)->create();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.start-downtime', $armada->id),
        [
            'penyebab' => 'Ganti ban',
            'kategori' => 'kerusakan',
        ],
    )->assertRedirect();

    $downtime = DowntimeLog::where('serviceable_id', $armada->id)->first();
    expect($downtime)->not->toBeNull();
    expect($downtime->selesai)->toBeNull();

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.end-downtime', [$armada->id, $downtime->id]),
    )->assertRedirect();

    $downtime->refresh();
    expect($downtime->selesai)->not->toBeNull();
});

// ========== ASSIGN DRIVER ==========

test('assign driver berhasil dan menutup assignment lama', function () {
    $armada = Armada::factory()->for($this->unit)->create();
    $driverLama = makeDriver('Driver Lama');

    ArmadaDriver::create([
        'armada_id' => $armada->id,
        'karyawan_id' => $driverLama->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDays(10),
        'status' => 'aktif',
    ]);

    $this->from(route('fleet.armada.index'))->post(
        route('fleet.armada.assign-driver', $armada->id),
        [
            'karyawan_id' => $this->driver->id,
            'tipe' => 'standby',
            'tanggal_mulai' => '2026-08-12',
        ],
    )->assertRedirect();

    $this->assertDatabaseHas('armada_drivers', [
        'armada_id' => $armada->id,
        'karyawan_id' => $driverLama->id,
        'status' => 'selesai',
    ]);
    $this->assertDatabaseHas('armada_drivers', [
        'armada_id' => $armada->id,
        'karyawan_id' => $this->driver->id,
        'status' => 'aktif',
    ]);
});

// ========== RUTE TARIF (pendukung ritase) ==========

test('rute tarif aktif scope hanya mengambil tarif yang berlaku', function () {
    RuteTarif::create([
        'unit_bisnis_id' => $this->unit->id,
        'lokasi_asal' => 'A',
        'lokasi_tujuan' => 'B',
        'jarak_km' => 10,
        'tarif_per_rit' => 80000,
        'berlaku_dari' => '2020-01-01',
        'berlaku_sampai' => '2020-12-31',
    ]);
    RuteTarif::create([
        'unit_bisnis_id' => $this->unit->id,
        'lokasi_asal' => 'A',
        'lokasi_tujuan' => 'B',
        'jarak_km' => 10,
        'tarif_per_rit' => 95000,
        'berlaku_dari' => '2026-01-01',
    ]);

    expect(RuteTarif::aktif()->count())->toBe(1);
});
