<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordSewaAlatJamAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Permission::findOrCreate('manage fleet');
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('manage fleet');
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->proyek = Proyek::factory()->for($this->unit)->internal()->create(['created_by' => $this->user->id]);
    $this->armada = Armada::factory()->for($this->unit)->alatBerat()->create();
});

// =========================================================
// Fase A4 — sewa alat jam: internal & eksternal
// =========================================================

describe('Fase A4 - Sewa Internal', function () {
    test('sewa internal wajib memilih proyek (422)', function () {
        expect(fn () => (new RecordSewaAlatJamAction)->execute([
            'armada_id' => $this->armada->id,
            'tipe_sewa' => 'internal',
            'hm_awal' => 100,
            'hm_akhir' => 108,
            'jumlah_jam' => 8,
            'harga_per_jam_snapshot' => 250_000,
            'tanggal' => now()->toDateString(),
        ]))->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    });

    test('sewa internal dengan proyek tersimpan, tipe_sewa = internal', function () {
        $sewa = (new RecordSewaAlatJamAction)->execute([
            'armada_id' => $this->armada->id,
            'tipe_sewa' => 'internal',
            'proyek_id' => $this->proyek->id,
            'hm_awal' => 100,
            'hm_akhir' => 108,
            'jumlah_jam' => 8,
            'harga_per_jam_snapshot' => 250_000,
            'tanggal' => now()->toDateString(),
        ]);

        expect($sewa->tipe_sewa)->toBe('internal');
        expect($sewa->proyek_id)->toBe($this->proyek->id);
        expect($sewa->jumlah_jam)->toBe(8.0);
        expect($sewa->penyewa_nama)->toBeNull();
    });

    test('jumlah jam dihitung otomatis dari selisih HM awal-akhir', function () {
        $sewa = (new RecordSewaAlatJamAction)->execute([
            'armada_id' => $this->armada->id,
            'tipe_sewa' => 'internal',
            'proyek_id' => $this->proyek->id,
            'hm_awal' => 105,
            'hm_akhir' => 115.5,
            'harga_per_jam_snapshot' => 200_000,
        ]);

        expect($sewa->jumlah_jam)->toBe(10.5);
    });
});

describe('Fase A4 - Sewa Eksternal', function () {
    test('sewa eksternal wajib mengisi nama penyewa (422)', function () {
        expect(fn () => (new RecordSewaAlatJamAction)->execute([
            'armada_id' => $this->armada->id,
            'tipe_sewa' => 'eksternal',
            'proyek_id' => $this->proyek->id,
            'hm_awal' => 10,
            'hm_akhir' => 14,
            'jumlah_jam' => 4,
            'harga_per_jam_snapshot' => 300_000,
        ]))->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    });

    test('sewa eksternal menyimpan data penyewa dan mengosongkan proyek', function () {
        $sewa = (new RecordSewaAlatJamAction)->execute([
            'armada_id' => $this->armada->id,
            'tipe_sewa' => 'eksternal',
            'proyek_id' => $this->proyek->id, // sengaja dikirim tapi harus dinull-kan
            'penyewa_eksternal' => 'PT Mitra Beton',
            'penyewa_nama' => 'Budi Santoso',
            'penyewa_pt' => 'PT Mitra Beton',
            'penyewa_alamat' => 'Jl. Raya Industri 1',
            'penyewa_penanggung_jawab' => 'Andi',
            'penyewa_no_hp' => '081234567890',
            'hm_awal' => 50,
            'hm_akhir' => 58,
            'jumlah_jam' => 8,
            'harga_per_jam_snapshot' => 300_000,
            'tanggal' => now()->toDateString(),
        ]);

        expect($sewa->tipe_sewa)->toBe('eksternal');
        expect($sewa->proyek_id)->toBeNull();
        expect($sewa->penyewa_nama)->toBe('Budi Santoso');
        expect($sewa->penyewa_pt)->toBe('PT Mitra Beton');
        expect($sewa->penyewa_penanggung_jawab)->toBe('Andi');
        expect($sewa->penyewa_no_hp)->toBe('081234567890');
        expect($sewa->jumlah_jam)->toBe(8.0);
    });

    test('default tipe_sewa internal jika tidak dikirim', function () {
        $sewa = (new RecordSewaAlatJamAction)->execute([
            'armada_id' => $this->armada->id,
            'proyek_id' => $this->proyek->id,
            'hm_awal' => 5,
            'hm_akhir' => 9,
            'jumlah_jam' => 4,
            'harga_per_jam_snapshot' => 200_000,
        ]);

        expect($sewa->tipe_sewa)->toBe('internal');
    });
});

describe('Fase A4 - HTTP Controller', function () {
    test('store sewa eksternal via HTTP dengan data penyewa', function () {
        $this->post(route('fleet.sewa-alat.store'), [
            'armada_id' => $this->armada->id,
            'tipe_sewa' => 'eksternal',
            'nama_pelanggan' => 'PT Mitra Jaya',
            'penyewa_pt' => 'PT Mitra Jaya',
            'penyewa_penanggung_jawab' => 'Sari',
            'tanggal_mulai' => now()->toDateString(),
            'hm_awal' => 100,
            'hm_akhir' => 106,
            'tarif_per_jam' => 250_000,
        ])->assertRedirect();

        expect(SewaAlatJam::count())->toBe(1);
        expect(SewaAlatJam::first()->tipe_sewa)->toBe('eksternal');
        expect(SewaAlatJam::first()->penyewa_nama)->toBe('PT Mitra Jaya');
        expect(SewaAlatJam::first()->proyek_id)->toBeNull();
    });

    test('store sewa internal via HTTP membutuhkan proyek', function () {
        $this->post(route('fleet.sewa-alat.store'), [
            'armada_id' => $this->armada->id,
            'tipe_sewa' => 'internal',
            'nama_pelanggan' => 'Testing',
            'tanggal_mulai' => now()->toDateString(),
            'hm_awal' => 1,
            'tarif_per_jam' => 100_000,
        ])->assertSessionHasErrors('proyek_id');
    });
});