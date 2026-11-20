<?php

use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Domain\Security\Models\BukuTamu;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->create([
        'unit_bisnis_id' => $this->unit->id,
        'tipe_unit' => 'armada_jalan',
    ]);

    $this->driverKaryawan = Karyawan::create([
        'nama' => 'Driver Scope Test',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);

    ArmadaDriver::create([
        'armada_id' => $this->armada->id,
        'karyawan_id' => $this->driverKaryawan->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDay(),
        'status' => 'aktif',
    ]);

    $this->buatRitase = function (?string $titikId): Ritase {
        return Ritase::create([
            'armada_id' => $this->armada->id,
            'driver_karyawan_id' => $this->driverKaryawan->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 1,
            'tarif_per_rit_snapshot' => 100000,
            'titik_id' => $titikId,
            'kategori' => 'proyek',
            'material' => 'Batu Split',
        ]);
    };

    $this->buatUserDenganTitik = function (string $role, ?Titik $titik): string {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);

        if ($titik) {
            $karyawan = Karyawan::create([
                'user_id' => $user->id,
                'nama' => 'Petugas Scope Test',
                'tipe' => 'tetap',
                'jabatan' => $role,
                'status' => 'aktif',
            ]);

            KaryawanTitikAssignment::create([
                'karyawan_id' => $karyawan->id,
                'titik_id' => $titik->id,
                'tanggal_mulai' => now()->subDay(),
                'status' => 'aktif',
            ]);
        }

        return $user->createToken('mobile-test')->plainTextToken;
    };
});

test('logistik antrean hanya menampilkan ritase titik yang diampu', function () {
    $titikA = Titik::factory()->create();
    $titikB = Titik::factory()->create();
    $ritaseA = ($this->buatRitase)($titikA->id);
    $ritaseB = ($this->buatRitase)($titikB->id);

    $token1 = ($this->buatUserDenganTitik)('Logistik', $titikA);
    $token2 = ($this->buatUserDenganTitik)('Logistik', null);

    $res1 = $this->withToken($token1)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/logistik/ritase/antrean');

    $res1->assertOk();
    $ids1 = collect($res1->json('data.items'))->pluck('id');
    expect($ids1)->toContain($ritaseA->id);
    expect($ids1)->not->toContain($ritaseB->id);

    $this->app->make('auth')->forgetGuards();

    $res2 = $this->withToken($token2)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/logistik/ritase/antrean');

    $res2->assertOk();
    $ids2 = collect($res2->json('data.items'))->pluck('id');
    expect($ids2)->toContain($ritaseA->id);
    expect($ids2)->toContain($ritaseB->id);
});

test('security buku tamu tercatat dengan titik aktif dan daftar hari ini terscope', function () {
    $titikA = Titik::factory()->create();
    $titikB = Titik::factory()->create();

    $tokenA = ($this->buatUserDenganTitik)('Security', $titikA);
    $tokenB = ($this->buatUserDenganTitik)('Security', null);

    $res = $this->withToken($tokenA)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/security/buku-tamu', [
            'nama' => 'Tamu Titik A',
            'asal' => 'PT X',
            'kendaraan' => 'mobil',
        ]);
    $res->assertCreated();

    $tamuA = BukuTamu::where('nama', 'Tamu Titik A')->firstOrFail();
    expect($tamuA->titik_id)->toBe($titikA->id);

    BukuTamu::create([
        'nama' => 'Tamu Tanpa Titik',
        'asal' => 'PT Y',
        'kendaraan' => 'tanpa_kendaraan',
        'waktu_masuk' => now(),
    ]);
    BukuTamu::create([
        'nama' => 'Tamu Titik B',
        'asal' => 'PT Z',
        'kendaraan' => 'tanpa_kendaraan',
        'waktu_masuk' => now(),
        'titik_id' => $titikB->id,
    ]);

    $resA = $this->withToken($tokenA)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/security/buku-tamu/hari-ini');
    $resA->assertOk();

    $namaA = collect($resA->json('data.items'))->pluck('nama');
    expect($namaA)->toContain('Tamu Titik A');
    expect($namaA)->toContain('Tamu Tanpa Titik');
    expect($namaA)->not->toContain('Tamu Titik B');

    $this->app->make('auth')->forgetGuards();

    $resB = $this->withToken($tokenB)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/security/buku-tamu/hari-ini');
    $resB->assertOk();

    $namaB = collect($resB->json('data.items'))->pluck('nama');
    expect($namaB)->toContain('Tamu Titik A');
    expect($namaB)->toContain('Tamu Tanpa Titik');
    expect($namaB)->toContain('Tamu Titik B');
});

test('workshop melihat pengajuan disetujui dan dikerjakan unit lain, diajukan tetap tersembunyi', function () {
    $tokenWorkshop = ($this->buatUserDenganTitik)('Workshop', null);

    $otherUser = User::factory()->create(['is_active' => true]);
    $disetujui = PengajuanServisArmada::factory()->for($this->armada)->create([
        'diajukan_oleh' => $otherUser->id,
        'status' => 'disetujui',
    ]);
    $diajukan = PengajuanServisArmada::factory()->for($this->armada)->create([
        'diajukan_oleh' => $otherUser->id,
        'status' => 'diajukan',
    ]);

    $res = $this->withToken($tokenWorkshop)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/servis-armada');

    $res->assertOk();
    $ids = collect($res->json('data.data'))->pluck('id');
    expect($ids)->toContain($disetujui->id);
    expect($ids)->not->toContain($diajukan->id);
});
