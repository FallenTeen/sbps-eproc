<?php

namespace Tests\Feature\Domain\HR;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\HR\Actions\CalculateNetSalaryAction;
use App\Domain\HR\Models\Cuti;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class HRModuleTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        Permission::firstOrCreate(['name' => 'manage hr']);
        Permission::firstOrCreate(['name' => 'manage payroll']);
        Permission::firstOrCreate(['name' => 'view payroll']);
        $this->user = User::factory()->create();
        $this->user->givePermissionTo('manage hr');
        $this->actingAs($this->user);
    }

    public function test_crud_karyawan()
    {
        // CREATE
        $payload = [
            'nama' => 'Budi Santoso',
            'tipe' => 'tetap',
            'jabatan' => 'Staff',
            'rate_gaji_pokok' => 5000000,
            'status' => 'aktif',
        ];
        $response = $this->post(route('hr.karyawan.store'), $payload);
        $response->assertRedirect(route('hr.karyawan.index'));
        $this->assertDatabaseHas('karyawans', ['nama' => 'Budi Santoso']);

        $karyawan = Karyawan::where('nama', 'Budi Santoso')->first();

        // UPDATE
        $updatePayload = array_merge($payload, ['nama' => 'Budi Santoso Updated']);
        $response = $this->put(route('hr.karyawan.update', $karyawan->id), $updatePayload);
        $this->assertDatabaseHas('karyawans', ['nama' => 'Budi Santoso Updated']);

        // DELETE
        $response = $this->delete(route('hr.karyawan.destroy', $karyawan->id));
        $this->assertDatabaseMissing('karyawans', ['id' => $karyawan->id]);
    }

    public function test_assignment_karyawan()
    {
        $karyawan = Karyawan::factory()->create();
        $titikId1 = Str::uuid()->toString();
        $titikId2 = Str::uuid()->toString();

        Schema::disableForeignKeyConstraints();

        // Mocking Titik (we can forceCreate if there's no factory)
        Titik::forceCreate([
            'id' => $titikId1,
            'proyek_id' => Str::uuid()->toString(),
            'nama' => 'Titik A',
            'latitude' => 0.0,
            'longitude' => 0.0,
        ]);
        Titik::forceCreate([
            'id' => $titikId2,
            'proyek_id' => Str::uuid()->toString(),
            'nama' => 'Titik B',
            'latitude' => 0.0,
            'longitude' => 0.0,
        ]);

        Schema::enableForeignKeyConstraints();

        // Assign Titik A
        $response = $this->post(route('hr.karyawan.assign-titik', $karyawan->id), [
            'titik_id' => $titikId1,
            'tanggal_mulai' => now()->format('Y-m-d'),
        ]);

        $this->assertDatabaseHas('karyawan_titik_assignments', [
            'karyawan_id' => $karyawan->id,
            'titik_id' => $titikId1,
            'status' => 'aktif',
        ]);

        // Assign Titik B
        $response = $this->post(route('hr.karyawan.assign-titik', $karyawan->id), [
            'titik_id' => $titikId2,
            'tanggal_mulai' => now()->addDay()->format('Y-m-d'),
        ]);

        // Assert Titik A is 'selesai' and Titik B is 'aktif'
        $this->assertDatabaseHas('karyawan_titik_assignments', [
            'karyawan_id' => $karyawan->id,
            'titik_id' => $titikId1,
            'status' => 'selesai',
        ]);
        $this->assertDatabaseHas('karyawan_titik_assignments', [
            'karyawan_id' => $karyawan->id,
            'titik_id' => $titikId2,
            'status' => 'aktif',
        ]);
    }

    public function test_cuti_and_approval()
    {
        $karyawan = Karyawan::factory()->create();

        // Ajukan cuti
        $response = $this->post(route('hr.cuti.store'), [
            'karyawan_id' => $karyawan->id,
            'tipe' => 'tahunan',
            'tanggal_mulai' => now()->addDays(2)->format('Y-m-d'),
            'tanggal_selesai' => now()->addDays(4)->format('Y-m-d'),
            'catatan' => 'Cuti tahunan biasa',
        ]);

        $this->assertDatabaseHas('cutis', [
            'karyawan_id' => $karyawan->id,
            'status' => 'diajukan',
        ]);

        $cuti = Cuti::first();

        // Approve cuti
        $response = $this->post(route('hr.cuti.approve', $cuti->id), [
            'catatan' => 'Disetujui bos',
        ]);

        $this->assertDatabaseHas('cutis', [
            'id' => $cuti->id,
            'status' => 'disetujui',
            'disetujui_oleh' => $this->user->id,
        ]);
    }

    public function test_generate_payroll_tetap()
    {
        $karyawan = Karyawan::factory()->create([
            'tipe' => 'tetap',
            'rate_gaji_pokok' => 5000000,
        ]);

        $response = $this->post(route('hr.payroll.generate'), [
            'bulan' => 8,
            'tahun' => 2026,
        ]);

        $this->assertDatabaseHas('gaji_periodes', [
            'karyawan_id' => $karyawan->id,
            'periode_bulan' => 8,
            'periode_tahun' => 2026,
        ]);

        $periode = GajiPeriode::where('karyawan_id', $karyawan->id)->first();
        $this->assertDatabaseHas('komponen_gajis', [
            'gaji_periode_id' => $periode->id,
            'jenis' => 'gaji_pokok',
            'jumlah' => 5000000,
        ]);
    }

    public function test_generate_payroll_harian()
    {
        $karyawan = Karyawan::factory()->create([
            'tipe' => 'harian',
            'rate_harian' => 100000,
        ]);

        Schema::disableForeignKeyConstraints();
        // Mock presensi
        Presensi::forceCreate([
            'id' => Str::uuid()->toString(),
            'karyawan_id' => $karyawan->id,
            'check_in' => '2026-08-01 08:00:00',
            'status_validasi' => 'valid',
        ]);
        Presensi::forceCreate([
            'id' => Str::uuid()->toString(),
            'karyawan_id' => $karyawan->id,
            'check_in' => '2026-08-02 08:00:00',
            'status_validasi' => 'valid',
        ]);
        Schema::enableForeignKeyConstraints();

        $response = $this->post(route('hr.payroll.generate'), [
            'bulan' => 8,
            'tahun' => 2026,
        ]);

        $periode = GajiPeriode::where('karyawan_id', $karyawan->id)->first();
        $this->assertEquals(2, $periode->jumlah_hadir);

        $this->assertDatabaseHas('komponen_gajis', [
            'gaji_periode_id' => $periode->id,
            'jenis' => 'gaji_pokok',
            'jumlah' => 200000, // 2 * 100000
        ]);
    }

    public function test_tambah_komponen_manual()
    {
        $periode = GajiPeriode::factory()->create();

        $response = $this->post(route('hr.payroll.add-komponen', $periode->id), [
            'jenis' => 'potongan',
            'jumlah' => 50000,
            'keterangan' => 'Kasbon',
        ]);

        $this->assertDatabaseHas('komponen_gajis', [
            'gaji_periode_id' => $periode->id,
            'jenis' => 'potongan',
            'jumlah' => 50000,
        ]);
    }

    public function test_generate_payroll_borongan_rit()
    {
        $karyawan = Karyawan::factory()->create([
            'tipe' => 'borongan_rit',
        ]);

        Schema::disableForeignKeyConstraints();
        // Mock Ritase
        Ritase::forceCreate([
            'id' => Str::uuid()->toString(),
            'armada_id' => Str::uuid()->toString(),
            'driver_karyawan_id' => $karyawan->id,
            'tanggal' => '2026-08-05',
            'status' => 'disetujui',
            'jumlah_rit' => 1,
            'tarif_per_rit_snapshot' => 150000,
        ]);

        Ritase::forceCreate([
            'id' => Str::uuid()->toString(),
            'armada_id' => Str::uuid()->toString(),
            'driver_karyawan_id' => $karyawan->id,
            'tanggal' => '2026-08-06',
            'status' => 'disetujui',
            'jumlah_rit' => 1,
            'tarif_per_rit_snapshot' => 120000,
        ]);
        Schema::enableForeignKeyConstraints();

        $response = $this->post(route('hr.payroll.generate'), [
            'bulan' => 8,
            'tahun' => 2026,
        ]);

        $periode = GajiPeriode::where('karyawan_id', $karyawan->id)->first();

        // 150.000 + 120.000 = 270.000
        $this->assertDatabaseHas('komponen_gajis', [
            'gaji_periode_id' => $periode->id,
            'jenis' => 'gaji_pokok',
            'jumlah' => 270000,
        ]);
    }

    public function test_calculate_net_salary_action()
    {
        $periode = GajiPeriode::factory()->create();

        $periode->komponen()->create([
            'jenis' => 'gaji_pokok',
            'jumlah' => 3000000,
            'keterangan' => 'Gaji Pokok',
        ]);

        $periode->komponen()->create([
            'jenis' => 'tunjangan',
            'jumlah' => 500000,
            'keterangan' => 'Tunjangan Makan',
        ]);

        $periode->komponen()->create([
            'jenis' => 'potongan',
            'jumlah' => 200000,
            'keterangan' => 'Kasbon',
        ]);

        $calc = new CalculateNetSalaryAction;
        $netto = $calc->execute($periode);

        // 3.000.000 + 500.000 - 200.000 = 3.300.000
        $this->assertEquals(3300000, $netto);
    }
}
