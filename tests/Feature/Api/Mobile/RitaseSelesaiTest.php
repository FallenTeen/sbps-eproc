<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function ritaseSelesaiDriver(string $nama): array
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
    $this->driver = ritaseSelesaiDriver('Driver Ritase Selesai');
    $this->ritase = Ritase::create([
        'armada_id' => $this->armada->id,
        'driver_karyawan_id' => $this->driver['karyawan']->id,
        'tanggal' => now()->toDateString(),
        'jumlah_rit' => 3,
        'tarif_per_rit_snapshot' => 150000,
        'kategori' => 'proyek',
        'material' => 'Batu Split',
        'status' => 'draft',
        'sumber_angka_resmi' => 'driver',
        'satuan_volume' => 'ritase',
    ]);
});

test('driver pemilik dapat menandai ritase selesai tanpa mengubah status', function () {
    $res = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/armada/ritase/'.$this->ritase->id.'/selesai');

    $res->assertOk()
        ->assertJsonPath('data.selesai', true)
        ->assertJsonPath('data.bisa_selesaikan', false)
        ->assertJsonPath('data.status', 'draft');
    expect($res->json('data.selesai_pada'))->not->toBeNull();
    expect($this->ritase->fresh()->status)->toBe('draft');
});

test('mengirim ulang penandaan selesai tidak mengubah waktu selesai', function () {
    $first = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/armada/ritase/'.$this->ritase->id.'/selesai');
    $first->assertOk();

    $firstPada = $first->json('data.selesai_pada');

    $second = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/armada/ritase/'.$this->ritase->id.'/selesai');

    $second->assertOk()
        ->assertJsonPath('data.selesai', true)
        ->assertJsonPath('data.selesai_pada', $firstPada)
        ->assertJsonPath('data.bisa_selesaikan', false);
    expect($this->ritase->fresh()->selesai_pada->toISOString())->toBe($firstPada);
});

test('driver lain tidak dapat menandai ritase selesai', function () {
    $other = ritaseSelesaiDriver('Driver Lain Selesai');

    $this->withToken($other['token'])
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/armada/ritase/'.$this->ritase->id.'/selesai')
        ->assertForbidden();

    expect($this->ritase->fresh()->selesai_pada)->toBeNull();
});

test('manager tidak dapat menandai ritase selesai', function () {
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole('Ketua Armada');
    $token = $user->createToken('mobile-test')->plainTextToken;

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/armada/ritase/'.$this->ritase->id.'/selesai')
        ->assertForbidden();

    expect($this->ritase->fresh()->selesai_pada)->toBeNull();
});

test('verifikasi logistik dan security tetap tampil setelah ritase selesai', function () {
    $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/armada/ritase/'.$this->ritase->id.'/selesai')
        ->assertOk();

    foreach (['logistik', 'security'] as $tahap) {
        RitaseVerifikasi::create([
            'ritase_id' => $this->ritase->id,
            'tahap' => $tahap,
            'status' => 'terverifikasi',
            'diverifikasi_oleh' => $this->driver['user']->id,
            'diverifikasi_pada' => now(),
        ]);
    }

    $detail = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/ritase/'.$this->ritase->id);

    $detail->assertOk()
        ->assertJsonPath('data.ritase.selesai', true)
        ->assertJsonPath('data.ritase.status_verifikasi_logistik', 'terverifikasi')
        ->assertJsonPath('data.ritase.status_verifikasi_security', 'terverifikasi');
});

test('list ritase menyertakan flag selesai dan bisa_selesaikan', function () {
    $belumSelesai = Ritase::create([
        'armada_id' => $this->armada->id,
        'driver_karyawan_id' => $this->driver['karyawan']->id,
        'tanggal' => now()->addDay()->toDateString(),
        'jumlah_rit' => 2,
        'tarif_per_rit_snapshot' => 150000,
        'kategori' => 'proyek',
        'material' => 'Pasir Cor',
        'status' => 'draft',
        'sumber_angka_resmi' => 'driver',
        'satuan_volume' => 'ritase',
    ]);

    $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/armada/ritase/'.$this->ritase->id.'/selesai')
        ->assertOk();

    $res = $this->withToken($this->driver['token'])
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/ritase');

    $res->assertOk();
    $items = collect($res->json('data.items'));
    $selesai = $items->firstWhere('id', $this->ritase->id);
    $belum = $items->firstWhere('id', $belumSelesai->id);

    expect($selesai)->not->toBeNull();
    expect($belum)->not->toBeNull();
    foreach (['selesai', 'selesai_pada', 'bisa_selesaikan'] as $key) {
        expect(array_key_exists($key, $selesai))->toBeTrue();
        expect(array_key_exists($key, $belum))->toBeTrue();
    }
    expect($selesai['selesai'])->toBeTrue();
    expect($selesai['bisa_selesaikan'])->toBeFalse();
    expect($belum['selesai'])->toBeFalse();
    expect($belum['selesai_pada'])->toBeNull();
    expect($belum['bisa_selesaikan'])->toBeTrue();
});
