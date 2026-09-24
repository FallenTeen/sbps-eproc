<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\ProductionSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->unit = UnitBisnis::factory()->create();
    $this->unitB = UnitBisnis::factory()->create();

    // Proyek milik kontraktor (ditautkan via pivot proyek_user)
    $this->proyekMilik = Proyek::factory()->for($this->unit)->kontrakKlien()->create([
        'created_by' => $this->owner->id,
        'client' => 'PT Klien Milik Kontraktor',
        'kode_proyek' => 'PRJ-OWN-001',
    ]);
    // Proyek kontrak klien milik kontraktor LAIN (tidak boleh bocor)
    $this->proyekOrang = Proyek::factory()->for($this->unit)->kontrakKlien()->create([
        'created_by' => $this->owner->id,
        'client' => 'PT Klien Kontraktor Lain',
        'kode_proyek' => 'PRJ-LAIN-001',
    ]);
    // Proyek internal
    $this->proyekInternal = Proyek::factory()->for($this->unit)->internal()->create([
        'created_by' => $this->owner->id,
        'kode_proyek' => 'PRJ-INT-001',
    ]);
    // Proyek di unit lain (uji scoping unit_bisnis)
    $this->proyekUnitB = Proyek::factory()->for($this->unitB)->kontrakKlien()->create([
        'created_by' => $this->owner->id,
        'client' => 'PT Ragu Unit Lain',
        'kode_proyek' => 'PRJ-UNITB-001',
    ]);

    $this->titikMilik = Titik::factory()->create([
        'proyek_id' => $this->proyekMilik->id,
        'nama' => 'Titik Rahasia Milik',
    ]);
    $this->titikOrang = Titik::factory()->create([
        'proyek_id' => $this->proyekOrang->id,
        'nama' => 'Titik Rahasia Orang Lain',
    ]);
});

test('owner melihat seluruh proyek & titik di dashboard', function () {
    $this->actingAs($this->owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('ownerData.proyek_list', 4)
            ->has('ownerData.peta_titik', 2)
        );
});

test('kontraktor HANYA menerima proyek & titik miliknya (tidak ada kebocoran lintas klien)', function () {
    $kontraktor = User::factory()->create();
    $kontraktor->assignRole('Kontraktor');
    $this->proyekMilik->users()->sync([$kontraktor->id]);

    $this->actingAs($kontraktor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('ownerData.proyek_list', 1)
            ->where('ownerData.proyek_list.0.id', $this->proyekMilik->id)
            ->where('ownerData.proyek_list.0.client', 'PT Klien Milik Kontraktor')
            ->has('ownerData.peta_titik', 1)
            ->where('ownerData.peta_titik.0.proyek_id', $this->proyekMilik->id)
            // Data peta hanya berisi proyek MILIK kontraktor tsb (bukan client lain):
            ->where('ownerData.peta_titik.0.client', 'PT Klien Milik Kontraktor')
            ->where('ownerData.peta_titik.0.proyek_nama', $this->proyekMilik->nama)
        );
});

test('kontraktor TIDAK menerima summary modul yang tidak berhak (users, audit, finance, procurement)', function () {
    $kontraktor = User::factory()->create();
    $kontraktor->assignRole('Kontraktor');
    $this->proyekMilik->users()->sync([$kontraktor->id]);

    $this->actingAs($kontraktor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('ownerData.summary_today.proyek_aktif', 1)
            ->missing('ownerData.summary_today.total_users')
            ->missing('ownerData.summary_today.audit_log_count')
            ->missing('ownerData.summary_today.po_pending_approval')
            ->missing('ownerData.summary_today.saldo_kas')
            ->where('ownerData.access.can_manage_users', false)
            ->where('ownerData.access.can_view_audit', false)
            ->where('ownerData.access.can_view_finance', false)
        );
});

test('admin keuangan mendapat flag users & finance, tapi bukan audit', function () {
    $adminKeuangan = User::factory()->create();
    $adminKeuangan->assignRole('Admin Keuangan');

    $this->actingAs($adminKeuangan)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('ownerData.access.can_manage_users', true)
            ->where('ownerData.access.can_view_finance', true)
            ->where('ownerData.access.can_view_audit', false)
            ->has('ownerData.summary_today.total_users')
            ->missing('ownerData.summary_today.audit_log_count')
        );
});

test('koordinator produksi melihat summary produksi saja (bukan finance/users/audit)', function () {
    $produksi = User::factory()->create();
    $produksi->assignRole('Koordinator CBP');

    $this->actingAs($produksi)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('ownerData.access.can_view_production', true)
            ->where('ownerData.access.can_view_finance', false)
            ->where('ownerData.access.can_manage_users', false)
            ->missing('ownerData.summary_today.saldo_kas')
            ->missing('ownerData.summary_today.invoice_terbit')
            ->missing('ownerData.summary_today.total_users')
        );
});

test('user internal ber-unit hanya melihat proyek unitnya sendiri', function () {
    $user = User::factory()->create(['unit_bisnis_id' => $this->unit->id]);
    $user->assignRole('Koordinator GCS');

    $response = $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();

    $assert = Assert::fromTestResponse($response);

    // Scoping ketat: unit lain (PRJ-UNITB-001) tidak boleh muncul sama sekali.
    $proyekList = $assert->toArray()['props']['ownerData']['proyek_list'] ?? [];
    $ids = array_map(fn ($p) => $p['id'], $proyekList);
    expect(count($ids))->toBe(3)
        ->and($ids)->not->toContain($this->proyekUnitB->id)
        ->and($ids)->toContain($this->proyekMilik->id);
});