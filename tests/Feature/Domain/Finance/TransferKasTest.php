<?php

use App\Models\User;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\TransferAntarKas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->adminKeuangan = User::factory()->create();
    $this->adminKeuangan->assignRole('Admin Keuangan');

    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');

    $unit = UnitBisnis::factory()->create();
    $this->akunSumber = AkunKasBank::factory()->create([
        'unit_bisnis_id' => $unit->id,
        'saldo_awal' => 5000000,
    ]);
    $this->akunTujuan = AkunKasBank::factory()->create([
        'unit_bisnis_id' => $unit->id,
        'saldo_awal' => 1000000,
    ]);
});

test('admin keuangan can view transfer index', function () {
    $this->actingAs($this->adminKeuangan)
        ->get(route('finance.transfer-kas.index'))
        ->assertStatus(200);
});

test('admin keuangan can create transfer', function () {
    $data = [
        'dari_akun_kas_bank_id' => $this->akunSumber->id,
        'ke_akun_kas_bank_id' => $this->akunTujuan->id,
        'jumlah' => 2000000,
        'tanggal' => now()->toDateString(),
        'catatan' => 'Transfer test',
    ];

    $this->actingAs($this->adminKeuangan)
        ->post(route('finance.transfer-kas.store'), $data)
        ->assertRedirect();

    // Cek transfer tercatat
    $this->assertDatabaseHas('transfer_antar_kas', [
        'dari_akun_kas_bank_id' => $this->akunSumber->id,
        'ke_akun_kas_bank_id' => $this->akunTujuan->id,
        'jumlah' => 2000000,
    ]);

    // Cek mutasi keluar (sumber)
    $this->assertDatabaseHas('mutasi_kas_banks', [
        'akun_kas_bank_id' => $this->akunSumber->id,
        'tipe' => 'keluar',
        'jumlah' => 2000000,
        'referensi_type' => TransferAntarKas::class,
    ]);

    // Cek mutasi masuk (tujuan)
    $this->assertDatabaseHas('mutasi_kas_banks', [
        'akun_kas_bank_id' => $this->akunTujuan->id,
        'tipe' => 'masuk',
        'jumlah' => 2000000,
        'referensi_type' => TransferAntarKas::class,
    ]);
});

test('transfer cannot exceed source balance', function () {
    $data = [
        'dari_akun_kas_bank_id' => $this->akunSumber->id,
        'ke_akun_kas_bank_id' => $this->akunTujuan->id,
        'jumlah' => 10000000, // lebih dari saldo 5.000.000
        'tanggal' => now()->toDateString(),
    ];

    $this->actingAs($this->adminKeuangan)
        ->post(route('finance.transfer-kas.store'), $data)
        ->assertSessionHasErrors('jumlah');
});

test('transfer cannot be to same account', function () {
    $data = [
        'dari_akun_kas_bank_id' => $this->akunSumber->id,
        'ke_akun_kas_bank_id' => $this->akunSumber->id, // sama!
        'jumlah' => 1000000,
        'tanggal' => now()->toDateString(),
    ];

    $this->actingAs($this->adminKeuangan)
        ->post(route('finance.transfer-kas.store'), $data)
        ->assertSessionHasErrors();
});
