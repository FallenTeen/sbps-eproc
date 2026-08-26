<?php

namespace Tests\Feature\Production;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\HargaBeli;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ResepProduksi;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProductionFlowTest extends TestCase
{
    use DatabaseTransactions;

    protected $user;

    protected $unitBisnis;

    protected $titik;

    protected $mesin;

    protected $produk;

    protected $resep;

    protected $bahanBaku1;

    protected $bahanBaku2;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup User & Role
        Role::firstOrCreate(['name' => 'Owner']);
        $this->user = User::factory()->create();
        $this->user->assignRole('Owner');

        // Setup Data Dasar
        $this->unitBisnis = UnitBisnis::factory()->create(['nama' => 'Batching Plant Jakarta']);
        $proyek = Proyek::factory()->create(['unit_bisnis_id' => $this->unitBisnis->id]);
        $this->titik = Titik::factory()->create(['proyek_id' => $proyek->id]);

        $this->produk = Produk::create([
            'unit_bisnis_id' => $this->unitBisnis->id,
            'nama' => 'Beton K-300',
            'kategori' => 'beton_cor',
            'satuan_output' => 'm3',
            'aktif' => true,
        ]);

        $this->mesin = MesinProduksi::create([
            'unit_bisnis_id' => $this->unitBisnis->id,
            'titik_id' => $this->titik->id,
            'nama' => 'Batching Plant 1',
            'jenis' => 'mixer_beton',
            'kapasitas' => 60,
            'status' => 'aktif',
            'biaya_per_jam' => 500000,
            'default_produk_id' => $this->produk->id,
        ]);

        $this->bahanBaku1 = BahanBaku::factory()->create(['nama' => 'Semen', 'satuan' => 'kg']);
        $this->bahanBaku2 = BahanBaku::factory()->create(['nama' => 'Pasir', 'satuan' => 'ton']);

        $supplier = Supplier::factory()->create();

        // Set harga bahan baku (assuming there's a setHarga route or just create HargaBeli directly)
        HargaBeli::create([
            'bahan_baku_id' => $this->bahanBaku1->id,
            'supplier_id' => $supplier->id,
            'harga' => 1500,
            'berlaku_dari' => now(),
            'aktif' => true,
        ]);

        HargaBeli::create([
            'bahan_baku_id' => $this->bahanBaku2->id,
            'supplier_id' => $supplier->id,
            'harga' => 200000,
            'berlaku_dari' => now(),
            'aktif' => true,
        ]);

        ResepProduksi::create([
            'produk_id' => $this->produk->id,
            'bahan_baku_id' => $this->bahanBaku1->id,
            'jumlah_per_unit_output' => 350,
        ]);

        ResepProduksi::create([
            'produk_id' => $this->produk->id,
            'bahan_baku_id' => $this->bahanBaku2->id,
            'jumlah_per_unit_output' => 0.8,
        ]);
    }

    public function test_can_view_production_dashboard()
    {
        $response = $this->actingAs($this->user)->get(route('production.dashboard'));
        $response->assertStatus(200);
    }

    public function test_can_start_production_session()
    {
        $operator = Karyawan::create([
            'nama' => 'Operator Test',
            'nik' => '123456',
            'tipe' => 'tetap',
            'status' => 'aktif',
            'jabatan' => 'Operator',
            'departemen' => 'Produksi',
        ]);

        $response = $this->actingAs($this->user)->post(route('production.sessions.store', [
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $operator->id,
            'catatan' => 'Test mulai produksi',
        ]));

        $response->assertRedirect();
        $this->assertDatabaseHas('production_sessions', [
            'mesin_id' => $this->mesin->id,
            'status' => 'berjalan',
        ]);
    }

    public function test_can_end_production_session_with_auto_cost_calculation()
    {
        $operator = Karyawan::create([
            'nama' => 'Operator Test 2',
            'nik' => '123457',
            'tipe' => 'tetap',
            'status' => 'aktif',
            'jabatan' => 'Operator',
            'departemen' => 'Produksi',
        ]);

        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $operator->id,
            'mulai' => now()->subHours(2),
            'status' => 'berjalan',
        ]);

        $response = $this->actingAs($this->user)->post(route('production.sessions.end', $session->id), [
            'hasil_output' => 10,
            'catatan' => 'Selesai produksi',
        ]);

        $response->assertRedirect();

        $session->refresh();
        $this->assertEquals('selesai', $session->status);
        $this->assertEquals(10, $session->hasil_output);
        $this->assertNotNull($session->selesai);
    }

    public function test_can_record_qc_sample()
    {
        $operator = Karyawan::create([
            'nama' => 'Operator Test 3',
            'nik' => '123458',
            'tipe' => 'tetap',
            'status' => 'aktif',
            'jabatan' => 'Operator',
            'departemen' => 'Produksi',
        ]);
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $operator->id,
            'mulai' => now()->subHours(2),
            'selesai' => now(),
            'status' => 'selesai',
            'hasil_output' => 10,
        ]);

        $response = $this->actingAs($this->user)->post(route('production.qc.store'), [
            'production_session_id' => $session->id,
            'jenis_uji' => 'uji_tekan',
            'umur_uji' => 28,
            'tanggal_ambil' => now()->format('Y-m-d'),
            'kuat_tekan_target' => 30,
            'catatan' => 'Sample test',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('qc_samples', [
            'production_session_id' => $session->id,
            'jenis_uji' => 'uji_tekan',
        ]);
    }
}
