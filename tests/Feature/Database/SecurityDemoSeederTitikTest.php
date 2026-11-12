<?php

namespace Tests\Feature\Database;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Domain\Security\Models\BukuTamu;
use App\Domain\Security\Models\SecurityChecklistRun;
use App\Models\User;
use Database\Seeders\SecurityDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Seeder SecurityDemoSeeder mengisi kolom baru titik_id pada
 * security_checklist_runs & buku_tamus (scoping F3), meniru runtime
 * SecurityController::titikAktifKaryawan.
 */
class SecurityDemoSeederTitikTest extends TestCase
{
    use RefreshDatabase;

    private function buatSecurityDenganKaryawan(): User
    {
        $user = User::factory()->create([
            'email' => 'test.security@dummy.com',
            'is_active' => true,
        ]);
        Karyawan::create([
            'user_id' => $user->id,
            'nama' => 'Sandi Petugas Security',
            'tipe' => 'tetap',
            'jabatan' => 'Security Kantor Pusat',
            'status' => 'aktif',
        ]);

        return $user;
    }

    private function buatTitik(string $nama): Titik
    {
        return Titik::factory()->create(['nama' => $nama]);
    }

    public function test_tanpa_penugasan_fallback_kantor_pusat_lalu_buat_penugasan(): void
    {
        $this->buatSecurityDenganKaryawan();
        $kantor = $this->buatTitik('Kantor Pusat');

        $this->seed(SecurityDemoSeeder::class);

        $user = User::where('email', 'test.security@dummy.com')->firstOrFail();
        $this->assertDatabaseHas('karyawan_titik_assignments', [
            'karyawan_id' => $user->karyawan->id,
            'titik_id' => $kantor->id,
            'status' => 'aktif',
        ]);

        $totalRun = SecurityChecklistRun::count();
        $this->assertGreaterThan(0, $totalRun);
        $this->assertSame(
            $totalRun,
            SecurityChecklistRun::where('titik_id', $kantor->id)->count(),
            'Semua run demo harus memakai titik fallback Kantor Pusat.'
        );

        $this->assertSame(
            1,
            BukuTamu::where('nama', '[DEMO] Budi Santoso')
                ->where('titik_id', $kantor->id)
                ->count()
        );
    }

    public function test_penugasan_aktif_yang_sudah_ada_diprioritaskan_tanpa_duplikat(): void
    {
        $user = $this->buatSecurityDenganKaryawan();
        $this->buatTitik('Kantor Pusat');
        $lain = $this->buatTitik('Titik Lain');
        KaryawanTitikAssignment::create([
            'karyawan_id' => $user->karyawan->id,
            'titik_id' => $lain->id,
            'tanggal_mulai' => now()->startOfMonth()->toDateString(),
            'tanggal_selesai' => null,
            'status' => 'aktif',
        ]);

        $this->seed(SecurityDemoSeeder::class);

        $this->assertSame(
            1,
            KaryawanTitikAssignment::where('karyawan_id', $user->karyawan->id)->count(),
            'Penugasan baru tidak boleh dibuat bila sudah ada yang aktif.'
        );

        $totalRun = SecurityChecklistRun::count();
        $this->assertGreaterThan(0, $totalRun);
        $this->assertSame(
            $totalRun,
            SecurityChecklistRun::where('titik_id', $lain->id)->count(),
            'Titik harus diambil dari penugasan aktif yang sudah ada.'
        );
        $this->assertDatabaseHas('buku_tamus', [
            'nama' => '[DEMO] Budi Santoso',
            'titik_id' => $lain->id,
        ]);
    }

    public function test_tanpa_titik_sama_sekalipun_seeder_tetap_jalan(): void
    {
        $this->buatSecurityDenganKaryawan();

        $this->seed(SecurityDemoSeeder::class);

        $this->assertGreaterThan(0, SecurityChecklistRun::count());
        $this->assertSame(
            0,
            SecurityChecklistRun::whereNotNull('titik_id')->count(),
            'Tanpa titik tersedia, titik_id harus tetap null.'
        );
        $this->assertSame(0, KaryawanTitikAssignment::count());
        $this->assertNull(
            BukuTamu::where('nama', '[DEMO] Budi Santoso')->first()?->titik_id
        );
    }
}
