<?php

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function ritaseDetailDriver(string $nama): array
{
    $user = User::factory()->create(['is_active' => true]);
    $karyawan = Karyawan::create([
        'user_id' => $user->id,
        'nama' => $nama,
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);

    return [
        'user' => $user,
        'karyawan' => $karyawan,
        'token' => $user->createToken('mobile-test')->plainTextToken,
    ];
}

beforeEach(function () {
    $unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->create([
        'unit_bisnis_id' => $unit->id,
        'tipe_unit' => 'armada_jalan',
    ]);
    $this->driver = ritaseDetailDriver('Driver Ritase Detail');
    $this->ritase = Ritase::create([
        'armada_id' => $this->armada->id,
        'driver_karyawan_id' => $this->driver['karyawan']->id,
        'tanggal' => now()->toDateString(),
        'jumlah_rit' => 3,
        'tarif_per_rit_snapshot' => 150000,
        'kategori' => 'proyek',
        'material' => 'Batu Split',
        'status' => 'disetujui',
        'sumber_angka_resmi' => 'driver',
        'satuan_volume' => 'ritase',
    ]);
});

test('driver dapat membuka detail ritase miliknya beserta timeline', function () {
    $res = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/ritase/'.$this->ritase->id);

    $res->assertOk();
    expect($res->json('data.ritase.id'))->toBe($this->ritase->id);
    expect(collect($res->json('data.timeline'))->pluck('key')->all())->toBe([
        'diajukan',
        'diverifikasi_logistik',
        'diverifikasi_security',
        'disetujui',
        'ditagih',
    ]);
    expect($res->json('data.timeline.0.state'))->toBe('done');
    expect($res->json('data.timeline.3.badge'))->toBe('Disetujui');
});

test('detail ritase menolak driver lain', function () {
    $other = ritaseDetailDriver('Driver Lain');

    $this->withToken($other['token'])
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/ritase/'.$this->ritase->id)
        ->assertForbidden();
});

test('manager diizinkan membuka detail ritase', function () {
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole('Ketua Armada');
    $token = $user->createToken('mobile-test')->plainTextToken;

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/ritase/'.$this->ritase->id)
        ->assertOk();
});

test('field ringkasan detail konsisten dengan list', function () {
    $detail = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/ritase/'.$this->ritase->id);
    $list = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/ritase');

    $detail->assertOk();
    $list->assertOk();

    foreach (['armada_id', 'driver_nama', 'sumber_angka_resmi', 'satuan_volume'] as $field) {
        expect($detail->json("data.ritase.$field"))->not->toBeNull();
        expect($list->json("data.items.0.$field"))->not->toBeNull();
    }
});
