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
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Produk;
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

// ── Phase 1: Widget antar modul (list clickable + chart) ──────────────

test('owner menerima widget armada (list + chart) dengan data lintas unit', function () {
    $armadaUnitA = Armada::factory()->for($this->unit)->create();
    $armadaUnitB = Armada::factory()->for($this->unitB)->create();
    $kendaraan = Armada::factory()->for($this->unit)->truckMolen()->create();

    $rute = RuteTarif::factory()->create();
    $driver = Karyawan::factory()->create();
    Ritase::factory()->create([
        'armada_id' => $armadaUnitA->id,
        'driver_karyawan_id' => $driver->id,
        'rute_tarif_id' => $rute->id,
        'tanggal' => now()->toDateString(),
        'proyek_id' => $this->proyekMilik->id,
    ]);

    $this->actingAs($this->owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('ownerData.widgets.armada.aktif_list', 3)
            ->has('ownerData.widgets.armada.ritase_today_list', 1)
            ->where('ownerData.widgets.armada.ritase_today_list.0.armada_id', $armadaUnitA->id)
            ->has('ownerData.widgets.armada.total_armada')
            ->has('ownerData.widgets.armada.status_distribution')
            ->has('ownerData.widgets.armada.bbm_today_chart')
        );
});

test('armada widget DISCALING lingkup unit untuk user ber-unit (bukan kebocoran global)', function () {
    $armadaUnitA = Armada::factory()->for($this->unit)->create();
    $armadaUnitB = Armada::factory()->for($this->unitB)->create();

    $user = User::factory()->create(['unit_bisnis_id' => $this->unit->id]);
    $user->assignRole('Koordinator GCS');

    $response = $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();

    $assert = Assert::fromTestResponse($response);
    $widgets = $assert->toArray()['props']['ownerData']['widgets']['armada'] ?? null;

    expect($widgets)->not->toBeNull()
        ->and($widgets['total_armada'])->toBe(1)
        ->and($widgets['aktif_list'])->toHaveCount(1)
        ->and($widgets['aktif_list'][0]['id'])->toBe($armadaUnitA->id);

    $allIds = array_column($widgets['aktif_list'], 'id');
    expect($allIds)->not->toContain($armadaUnitB->id);
});

test('owner menerima widget admin: PO pending, unit summary, audit & deadline', function () {
    // created_at diberi jeda eksplisit: list diurutkan latest-first per detik.
    PurchaseOrder::factory()
        ->for($this->proyekMilik)
        ->create(['status' => 'menunggu_approval_owner', 'created_at' => now()->subMinute()]);
    PurchaseOrder::factory()
        ->for($this->proyekMilik)
        ->create(['status' => 'menunggu_approval_finance']);

    $this->actingAs($this->owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('ownerData.widgets.admin.po_pending_list', 2)
            ->where('ownerData.widgets.admin.po_pending_list.0.status', 'menunggu_approval_finance')
            ->where('ownerData.widgets.admin.po_pending_list.0.status_label', 'Menunggu Approval Finance')
            ->has('ownerData.widgets.admin.unit_summary', 2)
            ->has('ownerData.widgets.admin.deadline_list')
            ->has('ownerData.widgets.admin.audit_list')
        );
});

test('unit summary berisi volume per unit bisnis (proyek/titik/armada) dengan total konsisten', function () {
    Armada::factory()->for($this->unit)->create();

    $response = $this->actingAs($this->owner)
        ->get(route('dashboard'))
        ->assertOk();

    $assert = Assert::fromTestResponse($response);
    $unitSummary = $assert->toArray()['props']['ownerData']['widgets']['admin']['unit_summary'] ?? [];

    expect(count($unitSummary))->toBe(2);

    // Unit pertama 3 proyek (milik+orang+internal), unit kedua 1 proyek.
    $byProyek = collect($unitSummary)
        ->map(fn ($u) => $u['proyek_aktif'])
        ->sort()
        ->values()
        ->all();
    expect($byProyek)->toBe([1, 3]);

    // Armada aktif di unit pertama (unit milik) = 1.
    $byArmada = collect($unitSummary)
        ->map(fn ($u) => $u['armada_aktif'])
        ->sum();
    expect($byArmada)->toBe(1);

    // Titik aktif: hanya titik dari proyek unit pertama.
    $byTitik = collect($unitSummary)
        ->map(fn ($u) => $u['titik_aktif'])
        ->sum();
    expect($byTitik)->toBe(2);
});

test('kontraktor TIDAK menerima widget antar modul (armada/admin/produksi)', function () {
    Armada::factory()->for($this->unit)->create();
    PurchaseOrder::factory()->for($this->proyekMilik)->create(['status' => 'menunggu_approval_finance']);

    $kontraktor = User::factory()->create();
    $kontraktor->assignRole('Kontraktor');
    $this->proyekMilik->users()->sync([$kontraktor->id]);

    $this->actingAs($kontraktor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->missing('ownerData.widgets.armada')
            ->missing('ownerData.widgets.admin')
            ->missing('ownerData.widgets.produksi')
        );
});

test('koordinator produksi menerima widget produksi (sesi jalan, QC, pengiriman, tren)', function () {
    $mesin = MesinProduksi::create([
        'unit_bisnis_id' => $this->unit->id,
        'nama' => 'AMP 1',
        'jenis' => 'mixer_aspal',
        'kapasitas' => '60 tph',
        'status' => 'aktif',
        'titik_id' => $this->titikMilik->id,
    ]);
    $produk = Produk::factory()->for($this->unit)->create();
    $operator = Karyawan::factory()->create();

    ProductionSession::create([
        'mesin_id' => $mesin->id,
        'titik_id' => $this->titikMilik->id,
        'produk_id' => $produk->id,
        'operator_karyawan_id' => $operator->id,
        'mulai' => now()->subHour(),
        'status' => 'berjalan',
        'hasil_output' => 0,
    ]);

    $produksi = User::factory()->create();
    $produksi->assignRole('Koordinator CBP');

    $this->actingAs($produksi)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('ownerData.widgets.produksi.sesi_berjalan_list', 1)
            ->where('ownerData.widgets.produksi.sesi_berjalan_list.0.produk', $produk->nama)
            ->where('ownerData.widgets.produksi.sesi_berjalan_list.0.titik', $this->titikMilik->nama)
            ->has('ownerData.widgets.produksi.qc_pending_list')
            ->has('ownerData.widgets.produksi.pengiriman_today_list')
            ->has('ownerData.widgets.produksi.output_per_produk')
            ->has('ownerData.widgets.produksi.tren_7_hari', 7)
            ->missing('ownerData.widgets.armada')
        );
});