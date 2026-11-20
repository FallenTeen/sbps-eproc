<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\CalculateArmadaUtilizationAction;
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
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->create(['tipe_unit' => 'armada_jalan']);

    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');
    $this->bukanPemegang = User::factory()->create();
    $this->bukanPemegang->assignRole('Driver Standby');
});

/**
 * Setup driver mobile (user + karyawan tertaut + pemegang armada + token).
 *
 * @return array{0: User, 1: string}
 */
function siapkanDriverSolarMobile(Armada $armada): array
{
    $user = User::factory()->create();
    $karyawan = Karyawan::create([
        'user_id' => $user->id,
        'nama' => 'Driver Test',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);
    ArmadaDriver::create([
        'armada_id' => $armada->id,
        'karyawan_id' => $karyawan->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDay()->toDateString(),
        'status' => 'aktif',
    ]);
    Role::findOrCreate('Driver Armada', 'web');
    $user->assignRole('Driver Armada');

    return [$user, $user->createToken('mobile-test')->plainTextToken];
}

// ─── TD-A3: action tanpa liter ────────────────────────────────────────────────

test('pengisian solar tanpa liter tersimpan dengan harga per liter null dan bbm log liter null', function () {
    $p = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-11-01',
        'odo_atau_hm' => 1005,
        'nominal_rp' => 200000,
        'foto_odo' => 'a.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-tanpa-liter',
    ]);

    expect($p->liter)->toBeNull();
    expect($p->harga_per_liter)->toBeNull();
    expect($p->liter_sumber)->toBeNull();
    expect($p->nota_lengkap)->toBeFalse();
    expect($p->bbm_log_id)->not->toBeNull();
    expect($p->bbmLog->liter)->toBeNull();
    expect($p->bbmLog->biaya)->toBe(200000.0);
});

test('liter diisi kemudian menghitung harga per liter dan memperbarui bbm log', function () {
    $p = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-11-01',
        'odo_atau_hm' => 1005,
        'nominal_rp' => 200000,
        'foto_odo' => 'a.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-tanpa-liter',
    ]);

    (new RecordPengisianSolarAction)->update($p, [
        'liter' => 20,
        'liter_sumber' => 'manual',
        'diperbarui_oleh_id' => $this->owner->id,
        'diverifikasi_pada' => now(),
    ]);

    $p->refresh();
    expect($p->liter)->toBe(20.0);
    expect($p->harga_per_liter)->toBe(10000.0);
    expect($p->liter_sumber)->toBe('manual');
    expect($p->diperbarui_oleh_id)->toBe($this->owner->id);
    expect($p->diverifikasi_pada)->not->toBeNull();
    expect($p->bbmLog->fresh()->liter)->toBe(20.0);
});

test('pengisian dengan liter tanpa nota tetap hitung harga dan nota_lengkap false', function () {
    $p = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-11-02',
        'odo_atau_hm' => 1010,
        'liter' => 20,
        'nominal_rp' => 200000,
        'foto_odo' => 'b.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-dengan-liter',
    ]);

    expect($p->harga_per_liter)->toBe(10000.0);
    expect($p->liter_sumber)->toBe('manual');
    expect($p->nota_lengkap)->toBeFalse();
});

// ─── TD-A6: metrik monitoring hanya record bernilai liter ────────────────────

test('metrik monitoring solar hanya memakai record dengan liter dan menyertakan keterangan', function () {
    (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-01-01',
        'odo_atau_hm' => 1000,
        'liter' => 10,
        'nominal_rp' => 100000,
        'foto_odo' => 'c.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-dengan-liter',
    ]);
    (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-01-02',
        'odo_atau_hm' => 1010,
        'nominal_rp' => 200000,
        'foto_odo' => 'd.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-tanpa-liter',
    ]);

    $hasil = (new CalculateArmadaUtilizationAction)->execute('2026-01-01', '2026-01-15');

    $unit = collect($hasil['per_unit'])->first(fn ($u) => $u['id'] === $this->armada->id);
    expect($unit['total_solar_liter'])->toBe(10.0);
    expect($unit['solar_keterangan'])->toBe('dari 1 pengisian dengan liter (2 total)');
});

// ─── TD-A4: halaman web ──────────────────────────────────────────────────────

test('halaman pengisian solar dilindungi permission manage pengisian solar', function () {
    (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-11-01',
        'odo_atau_hm' => 1005,
        'nominal_rp' => 200000,
        'foto_odo' => 'a.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-web',
    ]);

    $this->actingAs($this->bukanPemegang)
        ->get(route('fleet.pengisian-solar.index'))
        ->assertForbidden();

    $this->actingAs($this->owner)
        ->get(route('fleet.pengisian-solar.index'))
        ->assertOk();
});

test('web lengkapi mengisi liter, foto nota, diverifikasi, dan audit log', function () {
    $p = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-11-01',
        'odo_atau_hm' => 1005,
        'nominal_rp' => 200000,
        'foto_odo' => 'a.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-web-lengkapi',
    ]);
    $bbmId = $p->bbm_log_id;

    $this->actingAs($this->owner)
        ->put(route('fleet.pengisian-solar.update', $p), [
            'liter' => 20,
            'nominal_rp' => 200000,
            'foto_nota' => UploadedFile::fake()->image('nota.jpg'),
            'catatan' => 'nota fisik diserahkan',
        ])
        ->assertRedirect();

    $p->refresh();
    expect($p->liter)->toBe(20.0);
    expect($p->harga_per_liter)->toBe(10000.0);
    expect($p->liter_sumber)->toBe('manual');
    expect($p->nota_lengkap)->toBeTrue();
    expect($p->diperbarui_oleh_id)->toBe($this->owner->id);
    expect($p->diverifikasi_pada)->not->toBeNull();
    expect($p->foto_nota)->not->toBeNull();
    expect(BbmLog::find($bbmId)->liter)->toBe(20.0);

    $audit = Activity::where('log_name', 'pengisian-solar')
        ->where('subject_id', $p->id)
        ->where('event', 'updated')
        ->first();
    expect($audit)->not->toBeNull();
    expect($audit->properties->get('sesudah')['liter'])->toEqual(20.0);
});

test('web lengkapi tanpa liter tidak menandai diverifikasi', function () {
    $p = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-11-01',
        'odo_atau_hm' => 1005,
        'nominal_rp' => 200000,
        'foto_odo' => 'a.jpg',
        'dicatat_oleh' => $this->owner->id,
        'client_uuid' => 'c-web-nota',
    ]);

    $this->actingAs($this->owner)
        ->put(route('fleet.pengisian-solar.update', $p), [
            'foto_nota' => UploadedFile::fake()->image('nota.jpg'),
        ])
        ->assertRedirect();

    $p->refresh();
    expect($p->liter)->toBeNull();
    expect($p->nota_lengkap)->toBeTrue();
    expect($p->diverifikasi_pada)->toBeNull();
});

// ─── TD-A7: kompatibilitas endpoint mobile lama ──────────────────────────────

test('endpoint mobile lama dengan liter diterima dan tersimpan liter_sumber manual', function () {
    [$user, $token] = siapkanDriverSolarMobile($this->armada);

    $response = $this->withToken($token)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/armada/pengisian-solar', [
            'armada_id' => $this->armada->id,
            'odo_atau_hm' => 1200,
            'liter' => 40,
            'nominal_rp' => 600000,
            'foto_odo' => UploadedFile::fake()->image('odo.jpg'),
            'foto_nota' => UploadedFile::fake()->image('nota.jpg'),
            'client_uuid' => 'legacy-uuid-1',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'success');

    $p = ArmadaPengisianSolar::find($response->json('data.id'));
    expect($p->liter)->toBe(40.0);
    expect($p->liter_sumber)->toBe('manual');
    expect($p->harga_per_liter)->toBe(15000.0);
    expect($p->nota_lengkap)->toBeTrue();
});

test('endpoint mobile baru tanpa liter dan tanpa nota tetap diterima', function () {
    [$user, $token] = siapkanDriverSolarMobile($this->armada);

    $this->withToken($token)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/armada/pengisian-solar', [
            'armada_id' => $this->armada->id,
            'odo_atau_hm' => 1200,
            'nominal_rp' => 600000,
            'foto_odo' => UploadedFile::fake()->image('odo.jpg'),
            'client_uuid' => 'baru-uuid-1',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'success');

    $p = ArmadaPengisianSolar::where('client_uuid', 'baru-uuid-1')->first();
    expect($p->liter)->toBeNull();
    expect($p->nota_lengkap)->toBeFalse();
    expect($p->bbmLog->liter)->toBeNull();
});
