<?php

use App\Domain\Fleet\Actions\SubmitPengajuanServisAction;
use App\Domain\Fleet\Models\Armada;
use App\Models\User;
use App\Support\RoleMatrix;
use Database\Seeders\DivisiRoleSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Role;

uses(TestCase::class, LazilyRefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(DivisiRoleSeeder::class);
});

/**
 * Semua role — termasuk role divisi — harus punya privilege persis sesuai
 * matriks kanonik (base RoleMatrix::ROLES + DIVISI_AUGMENTS).
 */
test('setiap role memiliki privilege persis matriks kanonik ({role})', function (string $roleName) {
    $role = Role::findByName($roleName, 'web');

    $got = $role->permissions()->pluck('name')->sort()->values()->all();
    $want = collect(RoleMatrix::privilegesFor($roleName))->sort()->values()->all();

    expect($got)->toEqual($want);
})->with(function () {
    return collect(array_keys(RoleMatrix::ROLES))
        ->map(fn (string $name) => [$name])
        ->values()
        ->all();
});

/**
 * REGRESI — root cause tombol approval hilang: user
 * ketua.armada@example.com (role Ketua Divisi Armada) sempat kehilangan
 * `approve fleet service` karena DivisiRoleSeeder lama menimpa via
 * syncPermissions. Setelah seeder kanonik, approval WAJIB muncul.
 */
test('regresi: Ketua Divisi Armada dapat menyetujui servis (tombol approval web)', function () {
    $ketua = User::factory()->create(['is_active' => true]);
    $ketua->assignRole('Ketua Divisi Armada');

    expect($ketua->hasAnyPermission(['approve fleet service', 'approve procurement fleet']))->toBeTrue();

    $armada = Armada::factory()->create(['status' => 'aktif']);
    $pic = User::factory()->create(['is_active' => true]);
    $pic->givePermissionTo(['view fleet service', 'submit fleet service', 'view fleet']);
    $pengajuan = (new SubmitPengajuanServisAction)->execute($pic, [
        'armada_id' => $armada->id,
        'catatan_ajuan' => 'Mesin tidak menyala',
    ]);

    expect($pengajuan->status)->toBeInstanceOf(\App\Domain\Fleet\States\Diajukan::class);
    expect($ketua->can('approve', $pengajuan))->toBeTrue();
});

test('regresi: DivisiRoleSeeder augment TIDAK menghapus privilege dasar', function () {
    $before = Role::findByName('Ketua Divisi Armada', 'web')->permissions()->count();

    $this->seed(DivisiRoleSeeder::class);

    $role = Role::findByName('Ketua Divisi Armada', 'web');

    expect($role->permissions()->count())->toBeGreaterThanOrEqual($before);
    expect($role->hasPermissionTo('approve fleet service'))->toBeTrue();
    expect($role->hasPermissionTo('manage fleet service'))->toBeTrue();
    expect($role->hasPermissionTo('view fleet service'))->toBeTrue();
    expect($role->hasPermissionTo('manage fleet division'))->toBeTrue();
    expect($role->hasPermissionTo('approve procurement division'))->toBeTrue();
});

test('Owner super-admin: semua modul mobile (armada, workshop, inventory, kontraktor)', function () {
    $owner = User::factory()->create(['is_active' => true]);
    $owner->assignRole('Owner');

    foreach ([
        'manage fleet service', 'approve fleet service', 'manage sparepart',
        'manage inventory', 'view inventory', 'manage stok opname', 'view stok opname',
        'view kontraktor', 'manage kontraktor',
        'approve procurement', 'manage finance', 'manage hr', 'manage proyek',
    ] as $p) {
        expect($owner->hasPermissionTo($p))->toBeTrue();
    }
});

test('Admin Keuangan: akses portal kontraktor (matriks mobile) tanpa menu inventory', function () {
    $admin = User::factory()->create(['is_active' => true]);
    $admin->assignRole('Admin Keuangan');

    expect($admin->hasPermissionTo('view kontraktor'))->toBeTrue();
    expect($admin->hasPermissionTo('view procurement'))->toBeTrue();
    expect($admin->hasPermissionTo('manage inventory'))->toBeFalse();
});

test('Ketua Divisi Kontraktor: mengelola portal kontraktor', function () {
    $role = Role::findByName('Ketua Divisi Kontraktor', 'web');

    expect($role->hasPermissionTo('view kontraktor'))->toBeTrue();
    expect($role->hasPermissionTo('manage kontraktor'))->toBeTrue();
    expect($role->hasPermissionTo('approve procurement kontrak'))->toBeTrue();
});

test('privilege role mobile sesuai matriks mobile (armada/workshop/inventory)', function () {
    // Manager armada dapat approve servis di mobile.
    foreach (['Kepala Divisi Armada', 'Ketua Divisi Armada', 'Ketua Armada'] as $manager) {
        $role = Role::findByName($manager, 'web');
        expect($role->hasPermissionTo('approve fleet service'))->toBeTrue();
        expect($role->hasPermissionTo('record ritase'))->toBeTrue();
    }

    // Driver Armada bisa mengajukan servis & mencatat ritase, TIDAK approve.
    $driver = Role::findByName('Driver Armada', 'web');
    expect($driver->hasPermissionTo('submit fleet service'))->toBeTrue();
    expect($driver->hasPermissionTo('record ritase'))->toBeTrue();
    expect($driver->hasPermissionTo('manage presensi'))->toBeTrue();
    expect($driver->hasPermissionTo('approve fleet service'))->toBeFalse();

    // Workshop mengelola pengerjaan & sparepart, TIDAK approve.
    $workshop = Role::findByName('Workshop', 'web');
    expect($workshop->hasPermissionTo('manage fleet service'))->toBeTrue();
    expect($workshop->hasPermissionTo('manage sparepart'))->toBeTrue();
    expect($workshop->hasPermissionTo('view sparepart'))->toBeTrue();
    expect($workshop->hasPermissionTo('approve fleet service'))->toBeFalse();

    // Inventory: stok, opname, & sparepart.
    $inventory = Role::findByName('Inventory', 'web');
    expect($inventory->hasPermissionTo('manage inventory'))->toBeTrue();
    expect($inventory->hasPermissionTo('view inventory'))->toBeTrue();
    expect($inventory->hasPermissionTo('manage stok opname'))->toBeTrue();
    expect($inventory->hasPermissionTo('view stok opname'))->toBeTrue();
    expect($inventory->hasPermissionTo('manage sparepart'))->toBeTrue();
});