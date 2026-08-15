<?php

use App\Models\User;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->adminKeuangan = User::factory()->create();
    $this->adminKeuangan->assignRole('Admin Keuangan');

    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');

    $unit = UnitBisnis::factory()->create();
    $this->akun = AkunKasBank::factory()->create([
        'unit_bisnis_id' => $unit->id,
        'saldo_awal' => 1000000,
    ]);
});

test('admin keuangan can view mutasi index', function () {
    $this->actingAs($this->adminKeuangan)
        ->get(route('finance.mutasi-kas.index'))
        ->assertStatus(200);
});

test('mutasi index shows saldo calculation', function () {
    // Buat mutasi masuk 500.000
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'masuk',
        'jumlah' => 500000,
    ]);
    // Buat mutasi keluar 200.000
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'keluar',
        'jumlah' => 200000,
    ]);

    $response = $this->actingAs($this->adminKeuangan)
        ->get(route('finance.mutasi-kas.report', [
            'akun_kas_bank_id' => $this->akun->id,
            'bulan' => now()->month,
            'tahun' => now()->year,
        ]));

    $response->assertStatus(200);
    // Saldo harus: 1.000.000 + 500.000 - 200.000 = 1.300.000
    $response->assertInertia(fn ($page) => $page
        ->component('Finance/MutasiKas/Report')
        ->where('saldoAwal', 1000000)
        ->where('saldoAkhir', 1300000)
    );
});

test('admin keuangan can view report', function () {
    $this->actingAs($this->adminKeuangan)
        ->get(route('finance.mutasi-kas.report', [
            'akun_kas_bank_id' => $this->akun->id,
            'bulan' => now()->month,
            'tahun' => now()->year,
        ]))
        ->assertStatus(200);
});

test('normal user cannot access mutasi', function () {
    $this->actingAs($this->user)
        ->get(route('finance.mutasi-kas.index'))
        ->assertStatus(403);
});

test('mutasi store is disabled for read-only controllers', function () {
    // Mutasi seharusnya dibuat otomatis, bukan manual
    // Tapi jika ada route store, harus di-protect
    $data = [
        'akun_kas_bank_id' => $this->akun->id,
        'kategori' => 'TEST',
        'tipe' => 'masuk',
        'jumlah' => 100000,
        'tanggal' => now()->toDateString(),
    ];

    $this->actingAs($this->adminKeuangan)
        ->post(route('finance.mutasi-kas.store'), $data)
        ->assertStatus(403); // Harus ditolak karena read-only
});
