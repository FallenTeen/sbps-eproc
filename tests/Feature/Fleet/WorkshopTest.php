<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\CompleteWorkshopTodoAction;
use App\Domain\Fleet\Actions\RecordTodoSparepartAction;
use App\Domain\Fleet\Actions\RequestSparepartAction;
use App\Domain\Fleet\Actions\StoreWorkshopTodoAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Domain\Production\Models\MesinProduksi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    $perms = [
        'view fleet service', 'manage fleet service', 'approve fleet service',
        'submit fleet service', 'manage sparepart', 'view sparepart',
        'manage fleet', 'view fleet',
    ];
    foreach ($perms as $p) {
        Permission::findOrCreate($p);
    }
    Role::findOrCreate('Ketua Divisi Armada', 'web');
    Role::findOrCreate('Workshop', 'web');
    Role::findOrCreate('Inventory', 'web');
    Role::findOrCreate('Owner', 'web');
    Role::findOrCreate('Koordinator GCS', 'web');

    $this->armada = Armada::factory()->create(['status' => 'aktif']);

    $this->pic = User::factory()->create(['is_active' => true]);
    $this->pic->givePermissionTo(['view fleet service', 'submit fleet service', 'view fleet']);

    $this->workshop = User::factory()->create(['is_active' => true]);
    $this->workshop->givePermissionTo(['view fleet service', 'manage fleet service', 'submit fleet service', 'view fleet']);
    $this->workshop->syncRoles(['Workshop']);

    $this->inventory = User::factory()->create(['is_active' => true]);
    $this->inventory->givePermissionTo(['view fleet service', 'manage sparepart', 'view sparepart', 'view fleet']);
    $this->inventory->syncRoles(['Inventory']);

    $this->owner = User::factory()->create(['is_active' => true]);
    $this->owner->givePermissionTo($perms);
    $this->owner->syncRoles(['Owner']);
});

test('dueDate mingguan mengembalikan hari berikutnya sesuai jadwal_detail', function () {
    $todo = WorkshopTodo::factory()->create(['jadwal_tipe' => 'mingguan', 'jadwal_detail' => 'senin']);

    $from = Carbon::parse('2026-09-06'); // Minggu
    $expect = Carbon::parse('2026-09-07'); // Senin

    expect($todo->dueDate($from)->eq($expect))->toBeTrue();

    // Dari Selasa, jadwal Senin minggu ini sudah lewat → Senin pekan depan
    $from = Carbon::parse('2026-09-08');
    $expect = Carbon::parse('2026-09-14');

    expect($todo->dueDate($from)->eq($expect))->toBeTrue();
});

test('dueDate harian selalu hari ini dan bulanan memakai clamp 28', function () {
    $harian = WorkshopTodo::factory()->create(['jadwal_tipe' => 'harian']);
    $bulanan = WorkshopTodo::factory()->create(['jadwal_tipe' => 'bulanan', 'jadwal_detail' => '31']);

    $from = Carbon::parse('2026-09-07 10:00:00');
    expect($harian->dueDate($from)->eq(Carbon::parse('2026-09-07')))->toBeTrue();
    expect($bulanan->dueDate($from)->toDateString())->toBe('2026-09-28');
});

test('status_text menurunkan status terlewat saat jadwal lewat tanpa selesai', function () {
    $kemarin = Carbon::now()->subDay()->toDateString();

    $todo = WorkshopTodo::factory()->create([
        'jadwal_tipe' => 'tanggal_tertentu',
        'jadwal_detail' => $kemarin,
        'status' => 'terjadwal',
    ]);

    expect($todo->status_text)->toBe('terlewat');

    $todo->update(['status' => 'selesai']);
    expect($todo->fresh()->status_text)->toBe('selesai');
});

test('StoreWorkshopTodoAction membuat to-do harian dan mesin dengan created_by', function () {
    $unit = UnitBisnis::factory()->create();
    $mesin = MesinProduksi::create([
        'unit_bisnis_id' => $unit->id,
        'nama' => 'Mesin Batching CBP',
        'jenis' => 'mixer_beton',
        'status' => 'aktif',
    ]);

    $todo = (new StoreWorkshopTodoAction)->execute($this->workshop, [
        'judul' => 'Ganti oli mesin CC',
        'deskripsi' => 'Dilakukan setiap pagi',
        'jadwal_tipe' => 'harian',
        'mesin_id' => $mesin->id,
        'assigned_to' => $this->workshop->id,
    ]);

    expect($todo->id)->not->toBeNull();
    expect($todo->created_by)->toBe($this->workshop->id);
    expect($todo->mesin->nama)->toBe('Mesin Batching CBP');
    expect($todo->unit_label)->toBe('Mesin Batching CBP');
    expect($todo->jadwal_label)->toBe('Harian');
});

test('role Workshop bisa membuka halaman to-do servis via web', function () {
    $this->actingAs($this->workshop)
        ->get(route('fleet.workshop.todo.index'))
        ->assertOk();
});

test('role Workshop bisa membuat to-do via web POST', function () {
    $this->actingAs($this->workshop)
        ->post(route('fleet.workshop.todo.store'), [
            'judul' => 'Cek kondisi ban',
            'jadwal_tipe' => 'mingguan',
            'jadwal_detail' => 'rabu',
            'armada_id' => $this->armada->id,
            'assigned_to' => $this->workshop->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseCount('workshop_todos', 1);
});

test('validasi jadwal_detail menolak hari tidak valid untuk tipe mingguan', function () {
    $this->actingAs($this->workshop)
        ->post(route('fleet.workshop.todo.store'), [
            'judul' => 'Cek oli',
            'jadwal_tipe' => 'mingguan',
            'jadwal_detail' => 'pertengahan',
        ])
        ->assertSessionHasErrors('jadwal_detail');

    $this->assertDatabaseCount('workshop_todos', 0);
});

test('RequestSparepartAction dari to-do menyimpan item dengan workshop_todo_id', function () {
    $todo = WorkshopTodo::factory()->create(['armada_id' => $this->armada->id]);

    $result = (new RequestSparepartAction)->execute($this->workshop, [
        ['nama_item' => 'Filter Oli', 'jumlah' => 2, 'satuan' => 'pcs', 'nominal' => 75000],
    ], null, $todo);

    expect($result->is($todo))->toBeTrue();
    expect($todo->fresh()->status)->toBe('terjadwal');

    $item = PengajuanServisSparepart::where('workshop_todo_id', $todo->id)->first();
    expect($item)->not->toBeNull();
    expect($item->status)->toBe('diajukan');
    expect($item->pengajuan_servis_armada_id)->toBeNull();
});

test('RequestSparepartAction menolak tanpa sumber', function () {
    expect(fn () => (new RequestSparepartAction)->execute($this->workshop, [
        ['nama_item' => 'Baut'],
    ]))->toThrow(ValidationException::class);
});

test('Workshop bisa mengajukan sparepart dari to-do via web, Inventory mencatatnya tersedia', function () {
    $todo = WorkshopTodo::factory()->create(['armada_id' => $this->armada->id]);

    $this->actingAs($this->workshop)
        ->post(route('fleet.workshop.todo.request-sparepart', $todo->id), [
            'items' => [
                ['nama_item' => 'Oli Mesin', 'jumlah' => 2, 'satuan' => 'liter', 'nominal' => 50000],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $item = PengajuanServisSparepart::where('workshop_todo_id', $todo->id)->first();
    expect($item)->not->toBeNull();
    expect($item->status)->toBe('diajukan');

    // Inventory mencatat pengadaan rutin -> tersedia
    $this->actingAs($this->inventory)
        ->post(route('fleet.workshop.sparepart.record'), [
            'items' => [
                ['id' => $item->id, 'nominal' => 50000, 'jumlah' => 2],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($item->fresh()->status)->toBe('tersedia');
});

test('role Workshop dan Inventory bisa membuka halaman ajuan sparepart', function () {
    $this->actingAs($this->workshop)
        ->get(route('fleet.workshop.sparepart.index'))
        ->assertOk();

    $this->actingAs($this->inventory)
        ->get(route('fleet.workshop.sparepart.index'))
        ->assertOk();
});

test('CompleteWorkshopTodoAction menandai selesai dan menolak duplikat', function () {
    $todo = WorkshopTodo::factory()->create();

    (new CompleteWorkshopTodoAction)->execute($todo, $this->workshop);

    expect($todo->fresh()->status)->toBe('selesai');
    expect($todo->fresh()->status_text)->toBe('selesai');

    expect(fn () => (new CompleteWorkshopTodoAction)->execute($todo->fresh(), $this->workshop))
        ->toThrow(ValidationException::class);
});

test('Workshop bisa menyelesaikan to-do via web complete', function () {
    $todo = WorkshopTodo::factory()->create();

    $this->actingAs($this->workshop)
        ->post(route('fleet.workshop.todo.complete', $todo->id))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($todo->fresh()->status)->toBe('selesai');
});

test('user tanpa permission workshop ditolak (403)', function () {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->get(route('fleet.workshop.todo.index'))
        ->assertForbidden();
});

test('halaman riwayat dan monitoring dapat diakses role Workshop', function () {
    ArmadaChecklistHarian::factory()->create([
        'checkable_type' => Armada::class,
        'checkable_id' => $this->armada->id,
        'tanggal' => now()->toDateString(),
        'kondisi_baik' => false,
        'item_bermasalah' => 'Ban aus',
    ]);

    $this->actingAs($this->workshop)
        ->get(route('fleet.workshop.riwayat.index'))
        ->assertOk();

    $this->actingAs($this->workshop)
        ->get(route('fleet.workshop.monitoring.index'))
        ->assertOk();
});