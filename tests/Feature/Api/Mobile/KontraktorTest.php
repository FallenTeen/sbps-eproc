<?php

use App\Domain\Core\Models\KomunikasiLog;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\InvoiceItem;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    [$this->kontraktor, $this->token] = createMobileUserWithToken('Kontraktor');
    [$this->owner] = createMobileUserWithToken('Owner');

    $this->unit = UnitBisnis::factory()->create();

    $this->proyekKontrak = Proyek::factory()->for($this->unit)->kontrakKlien()->create([
        'created_by' => $this->owner->id,
        'client' => 'PT Jalan Tol Test',
    ]);
    $this->proyekInternal = Proyek::factory()->for($this->unit)->internal()->create([
        'created_by' => $this->owner->id,
    ]);

    // Object-level scoping: user kontraktor HANYA melihat proyek yang
    // ditautkan di pivot proyek_user. Proyek kontrak_klien lain tetap
    // ada di DB tetapi TIDAK boleh terlihat/diakses olehnya.
    $this->proyekKontrak->users()->sync([$this->kontraktor->id]);
    $this->proyekKontraklain = Proyek::factory()->for($this->unit)->kontrakKlien()->create([
        'created_by' => $this->owner->id,
        'client' => 'PT Rahasia Lain',
    ]);

    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyekKontrak->id]);

    $produk = Produk::factory()->split()->create();
    $mesin = MesinProduksi::create([
        'unit_bisnis_id' => $this->unit->id,
        'nama' => 'Mesin AMP Kontrak',
        'jenis' => 'mixer_aspal',
        'kapasitas' => 50,
        'status' => 'aktif',
        'titik_id' => $this->titik->id,
        'produk_id' => $produk->id,
        'biaya_per_jam' => 500000,
    ]);

    ProductionSession::create([
        'mesin_id' => $mesin->id,
        'titik_id' => $this->titik->id,
        'produk_id' => $produk->id,
        'operator_karyawan_id' => Karyawan::factory()->create()->id,
        'mulai' => now()->subDay(),
        'selesai' => now()->subDay()->addHours(6),
        'hasil_output' => 20,
        'status' => 'selesai',
    ]);

    $this->invoice = Invoice::create([
        'unit_bisnis_id' => $this->unit->id,
        'proyek_id' => $this->proyekKontrak->id,
        'kode_invoice' => 'INV-KTR-001',
        'tanggal_terbit' => now()->subDays(3),
        'tanggal_jatuh_tempo' => now()->addDays(27),
        'termin_pembayaran_hari' => 30,
        'status' => 'terkirim',
        'created_by' => $this->owner->id,
    ]);
    InvoiceItem::create([
        'invoice_id' => $this->invoice->id,
        'deskripsi' => 'Produksi Split',
        'referensi_type' => 'manual',
        'referensi_id' => (string) Str::uuid(),
        'jumlah' => 20,
        'harga_satuan' => 150000,
        'subtotal' => 3000000,
    ]);

    KomunikasiLog::create([
        'proyek_id' => $this->proyekKontrak->id,
        'user_id' => $this->kontraktor->id,
        'pengirim_role' => 'kontraktor',
        'pesan' => 'Permintaan update progress',
    ]);
});

test('proyek list hanya menampilkan proyek miliknya (pivot proyek_user)', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/kontraktor/proyek')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $this->proyekKontrak->id);
});

test('proyek list TIDAK membocorkan proyek kontrak klien milik kontraktor lain', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/kontraktor/proyek')
        ->assertOk()
        ->assertDontSee('PT Rahasia Lain');
});

test('proyek detail mengembalikan ringkasan produksi, RAB, invoice, komunikasi', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson("/api/mobile/kontraktor/proyek/{$this->proyekKontrak->id}")
        ->assertOk()
        ->assertJsonStructure(['data' => [
            'proyek',
            'produksi_summary',
            'rab_agregat' => ['total_rencana', 'total_realisasi', 'persentase'],
            'invoices',
            'komunikasi_logs',
        ]])
        ->assertJsonPath('data.produksi_summary.0.total_output', 20)
        ->assertJsonPath('data.invoices.0.kode_invoice', 'INV-KTR-001')
        ->assertJsonCount(1, 'data.komunikasi_logs');
});

test('proyek detail menolak proyek internal', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson("/api/mobile/kontraktor/proyek/{$this->proyekInternal->id}")
        ->assertStatus(403);
});

test('proyek detail menolak proyek kontrak klien yang TIDAK ditautkan ke user', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson("/api/mobile/kontraktor/proyek/{$this->proyekKontraklain->id}")
        ->assertStatus(403);
});

test('invoice list mengembalikan invoice proyek kontrak', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->getJson('/api/mobile/kontraktor/invoice')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.total', 3000000)
        ->assertJsonPath('data.0.sisa', 3000000);
});

test('sendMessage mencatat komunikasi log', function () {
    $response = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/kontraktor/komunikasi', [
            'proyek_id' => $this->proyekKontrak->id,
            'pesan' => 'Progress sudah 70%',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.pesan', 'Progress sudah 70%');

    $this->assertDatabaseHas('komunikasi_logs', [
        'proyek_id' => $this->proyekKontrak->id,
        'user_id' => $this->kontraktor->id,
        'pesan' => 'Progress sudah 70%',
    ]);
});

test('sendMessage menolak proyek internal', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/kontraktor/komunikasi', [
            'proyek_id' => $this->proyekInternal->id,
            'pesan' => 'Halo',
        ])
        ->assertStatus(403);
});
