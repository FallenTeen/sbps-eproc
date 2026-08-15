<?php

use App\Models\User;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Finance\Models\AkunKasBank;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->adminKeuangan = User::factory()->create();
    $this->adminKeuangan->assignRole('Admin Keuangan');

    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');

    $unit = UnitBisnis::factory()->create();
    $proyek = Proyek::factory()->create(['unit_bisnis_id' => $unit->id]);
    $this->po = PurchaseOrder::factory()->create([
        'proyek_id' => $proyek->id,
        'total' => 1000000,
        'status' => 'diterima',
    ]);
    $this->akunKas = AkunKasBank::factory()->create(['unit_bisnis_id' => $unit->id]);
});

test('admin keuangan can view pembayaran index', function () {
    $this->actingAs($this->adminKeuangan)
        ->get(route('procurement.pembayaran.index'))
        ->assertStatus(200);
});

test('normal user cannot view pembayaran index', function () {
    $this->actingAs($this->user)
        ->get(route('procurement.pembayaran.index'))
        ->assertStatus(403);
});

test('admin keuangan can create pembayaran', function () {
    $data = [
        'jumlah' => 500000,
        'tanggal' => now()->toDateString(),
        'metode' => 'transfer',
        'akun_kas_bank_id' => $this->akunKas->id,
        'catatan' => 'Test payment',
    ];

    $this->actingAs($this->adminKeuangan)
        ->post(route('procurement.purchase-orders.store-payment', $this->po), $data)
        ->assertRedirect();

    $this->assertDatabaseHas('pembayarans', [
        'purchase_order_id' => $this->po->id,
        'jumlah' => 500000,
    ]);

    // Cek status PO berubah jadi dibayar_sebagian
    $this->po->refresh();
    expect($this->po->status)->toBeInstanceOf(\App\Domain\Procurement\States\DibayarSebagian::class);
});

test('pembayaran cannot exceed remaining balance', function () {
    $data = [
        'jumlah' => 1500000, // > total PO 1.000.000
        'tanggal' => now()->toDateString(),
        'metode' => 'transfer',
        'akun_kas_bank_id' => $this->akunKas->id,
    ];

    $this->actingAs($this->adminKeuangan)
        ->post(route('procurement.purchase-orders.store-payment', $this->po), $data)
        ->assertSessionHasErrors('jumlah');
});

test('admin keuangan can view pembayaran detail', function () {
    $payment = Pembayaran::factory()->create([
        'purchase_order_id' => $this->po->id,
        'akun_kas_bank_id' => $this->akunKas->id,
    ]);

    $this->actingAs($this->adminKeuangan)
        ->get(route('procurement.pembayaran.show', $payment))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Procurement/Pembayaran/Show')
            ->where('pembayaran.id', $payment->id)
        );
});

test('owner can create pembayaran', function () {
    $data = [
        'jumlah' => 500000,
        'tanggal' => now()->toDateString(),
        'metode' => 'tunai',
        'akun_kas_bank_id' => $this->akunKas->id,
    ];

    $this->actingAs($this->owner)
        ->post(route('procurement.purchase-orders.store-payment', $this->po), $data)
        ->assertRedirect();
});
