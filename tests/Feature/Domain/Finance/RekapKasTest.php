<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function rekapAkun(): AkunKasBank
{
    $unit = UnitBisnis::factory()->create();

    return AkunKasBank::factory()->create([
        'unit_bisnis_id' => $unit->id,
        'saldo_awal' => 1000000,
    ]);
}

beforeEach(function () {
    $this->akun = rekapAkun();

    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->keuangan = User::factory()->create();
    $this->keuangan->assignRole('Admin Keuangan');

    $this->orangLain = User::factory()->create();
    $this->orangLain->assignRole('Kontraktor');
});

test('owner dan admin keuangan bisa melihat rekap', function () {
    foreach ([$this->owner, $this->keuangan] as $user) {
        $this->actingAs($user)
            ->get(route('finance.rekap-kas.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Finance/RekapKas/Index'));
    }
});

test('role lain tidak bisa melihat rekap', function () {
    $this->actingAs($this->orangLain)
        ->get(route('finance.rekap-kas.index'))
        ->assertForbidden();
});

test('rekap menampilkan mutasi masuk dan keluar dari buku kas', function () {
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'masuk',
        'jumlah' => 500000,
        'tanggal' => now(),
    ]);
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'keluar',
        'jumlah' => 200000,
        'tanggal' => now(),
    ]);

    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-kas.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('summary.total_masuk', 500000)
            ->where('summary.total_keluar', 200000)
            ->where('summary.selisih', 300000)
            ->has('transaksi', 2));
});

test('store rekap manual menulis ke mutasi_kas_banks dengan referensi rekap', function () {
    $data = [
        'akun_kas_bank_id' => $this->akun->id,
        'kategori' => 'Operasional Kantor',
        'tipe' => 'keluar',
        'jumlah' => 150000,
        'tanggal' => now()->toDateString(),
        'catatan' => 'Bel ATK',
    ];

    $this->actingAs($this->keuangan)
        ->post(route('finance.rekap-kas.store'), $data)
        ->assertRedirect();

    $mutasi = MutasiKasBank::where('kategori', 'Operasional Kantor')->first();
    expect($mutasi)->not->toBeNull()
        ->and((float) $mutasi->jumlah)->toBe(150000.0)
        ->and($mutasi->referensi_type)->toBe(RekapManual::class);
});

test(' hanya baris manual yang bisa diubah dan dihapus', function () {
    $manual = RekapManual::create(['created_by' => $this->keuangan->id]);
    $mutasiManual = MutasiKasBank::create([
        'akun_kas_bank_id' => $this->akun->id,
        'kategori' => 'Penyesuaian',
        'tipe' => 'masuk',
        'jumlah' => 100000,
        'tanggal' => now(),
        'referensi_type' => RekapManual::class,
        'referensi_id' => $manual->id,
        'created_by' => $this->keuangan->id,
    ]);

    $mutasiOtomatis = MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'masuk',
        'jumlah' => 500000,
    ]);

    // Edit baris manual OK
    $this->actingAs($this->keuangan)
        ->put(route('finance.rekap-kas.update', $mutasiManual), [
            'akun_kas_bank_id' => $this->akun->id,
            'kategori' => 'Penyesuaian Edit',
            'tipe' => 'keluar',
            'jumlah' => 75000,
            'tanggal' => now()->toDateString(),
        ])
        ->assertRedirect();
    expect($mutasiManual->fresh()->jumlah)->toBe(75000.0);

    // Hapus baris manual OK
    $this->actingAs($this->keuangan)
        ->delete(route('finance.rekap-kas.destroy', $mutasiManual))
        ->assertRedirect();
    expect($mutasiManual->fresh())->toBeNull()
        ->and(RekapManual::find($manual->id))->toBeNull();

    // Baris otomatis TIDAK boleh dihapus
    $this->actingAs($this->keuangan)
        ->delete(route('finance.rekap-kas.destroy', $mutasiOtomatis))
        ->assertForbidden();
});

test('export excel berisi rekap', function () {
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'masuk',
        'jumlah' => 500000,
    ]);

    $response = $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-kas.export'));

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

test('rekap kas bersifat internal murni (TD-D5): tanpa panel sandi & tanpa rute publik', function () {
    // Halaman rekap kas tidak lagi mengirim props panel sandi publik
    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-kas.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Finance/RekapKas/Index')
            ->missing('publik'));

    // Rute ganti password sudah pindah ke Rekap Pengeluaran
    $this->actingAs($this->keuangan)
        ->put(route('finance.rekap-pengeluaran.password'), ['password' => 'rahasia123'])
        ->assertRedirect(route('finance.rekap-pengeluaran.index'));

    // Rute lama /rekap-publik tidak ada lagi (dialihkan 301)
    $this->get('/rekap-publik')->assertStatus(301);
});
