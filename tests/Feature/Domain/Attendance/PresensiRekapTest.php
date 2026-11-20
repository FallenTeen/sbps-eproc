<?php

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    Permission::firstOrCreate(['name' => 'manage presensi']);

    $this->manager = User::factory()->create();
    $this->manager->givePermissionTo('manage presensi');
    $this->actingAs($this->manager);

    $driverUser = User::factory()->create();
    $driverUser->assignRole('Driver Armada');
    $workshopUser = User::factory()->create();
    $workshopUser->assignRole('Workshop');

    $this->driver = Karyawan::factory()->create([
        'user_id' => $driverUser->id,
        'nama' => 'Ahmad Driver',
    ]);
    $this->workshop = Karyawan::factory()->create([
        'user_id' => $workshopUser->id,
        'nama' => 'Budi Workshop',
    ]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->manager->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);

    Presensi::create([
        'karyawan_id' => $this->driver->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->startOfDay()->addHour(),
        'check_out' => now()->startOfDay()->addHours(8),
        'status_validasi' => 'valid',
    ]);
    Presensi::create([
        'karyawan_id' => $this->workshop->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->startOfDay()->addHours(2),
        'status_validasi' => 'luar_radius',
    ]);
});

test('index presensi mode grouped menampilkan agregasi per hari', function () {
    $this->getJson(route('attendance.presensi.index', ['group_by' => 'hari']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Attendance/Presensi/Index')
            ->where('mode', 'grouped')
            ->has('summary')
            ->has('groups')
            ->where('summary.total', 2)
            ->where('summary.karyawan_uniq', 2)
            ->where('summary.selesai', 1)
            ->where('summary.valid', 1)
            ->where('summary.luar_radius', 1)
            ->where('filters.group_by', 'hari'));
});

test('index grouped per hari memiliki baris untuk tanggal presensi', function () {
    $this->getJson(route('attendance.presensi.index', ['group_by' => 'hari']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('groups', function (Illuminate\Support\Collection $groups): bool {
            $baris = $groups->first(fn ($g) => $g['key'] === now()->toDateString());

            return $baris !== null && $baris['total'] === 2;
        }));
});

test('index grouped per titik kerja mengelompokkan berdasarkan titik', function () {
    $this->getJson(route('attendance.presensi.index', ['group_by' => 'titik']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('groups', function (Illuminate\Support\Collection $groups): bool {
            $baris = $groups->first(fn ($g) => $g['key'] === (string) $this->titik->id);

            return $baris !== null
                && $baris['total'] === 2
                && $baris['parent'] === $this->proyek->nama;
        }));
});

test('index grouped per proyek mengelompokkan berdasarkan proyek titik', function () {
    $this->getJson(route('attendance.presensi.index', ['group_by' => 'proyek']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('groups', function (Illuminate\Support\Collection $groups): bool {
            $baris = $groups->first(fn ($g) => $g['key'] === (string) $this->proyek->id);

            return $baris !== null
                && $baris['total'] === 2
                && $baris['parent'] === $this->proyek->kode_proyek;
        }));
});

test('index grouped per karyawan mengelompokkan berdasarkan karyawan', function () {
    $this->getJson(route('attendance.presensi.index', ['group_by' => 'karyawan']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('groups', function (Illuminate\Support\Collection $groups): bool {
            $byKey = $groups->keyBy('key');

            return isset($byKey[(string) $this->driver->id])
                && isset($byKey[(string) $this->workshop->id])
                && $byKey[(string) $this->driver->id]['total'] === 1
                && $byKey[(string) $this->driver->id]['label'] === 'Ahmad Driver'
                && $byKey[(string) $this->workshop->id]['total'] === 1;
        }));
});

test('index grouped per role mengelompokkan berdasarkan role user', function () {
    Presensi::create([
        'karyawan_id' => Karyawan::factory()->create(['nama' => 'Tenaga Harian'])->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->startOfDay()->addHours(3),
        'status_validasi' => 'tidak_valid',
    ]);

    $this->getJson(route('attendance.presensi.index', ['group_by' => 'role']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.total', 3)
            ->where('groups', function (Illuminate\Support\Collection $groups): bool {
                $byLabel = $groups->keyBy('label');

                return isset($byLabel['Driver Armada'])
                    && isset($byLabel['Workshop'])
                    && isset($byLabel['Tanpa Akun User'])
                    && $byLabel['Driver Armada']['total'] === 1
                    && $byLabel['Workshop']['total'] === 1
                    && $byLabel['Tanpa Akun User']['total'] === 1;
            }));
});

test('index grouped dapat difilter berdasarkan rentang tanggal', function () {
    $this->getJson(route('attendance.presensi.index', [
        'group_by' => 'hari',
        'from' => now()->subDays(10)->toDateString(),
        'to' => now()->subDays(9)->toDateString(),
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 0));
});

test('index grouped dapat difilter berdasarkan status validasi', function () {
    $this->getJson(route('attendance.presensi.index', [
        'group_by' => 'hari',
        'status_validasi' => 'valid',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.total', 1)
            ->where('summary.valid', 1));
});

test('index grouped dapat difilter berdasarkan titik kerja', function () {
    $titikLain = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
    Presensi::create([
        'karyawan_id' => $this->workshop->id,
        'titik_id' => $titikLain->id,
        'check_in' => now()->startOfDay()->addHours(4),
        'check_out' => now()->startOfDay()->addHours(9),
        'status_validasi' => 'valid',
    ]);

    $this->getJson(route('attendance.presensi.index', [
        'group_by' => 'hari',
        'titik_id' => $this->titik->id,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 2));
});

test('rekap detail per hari menampilkan list presensi dari tanggal tersebut', function () {
    $this->getJson(route('attendance.presensi.rekapDetail', [
        'group_by' => 'hari',
        'group_key' => now()->toDateString(),
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Attendance/Presensi/RekapDetail')
            ->has('presensis')
            ->where('group_by', 'hari')
            ->where('presensis.total', 2)
            ->where('presensis.data', function (Illuminate\Support\Collection $data): bool {
                return $data->count() === 2;
            }));
});

test('rekap detail per titik kerja menampilkan hanya presensi titik tersebut', function () {
    $titikLain = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
    Presensi::create([
        'karyawan_id' => $this->driver->id,
        'titik_id' => $titikLain->id,
        'check_in' => now()->startOfDay()->addHours(5),
        'status_validasi' => 'valid',
    ]);

    $this->getJson(route('attendance.presensi.rekapDetail', [
        'group_by' => 'titik',
        'group_key' => $this->titik->id,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('presensis.total', 2));
});

test('rekap detail per karyawan menampilkan hanya presensi karyawan tersebut', function () {
    $badrul = Karyawan::factory()->create(['nama' => 'Badrul Karyawan']);
    Presensi::create([
        'karyawan_id' => $badrul->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->startOfDay()->addHours(6),
        'status_validasi' => 'valid',
    ]);

    $this->getJson(route('attendance.presensi.rekapDetail', [
        'group_by' => 'karyawan',
        'group_key' => $this->driver->id,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('group_label', 'Ahmad Driver')
            ->where('presensis.total', 1));
});

test('rekap detail dapat difilter berdasarkan status validasi', function () {
    $this->getJson(route('attendance.presensi.rekapDetail', [
        'group_by' => 'hari',
        'group_key' => now()->toDateString(),
        'status_validasi' => 'valid',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('presensis.total', 1));
});

test('akses presensi index dan rekap detail ditolak tanpa izin', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->getJson(route('attendance.presensi.index', ['group_by' => 'hari']))
        ->assertForbidden();

    $this->getJson(route('attendance.presensi.rekapDetail', [
        'group_by' => 'hari',
        'group_key' => now()->toDateString(),
    ]))->assertForbidden();
});