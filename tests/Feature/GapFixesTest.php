<?php

use App\Domain\Core\Actions\SetRABAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Pengiriman;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Role::findOrCreate('Owner');
    Role::findOrCreate('Admin Keuangan');
    Role::findOrCreate('Koordinator Procurement');

    $this->user = User::factory()->create();
    $this->user->assignRole('Owner');
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->proyek = Proyek::factory()
        ->for($this->unit)
        ->internal()
        ->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
});

// =========================================================
// Gap 1: SetRABAction (sebelumnya stub kosong)
// =========================================================

describe('SetRABAction', function () {
    test('membuat baris RAB baru', function () {
        $rab = (new SetRABAction)->execute([
            'proyek_id' => $this->proyek->id,
            'kategori' => 'bahan_baku',
            'rencana' => 5_000_000,
            'catatan' => 'Semen & pasir',
        ]);

        expect($rab)->toBeInstanceOf(Rab::class)
            ->and($rab->proyek_id)->toBe($this->proyek->id)
            ->and($rab->kategori)->toBe('bahan_baku')
            ->and((float) $rab->rencana)->toBe(5_000_000.0)
            ->and($rab->titik_id)->toBeNull()
            ->and($rab->created_by)->toBe($this->user->id);
    });

    test('aktivitas pertama kali direkam, realisasi tidak disimpan', function () {
        $rab = (new SetRABAction)->execute([
            'proyek_id' => $this->proyek->id,
            'kategori' => 'sdm_tetap',
            'rencana' => 10_000_000,
        ]);

        expect($rab->getAttributes())->not->toHaveKey('realisasi');
    });

    test('memperbarui baris yang sama (upsert per proyek-titik-kategori)', function () {
        $action = new SetRABAction;

        $action->execute([
            'proyek_id' => $this->proyek->id,
            'kategori' => 'bahan_baku',
            'rencana' => 1_000_000,
        ]);
        $updated = $action->execute([
            'proyek_id' => $this->proyek->id,
            'kategori' => 'bahan_baku',
            'rencana' => 2_000_000,
            'catatan' => 'revisi',
        ]);

        expect(Rab::where('proyek_id', $this->proyek->id)->where('kategori', 'bahan_baku')->count())->toBe(1)
            ->and((float) $updated->rencana)->toBe(2_000_000.0)
            ->and($updated->catatan)->toBe('revisi');
    });

    test('RAB level proyek dan level titik bisa berdampingan', function () {
        $action = new SetRABAction;

        $action->execute(['proyek_id' => $this->proyek->id, 'kategori' => 'bahan_baku', 'rencana' => 1_000_000]);
        $titik = $action->execute([
            'proyek_id' => $this->proyek->id,
            'titik_id' => $this->titik->id,
            'kategori' => 'bahan_baku',
            'rencana' => 2_000_000,
        ]);

        expect(Rab::where('kategori', 'bahan_baku')->count())->toBe(2)
            ->and($titik->titik_id)->toBe($this->titik->id);
    });

    test('menolak titik yang bukan bagian dari proyek', function () {
        $proyekLain = Proyek::factory()->for($this->unit)->internal()->create(['created_by' => $this->user->id]);
        $titikLain = Titik::factory()->create(['proyek_id' => $proyekLain->id]);

        (new SetRABAction)->execute([
            'proyek_id' => $this->proyek->id,
            'titik_id' => $titikLain->id,
            'kategori' => 'bahan_baku',
            'rencana' => 1_000_000,
        ]);
    })->throws(ValidationException::class, 'Titik bukan bagian dari proyek tersebut.');

    test('menolak kategori tidak valid', function () {
        (new SetRABAction)->execute([
            'proyek_id' => $this->proyek->id,
            'kategori' => 'bukan_kategori',
            'rencana' => 1_000_000,
        ]);
    })->throws(ValidationException::class, 'Kategori RAB tidak valid.');

    test('menolak proyek tidak ditemukan', function () {
        (new SetRABAction)->execute([
            'proyek_id' => '00000000-0000-0000-0000-000000000000',
            'kategori' => 'bahan_baku',
            'rencana' => 1_000_000,
        ]);
    })->throws(ValidationException::class, 'Proyek tidak ditemukan.');
});

// =========================================================
// Gap 2: SupplierController@show (sebelumnya missing → 500)
// =========================================================

describe('Supplier show page', function () {
    test('halaman detail supplier dapat diakses procurement', function () {
        $proc = User::factory()->create();
        $proc->assignRole('Koordinator Procurement');

        $supplier = Supplier::factory()->create();

        $this->actingAs($proc)
            ->get(route('procurement.supplier.show', $supplier))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Procurement/Suppliers/Show')
                ->where('supplier.nama', $supplier->nama));
    });
});

// =========================================================
// Gap 3: AkunKasBankController@show & @destroy (sebelumnya missing)
// =========================================================

describe('AkunKasBank show & destroy', function () {
    beforeEach(function () {
        $this->adminKeuangan = User::factory()->create();
        $this->adminKeuangan->assignRole('Admin Keuangan');
    });

    test('halaman detail akun kas dapat diakses', function () {
        $akun = AkunKasBank::factory()->create([
            'unit_bisnis_id' => $this->unit->id,
            'saldo_awal' => 1_000_000,
        ]);

        MutasiKasBank::create([
            'akun_kas_bank_id' => $akun->id,
            'kategori' => 'pembayaran_kontraktor',
            'tipe' => 'masuk',
            'jumlah' => 500_000,
            'tanggal' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);
        MutasiKasBank::create([
            'akun_kas_bank_id' => $akun->id,
            'kategori' => 'pengeluaran',
            'tipe' => 'keluar',
            'jumlah' => 200_000,
            'tanggal' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $this->actingAs($this->adminKeuangan)
            ->get(route('finance.akun-kas.show', $akun))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Finance/AkunKas/Show')
                ->where('summary.total_masuk', 500000)
                ->where('summary.total_keluar', 200000)
                ->where('summary.saldo_saat_ini', 1300000));
    });

    test('akun kas tanpa riwayat mutasi dapat dihapus', function () {
        $akun = AkunKasBank::factory()->create(['unit_bisnis_id' => $this->unit->id]);

        $this->actingAs($this->adminKeuangan)
            ->delete(route('finance.akun-kas.destroy', $akun))
            ->assertRedirect(route('finance.akun-kas.index'));

        expect(AkunKasBank::find($akun->id))->toBeNull();
    });

    test('akun kas dengan riwayat mutasi tidak dapat dihapus', function () {
        $akun = AkunKasBank::factory()->create(['unit_bisnis_id' => $this->unit->id]);
        MutasiKasBank::create([
            'akun_kas_bank_id' => $akun->id,
            'kategori' => 'pengeluaran',
            'tipe' => 'masuk',
            'jumlah' => 100_000,
            'tanggal' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $this->actingAs($this->adminKeuangan)
            ->delete(route('finance.akun-kas.destroy', $akun))
            ->assertRedirect();

        expect(AkunKasBank::find($akun->id))->not->toBeNull();
    });
});

// =========================================================
// Gap 4: PengirimanController@edit & @update (sebelumnya missing)
// =========================================================

describe('Pengiriman edit & update', function () {
    beforeEach(function () {
        $produk = Produk::factory()->create([
            'unit_bisnis_id' => $this->unit->id,
            'nama' => 'FC20',
            'kategori' => 'BETON_COR',
            'satuan_output' => 'm3',
        ]);
        $mesin = MesinProduksi::create([
            'unit_bisnis_id' => $this->unit->id,
            'nama' => 'Molen 1',
            'jenis' => 'mixer_beton',
            'status' => 'aktif',
        ]);
        $operator = Karyawan::factory()->create(['tipe' => 'tetap']);
        $session = ProductionSession::create([
            'mesin_id' => $mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $produk->id,
            'operator_karyawan_id' => $operator->id,
            'mulai' => now()->subHour(),
            'selesai' => now(),
            'hasil_output' => 10,
            'status' => 'selesai',
        ]);

        $this->pengiriman = Pengiriman::create([
            'production_session_id' => $session->id,
            'tujuan_alamat' => 'Proyek Gedung A',
            'waktu_muat' => now()->addHour(),
            'status' => 'dijadwalkan',
        ]);
    });

    test('halaman edit hanya untuk pengiriman dijadwalkan', function () {
        $this->get(route('production.pengiriman.edit', $this->pengiriman))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Production/Pengiriman/Edit'));
    });

    test('pengiriman berstatus dijadwalkan bisa diubah', function () {
        $this->put(route('production.pengiriman.update', $this->pengiriman), [
            'armada_id' => null,
            'driver_karyawan_id' => null,
            'tujuan_alamat' => 'Proyek Gedung B',
            'waktu_muat' => now()->addHours(2),
            'catatan' => 'revisi rute',
        ])->assertRedirect(route('production.pengiriman.show', $this->pengiriman));

        expect($this->pengiriman->fresh()->tujuan_alamat)->toBe('Proyek Gedung B');
    });

    test('pengiriman yang sudah jalan/selesai tidak bisa diubah', function () {
        $this->pengiriman->update(['status' => 'dalam_perjalanan']);
        $this->pengiriman->fresh();

        $this->get(route('production.pengiriman.edit', $this->pengiriman))->assertRedirect();
        $this->put(route('production.pengiriman.update', $this->pengiriman), [
            'tujuan_alamat' => 'Tidak boleh',
            'waktu_muat' => now(),
        ])->assertRedirect();

        expect($this->pengiriman->fresh()->tujuan_alamat)->not->toBe('Tidak boleh');
    });
});
