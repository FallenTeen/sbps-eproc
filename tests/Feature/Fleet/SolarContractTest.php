<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordPengisianSolarAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaPengisianSolar;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->create(['tipe_unit' => 'armada_jalan']);

    $driverUser = User::factory()->create();
    $driver = Karyawan::create([
        'user_id' => $driverUser->id,
        'nama' => 'Driver Solar',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);
    ArmadaDriver::create([
        'armada_id' => $this->armada->id,
        'karyawan_id' => $driver->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDay()->toDateString(),
        'status' => 'aktif',
    ]);
    $driverUser->assignRole('Driver Armada');
    $this->driverToken = $driverUser->createToken('mobile-test')->plainTextToken;

    $this->ketua = User::factory()->create();
    $this->ketua->assignRole('Ketua Armada');

    $this->workshop = User::factory()->create();
    $this->workshop->assignRole('Workshop');
});

test('driver mobile mengirim biaya, foto nota, dan ODO tanpa liter', function () {
    $response = $this->withToken($this->driverToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/armada/pengisian-solar', [
            'armada_id' => $this->armada->id,
            'odo_atau_hm' => 1200,
            'nominal_rp' => 600000,
            'foto_odo' => UploadedFile::fake()->image('odo.jpg'),
            'foto_nota' => UploadedFile::fake()->image('nota.jpg'),
            'client_uuid' => 'solar-driver-tanpa-liter',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'success');

    expect($response->json('data'))->toHaveKey('liter');
    expect($response->json('data.liter'))->toBeNull();
    expect($response->json('data.liter_sumber'))->toBeNull();
    expect($response->json('data.nota_lengkap'))->toBeTrue();
    expect($response->json('data.foto_nota_url'))->not->toBeNull();
    expect((float) $response->json('data.nominal_rp'))->toBe(600000.0);
    expect((float) $response->json('data.odo_atau_hm'))->toBe(1200.0);

    $pengisian = ArmadaPengisianSolar::where('client_uuid', 'solar-driver-tanpa-liter')->firstOrFail();
    expect($pengisian->liter)->toBeNull();
    expect($pengisian->harga_per_liter)->toBeNull();
    expect($pengisian->nominal_rp)->toBe(600000.0);
    expect($pengisian->odo_atau_hm)->toBe(1200.0);
    expect($pengisian->nota_lengkap)->toBeTrue();
    expect($pengisian->bbmLog)->not->toBeNull();
    expect($pengisian->bbmLog->liter)->toBeNull();
    expect($pengisian->bbmLog->biaya)->toBe(600000.0);

    $this->actingAs($this->ketua)
        ->get(route('fleet.pengisian-solar.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Fleet/PengisianSolar/Index')
            ->has('pengisians.data', 1)
            ->where('pengisians.data.0.client_uuid', 'solar-driver-tanpa-liter')
            ->where('pengisians.data.0.nominal_rp', fn ($value) => (float) $value === 600000.0)
            ->where('pengisians.data.0.nota_lengkap', true)
            ->where('pengisians.data.0.foto_nota_url', fn ($url) => is_string($url) && $url === $pengisian->foto_nota_url));
});

test('role dengan manage pengisian solar melengkapi liter lewat web', function () {
    expect($this->ketua->hasPermissionTo('manage pengisian solar'))->toBeTrue();

    $pengisian = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => now()->toDateString(),
        'odo_atau_hm' => 1200,
        'nominal_rp' => 600000,
        'foto_odo' => 'armada/solar/odo.jpg',
        'dicatat_oleh' => $this->ketua->id,
        'client_uuid' => 'solar-lengkapi-web',
    ]);

    $bbmLogId = $pengisian->bbm_log_id;

    $this->actingAs($this->ketua)
        ->put(route('fleet.pengisian-solar.update', $pengisian), [
            'liter' => 40,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $pengisian->refresh();
    expect($pengisian->liter)->toBe(40.0);
    expect($pengisian->liter_sumber)->toBe('manual');
    expect($pengisian->harga_per_liter)->toBe(15000.0);
    expect($pengisian->diperbarui_oleh_id)->toBe($this->ketua->id);
    expect($pengisian->diverifikasi_pada)->not->toBeNull();
    expect(BbmLog::findOrFail($bbmLogId)->liter)->toBe(40.0);
});

test('Workshop tidak bisa melihat halaman maupun mengisi liter solar', function () {
    expect($this->workshop->hasPermissionTo('manage pengisian solar'))->toBeFalse();

    $pengisian = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => now()->toDateString(),
        'odo_atau_hm' => 1200,
        'nominal_rp' => 600000,
        'foto_odo' => 'armada/solar/odo.jpg',
        'dicatat_oleh' => $this->workshop->id,
        'client_uuid' => 'solar-workshop-ditolak',
    ]);

    $this->actingAs($this->workshop)
        ->get(route('fleet.pengisian-solar.index'))
        ->assertForbidden();

    $this->actingAs($this->workshop)
        ->put(route('fleet.pengisian-solar.update', $pengisian), ['liter' => 40])
        ->assertForbidden();

    $pengisian->refresh();
    expect($pengisian->liter)->toBeNull();
    expect(BbmLog::findOrFail($pengisian->bbm_log_id)->liter)->toBeNull();
});

test('bbm logs tetap ledger turunan dan halaman BBM dialihkan ke solar', function () {
    $this->withToken($this->driverToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/armada/pengisian-solar', [
            'armada_id' => $this->armada->id,
            'odo_atau_hm' => 1200,
            'nominal_rp' => 600000,
            'foto_odo' => UploadedFile::fake()->image('odo.jpg'),
            'client_uuid' => 'solar-ledger',
        ])
        ->assertOk();

    expect(BbmLog::count())->toBe(1);

    $ledger = BbmLog::firstOrFail();
    expect($ledger->serviceable_id)->toBe($this->armada->id);
    expect($ledger->liter)->toBeNull();
    expect($ledger->biaya)->toBe(600000.0);
    expect($ledger->pengisianSolar)->not->toBeNull();
    expect($ledger->pengisianSolar->client_uuid)->toBe('solar-ledger');

    $this->actingAs($this->ketua)
        ->get('/fleet/bbm')
        ->assertRedirect(route('fleet.pengisian-solar.index'));
});

test('jalur input BBM legacy tidak tersedia', function () {
    $this->actingAs($this->ketua)
        ->get('/fleet/bbm/create')
        ->assertNotFound();

    $this->actingAs($this->ketua)
        ->post('/fleet/bbm', [
            'serviceable_type' => 'armada',
            'serviceable_id' => $this->armada->id,
            'liter' => 40,
            'biaya' => 600000,
        ])
        ->assertNotFound();

    $this->actingAs($this->ketua)
        ->post("/fleet/armada/{$this->armada->id}/record-bbm", [
            'liter' => 40,
            'biaya' => 600000,
        ])
        ->assertNotFound();

    $this->actingAs($this->ketua)
        ->get('/fleet/bbm/anomaly')
        ->assertRedirect(route('fleet.pengisian-solar.index'));

    expect(file_get_contents(resource_path('js/Components/Sidebar.jsx')))
        ->not->toContain('fleet.bbm.index');
});
