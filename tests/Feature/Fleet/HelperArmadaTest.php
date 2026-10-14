<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordHelperPresensiAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Domain\Fleet\Models\HelperArmada;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Permission::findOrCreate('manage fleet');
    Permission::findOrCreate('manage helper armada');
    Role::findOrCreate('Driver Armada', 'web');

    $this->unit = UnitBisnis::factory()->create(['kode' => 'U-'.((string) Illuminate\Support\Str::uuid())]);
    $this->armada = Armada::factory()->for($this->unit)->create();

    // PIC (utama) armada
    $this->pic = User::factory()->create(['is_active' => true]);
    $this->pic->givePermissionTo('manage fleet');
    $this->picKaryawan = Karyawan::factory()->create(['user_id' => $this->pic->id]);
    ArmadaPenanggungJawab::create([
        'armada_id' => $this->armada->id,
        'karyawan_id' => $this->picKaryawan->id,
        'peran' => 'utama',
        'mulai_dari' => now()->subMonth()->toDateString(),
        'sampai' => null,
        'created_by' => $this->pic->id,
    ]);

    // Non-PIC: punya manage fleet TAPI bukan PIC armada ini (bukti isolasi bukan role-based)
    $this->nonPic = User::factory()->create(['is_active' => true]);
    $this->nonPic->givePermissionTo('manage fleet');
    $this->nonPicKaryawan = Karyawan::factory()->create(['user_id' => $this->nonPic->id]);

    // Manager (Ketua Armada / HR): pemegang manage helper armada.
    // TIDAK punya manage fleet — sengaja, seperti Koordinator SDM.
    $this->manager = User::factory()->create(['is_active' => true]);
    $this->manager->givePermissionTo('manage helper armada');
    $this->managerKaryawan = Karyawan::factory()->create(['user_id' => $this->manager->id]);
});

function makeHelper($pic): HelperArmada
{
    return HelperArmada::create([
        'armada_id' => $pic->armada->id,
        'nama' => 'Budi Serabutan',
        'no_hp' => '081234567890',
        'honor' => 150000,
        'durasi_mulai' => now()->toDateString(),
        'durasi_selesai' => now()->addWeek()->toDateString(),
        'status' => 'aktif',
        'created_by' => $pic->pic->id,
    ]);
}

// ========== WEB: CRUD + VISIBILITY (manager-only) ==========

test('manager dengan manage helper armada dapat membuat helper via web', function () {
    $this->actingAs($this->manager)
        ->from(route('fleet.helper.index'))
        ->post(route('fleet.helper.store'), [
            'armada_id' => $this->armada->id,
            'nama' => 'Budi Serabutan',
            'no_hp' => '081234567890',
            'honor' => 150000,
            'durasi_mulai' => now()->toDateString(),
            'durasi_selesai' => now()->addWeek()->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('helper_armadas', [
        'armada_id' => $this->armada->id,
        'nama' => 'Budi Serabutan',
        'honor' => 150000,
        'created_by' => $this->manager->id,
    ]);
});

test('manager dapat memperbarui helper armada via web', function () {
    $helper = makeHelper($this);

    $this->actingAs($this->manager)
        ->from(route('fleet.helper.index'))
        ->put(route('fleet.helper.update', $helper->id), [
            'nama' => 'Budi Updated',
            'honor' => 200000,
            'durasi_mulai' => now()->toDateString(),
            'status' => 'aktif',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('helper_armadas', [
        'id' => $helper->id,
        'nama' => 'Budi Updated',
        'honor' => 200000,
    ]);
});

test('manager dapat membuka fleet/helper; tanpa permission ditolak 403', function () {
    $this->actingAs($this->manager)
        ->get(route('fleet.helper.index'))
        ->assertOk();

    // Non-PIC cuma punya manage fleet, tidak punya manage helper armada.
    $this->actingAs($this->nonPic)
        ->get(route('fleet.helper.index'))
        ->assertForbidden();
});

test('tanpa manage helper armada tidak dapat membuat helper (bukan PIC lagi yang menentukan)', function () {
    $this->actingAs($this->nonPic)
        ->from(route('fleet.armada.index'))
        ->post(route('fleet.helper.store'), [
            'armada_id' => $this->armada->id,
            'nama' => 'Coba Curi',
            'honor' => 100000,
            'durasi_mulai' => now()->toDateString(),
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('helper_armadas', 0);
});

test('PIC aktif boleh lihat helper tapi TIDAK boleh kelola (kelola khusus manager)', function () {
    $helper = makeHelper($this);

    // PIC aktif armada: boleh lihat, tapi tanpa manage helper armada -> tidak boleh edit/hapus.
    expect($this->pic->can('view', $helper))->toBeTrue()
        ->and($this->pic->can('update', $helper))->toBeFalse()
        ->and($this->pic->can('delete', $helper))->toBeFalse();

    // Manager (punya manage helper armada) tetap boleh kelola.
    expect($this->manager->can('update', $helper))->toBeTrue();

    // Setelah PIC dicopot, akses lihat ikut hilang (created_by bukan lagi penentu).
    ArmadaPenanggungJawab::where('armada_id', $this->armada->id)
        ->whereNull('sampai')
        ->update(['sampai' => now()->toDateString()]);

    expect($this->pic->can('view', $helper))->toBeFalse();
});

test('non-PIC tidak bisa melihat helper via policy', function () {
    $helper = makeHelper($this);

    expect($this->nonPic->can('view', $helper))->toBeFalse();
    expect($this->nonPic->can('update', $helper))->toBeFalse();
});

test('tanpa manage helper armada tidak dapat menghapus helper', function () {
    $helper = makeHelper($this);

    $this->actingAs($this->nonPic)
        ->from(route('fleet.helper.index'))
        ->delete(route('fleet.helper.destroy', $helper->id))
        ->assertForbidden();

    $this->assertDatabaseHas('helper_armadas', ['id' => $helper->id]);
});

// ========== ACTION: RECORD HELPER PRESENSI ==========

test('PIC aktif mencatat check-in helper', function () {
    $helper = makeHelper($this);

    $presensi = (new RecordHelperPresensiAction)->execute($helper, $this->pic, [
        'tipe' => 'check_in',
        'tanggal' => now()->toDateString(),
        'foto' => 'foto/presensi-helper/checkin.jpg',
    ]);

    expect($presensi->check_in)->not->toBeNull()
        ->and($presensi->foto_check_in)->toBe('foto/presensi-helper/checkin.jpg')
        ->and($presensi->dicatat_oleh)->toBe($this->pic->id);

    $this->assertDatabaseHas('presensi_helpers', [
        'helper_armada_id' => $helper->id,
        'foto_check_in' => 'foto/presensi-helper/checkin.jpg',
    ]);
});

test('check-in lalu check-out tetap satu baris per hari', function () {
    $helper = makeHelper($this);
    $action = new RecordHelperPresensiAction;

    $action->execute($helper, $this->pic, [
        'tipe' => 'check_in',
        'tanggal' => now()->toDateString(),
        'foto' => 'foto/presensi-helper/in.jpg',
    ]);

    $action->execute($helper, $this->pic, [
        'tipe' => 'check_out',
        'tanggal' => now()->toDateString(),
        'foto' => 'foto/presensi-helper/out.jpg',
    ]);

    $this->assertDatabaseCount('presensi_helpers', 1);
    $this->assertDatabaseHas('presensi_helpers', [
        'helper_armada_id' => $helper->id,
        'foto_check_in' => 'foto/presensi-helper/in.jpg',
        'foto_check_out' => 'foto/presensi-helper/out.jpg',
    ]);
});

test('user bukan PIC aktif armada helper ditolak', function () {
    $helper = makeHelper($this);

    expect(fn () => (new RecordHelperPresensiAction)->execute($helper, $this->nonPic, [
        'tipe' => 'check_in',
        'tanggal' => now()->toDateString(),
        'foto' => 'foto/presensi-helper/in.jpg',
    ]))->toThrow(ValidationException::class);
});

test('check-in tanpa foto ditolak', function () {
    $helper = makeHelper($this);

    expect(fn () => (new RecordHelperPresensiAction)->execute($helper, $this->pic, [
        'tipe' => 'check_in',
        'tanggal' => now()->toDateString(),
        'foto' => null,
    ]))->toThrow(ValidationException::class);
});

// ========== MOBILE: LIST & PRESENSI ==========

test('GET mobile armada/helper menampilkan helper milik PIC', function () {
    $helper = makeHelper($this);
    $this->pic->assignRole('Driver Armada');
    $token = $this->pic->createToken('mobile-test')->plainTextToken;

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/armada/helper')
        ->assertOk()
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.nama', 'Budi Serabutan')
        ->assertJsonPath('data.items.0.armada_id', $this->armada->id)
        ->assertJsonPath('data.items.0.presensi_hari_ini', null);
});

test('GET mobile armada/helper tidak bocor ke non-PIC', function () {
    $helper = makeHelper($this);
    $this->nonPic->assignRole('Driver Armada');
    $token = $this->nonPic->createToken('mobile-test')->plainTextToken;

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/armada/helper')
        ->assertOk()
        ->assertJsonCount(0, 'data.items');
});

test('POST mobile presensi helper: check-in lalu check-out oleh PIC', function () {
    $helper = makeHelper($this);
    $this->pic->assignRole('Driver Armada');
    $token = $this->pic->createToken('mobile-test')->plainTextToken;

    $this->withToken($token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson("/api/mobile/armada/helper/{$helper->id}/presensi", [
            'tipe' => 'check_in',
            'foto' => 'foto/presensi-helper/mobile-in.jpg',
        ])
        ->assertOk()
        ->assertJsonPath('data.foto_check_in', 'foto/presensi-helper/mobile-in.jpg');

    $this->withToken($token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson("/api/mobile/armada/helper/{$helper->id}/presensi", [
            'tipe' => 'check_out',
            'foto' => 'foto/presensi-helper/mobile-out.jpg',
        ])
        ->assertOk()
        ->assertJsonPath('data.foto_check_out', 'foto/presensi-helper/mobile-out.jpg');

    $this->assertDatabaseCount('presensi_helpers', 1);
    $this->assertDatabaseHas('presensi_helpers', [
        'helper_armada_id' => $helper->id,
        'foto_check_in' => 'foto/presensi-helper/mobile-in.jpg',
        'foto_check_out' => 'foto/presensi-helper/mobile-out.jpg',
        'dicatat_oleh' => $this->pic->id,
    ]);
});

test('POST mobile presensi oleh non-PIC ditolak 422', function () {
    $helper = makeHelper($this);
    $this->nonPic->assignRole('Driver Armada');
    $token = $this->nonPic->createToken('mobile-test')->plainTextToken;

    $this->withToken($token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/armada/helper/{$helper->id}/presensi", [
            'tipe' => 'check_in',
            'foto' => 'foto/presensi-helper/curi.jpg',
        ])
        ->assertStatus(422);

    $this->assertDatabaseCount('presensi_helpers', 0);
});