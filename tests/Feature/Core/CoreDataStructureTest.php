<?php

use App\Domain\Core\Actions\CompareRABRealisasiAction;
use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\HargaBeli;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->proyek = Proyek::factory()
        ->for($this->unit)
        ->internal()
        ->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
});

// =========================================================
// Unit Bisnis
// =========================================================

describe('Unit Bisnis', function () {
    test('dapat membuat tiga unit bisnis dengan kode berbeda', function () {
        // Pakai unit dari beforeEach, tambah CBP dan AMP saja
        $cbp = UnitBisnis::factory()->cbp()->create();
        $amp = UnitBisnis::factory()->amp()->create();

        expect($this->unit->kode)->toBe('GCS'); // dari beforeEach
        expect($cbp->kode)->toBe('CBP');
        expect($amp->kode)->toBe('AMP');
    });

    test('unit bisnis memiliki relasi hasmany proyek', function () {
        Proyek::factory()->for($this->unit)->create(['created_by' => $this->user->id]);

        // $this->proyek dari beforeEach + 1 baru = 2
        expect($this->unit->proyeks()->count())->toBe(2);
    });
});

// =========================================================
// Proyek & Titik
// =========================================================

describe('Proyek dan Titik', function () {
    test('proyek internal tidak wajib mengisi client', function () {
        $proyek = Proyek::factory()->for($this->unit)->internal()->create([
            'created_by' => $this->user->id,
        ]);

        expect($proyek->tipe_proyek)->toBe('internal');
        expect($proyek->client)->toBeNull();
    });

    test('proyek kontrak klien wajib memiliki nama klien', function () {
        $proyek = Proyek::factory()->for($this->unit)->kontrakKlien()->create([
            'created_by' => $this->user->id,
            'client' => 'PT Maju Jaya',
        ]);

        expect($proyek->tipe_proyek)->toBe('kontrak_klien');
        expect($proyek->client)->toBe('PT Maju Jaya');
    });

    test('titik menyimpan koordinat dan radius presensi', function () {
        $titik = Titik::factory()->create([
            'proyek_id' => $this->proyek->id,
            'latitude' => -7.2504,
            'longitude' => 109.3184,
            'radius_presensi_meter' => 150,
        ]);

        expect((float) $titik->latitude)->toBe(-7.2504);
        expect($titik->radius_presensi_meter)->toBe(150);
    });

    test('proyek memiliki banyak titik', function () {
        Titik::factory()->count(3)->create(['proyek_id' => $this->proyek->id]);

        // setUp sudah buat 1, tambah 3 = 4 (relasi bernama titik() bukan titiks())
        expect($this->proyek->titik()->count())->toBe(4);
    });
});

// =========================================================
// RAB
// =========================================================

describe('RAB - Rencana Anggaran Biaya', function () {
    test('rab dibuat per kategori berbeda di level proyek', function () {
        $rabBB = Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 5_000_000]);
        $rabSDM = Rab::factory()->for($this->proyek)->create([
            'kategori' => 'sdm_tetap',
            'rencana' => 10_000_000,
        ]);

        expect($rabBB->kategori)->toBe('bahan_baku');
        expect($rabSDM->kategori)->toBe('sdm_tetap');
    });

    test('rab bisa di-scope ke titik spesifik (titik_id nullable)', function () {
        $rabProyek = Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 3_000_000]);
        $rabTitik = Rab::factory()->for($this->proyek)->bahanBaku()->create([
            'titik_id' => $this->titik->id,
            'rencana' => 1_500_000,
        ]);

        expect($rabProyek->titik_id)->toBeNull();
        expect($rabTitik->titik_id)->toBe($this->titik->id);
    });
});

// =========================================================
// GetRABRealisasiAction - On-the-Fly
// =========================================================

describe('GetRABRealisasiAction - Realisasi Dihitung On-the-Fly', function () {
    test('realisasi RAB bahan_baku dari PO yang sudah diterima', function () {
        $rab = Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 5_000_000]);
        $bb = BahanBaku::factory()->bahanBaku()->create();
        $sup = Supplier::factory()->create();

        HargaBeli::create([
            'bahan_baku_id' => $bb->id,
            'supplier_id' => $sup->id,
            'harga' => 10_000,
            'berlaku_dari' => now()->subDay(),
            'aktif' => true,
        ]);

        // Status 'diterima' = PO sudah received (barang masuk gudang)
        $po = PurchaseOrder::factory()->for($this->proyek)->diterima()->create([
            'titik_id' => $this->titik->id,
        ]);
        $po->items()->create([
            'bahan_baku_id' => $bb->id,
            'jumlah' => 100,
            'harga_satuan_snapshot' => 10_000,
            'subtotal' => 1_000_000,
        ]);

        $realisasi = (new GetRABRealisasiAction)->execute($rab);

        expect($realisasi)->toEqual(1_000_000);
    });

    test('realisasi RAB adalah 0 ketika belum ada transaksi', function () {
        $rab = Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 3_000_000]);

        $realisasi = (new GetRABRealisasiAction)->execute($rab);

        expect($realisasi)->toEqual(0);
    });

    test('model rab tidak menyimpan kolom realisasi statis', function () {
        $rab = Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 5_000_000]);

        // Prinsip: realisasi TIDAK pernah disimpan di kolom DB
        expect($rab->getAttributes())->not->toHaveKey('realisasi');
    });

    test('PO berstatus draft tidak masuk realisasi RAB', function () {
        $rab = Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 5_000_000]);
        $bb = BahanBaku::factory()->bahanBaku()->create();

        // Draft = belum committed ke workflow
        $po = PurchaseOrder::factory()->for($this->proyek)->draft()->create([
            'titik_id' => $this->titik->id,
        ]);
        $po->items()->create([
            'bahan_baku_id' => $bb->id,
            'jumlah' => 50,
            'harga_satuan_snapshot' => 10_000,
            'subtotal' => 500_000,
        ]);

        // Draft belum masuk hitungan realisasi RAB
        $realisasi = (new GetRABRealisasiAction)->execute($rab);
        expect($realisasi)->toEqual(0);
    });

    test('CompareRABRealisasiAction mengembalikan struktur rencana realisasi selisih persen', function () {
        $rab = Rab::factory()->for($this->proyek)->bahanBaku()->create(['rencana' => 5_000_000]);

        $result = (new CompareRABRealisasiAction)->execute($rab);

        // Action mengembalikan key 'persentase' (bukan 'persen_serap')
        expect($result)->toHaveKey('rencana');
        expect($result)->toHaveKey('realisasi');
        expect($result)->toHaveKey('selisih');
        expect($result)->toHaveKey('persentase');
        expect($result['rencana'])->toEqual(5_000_000);
        expect($result['realisasi'])->toEqual(0);
        expect($result['selisih'])->toEqual(5_000_000);
        expect($result['persentase'])->toEqual(0.0);
    });
});
