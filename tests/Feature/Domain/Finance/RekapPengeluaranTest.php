<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use App\Domain\Finance\Models\RekapPublikSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function expenditureAkun(): AkunKasBank
{
    $unit = UnitBisnis::factory()->create();

    return AkunKasBank::factory()->create([
        'unit_bisnis_id' => $unit->id,
        'saldo_awal' => 1000000,
    ]);
}

beforeEach(function () {
    $this->akun = expenditureAkun();

    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->keuangan = User::factory()->create();
    $this->keuangan->assignRole('Admin Keuangan');

    $this->orangLain = User::factory()->create();
    $this->orangLain->assignRole('Kontraktor');
});

test('owner dan admin keuangan bisa membuka rekap pengeluaran', function () {
    foreach ([$this->owner, $this->keuangan] as $user) {
        $this->actingAs($user)
            ->get(route('finance.rekap-pengeluaran.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Finance/RekapPengeluaran/Index'));
    }
});

test('role lain tidak bisa membuka rekap pengeluaran', function () {
    $this->actingAs($this->orangLain)
        ->get(route('finance.rekap-pengeluaran.index'))
        ->assertForbidden();
});

test('rekap pengeluaran hanya menampilkan transaksi keluar', function () {
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
        ->get(route('finance.rekap-pengeluaran.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('summary.total_pengeluaran', 200000)
            ->has('transaksi', 1)
            ->where('transaksi.0.tipe', 'keluar'));
});

test('rekap pengeluaran tidak punya ringkasan pemasukan atau selisih', function () {
    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-pengeluaran.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('summary.total_masuk')
            ->missing('summary.selisih'));
});

test('filter kategori dan akun kas bekerja', function () {
    $akunLain = expenditureAkun();

    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'keluar',
        'kategori' => 'Operasional',
        'jumlah' => 100000,
        'tanggal' => now(),
    ]);
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $akunLain->id,
        'tipe' => 'keluar',
        'kategori' => 'Pembayaran Material',
        'jumlah' => 700000,
        'tanggal' => now(),
    ]);

    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-pengeluaran.index', ['kategori' => 'Operasional']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('summary.total_pengeluaran', 100000)
            ->has('transaksi', 1));

    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-pengeluaran.index', ['akun_kas_id' => $akunLain->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('summary.total_pengeluaran', 700000)
            ->has('transaksi', 1));
});

test('filter periode preset dan rentang kustom bekerja', function () {
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'keluar',
        'jumlah' => 100000,
        'tanggal' => now(),
    ]);
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'keluar',
        'jumlah' => 900000,
        'tanggal' => now()->subMonths(4),
    ]);

    // Preset bulan ini: hanya transaksi bulan berjalan
    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-pengeluaran.index', ['periode' => 'bulan_ini']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('summary.total_pengeluaran', 100000)
            ->has('transaksi', 1)
            ->where('filters.periode', 'bulan_ini'));

    // Rentang kustom mencakup kedua transaksi
    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-pengeluaran.index', [
            'periode' => 'kustom',
            'tanggal_mulai' => now()->subMonths(6)->toDateString(),
            'tanggal_sampai' => now()->toDateString(),
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('summary.total_pengeluaran', 1000000)
            ->has('transaksi', 2));
});

test('penyesuaian manual hanya bisa bertipe pengeluaran', function () {
    $this->actingAs($this->keuangan)
        ->post(route('finance.rekap-pengeluaran.store'), [
            'akun_kas_bank_id' => $this->akun->id,
            'kategori' => 'Operasional Kantor',
            'tipe' => 'masuk',
            'jumlah' => 150000,
            'tanggal' => now()->toDateString(),
            'catatan' => 'Bel ATK',
        ])
        ->assertRedirect(route('finance.rekap-pengeluaran.index'));

    $mutasi = MutasiKasBank::where('kategori', 'Operasional Kantor')->first();
    expect($mutasi)->not->toBeNull()
        ->and($mutasi->tipe)->toBe('keluar')
        ->and((float) $mutasi->jumlah)->toBe(150000.0)
        ->and($mutasi->referensi_type)->toBe(RekapManual::class);
});

test('hanya baris manual rekap pengeluaran yang bisa diubah dan dihapus', function () {
    $manual = RekapManual::create(['created_by' => $this->keuangan->id]);
    $mutasiManual = MutasiKasBank::create([
        'akun_kas_bank_id' => $this->akun->id,
        'kategori' => 'Penyesuaian',
        'tipe' => 'keluar',
        'jumlah' => 100000,
        'tanggal' => now(),
        'referensi_type' => RekapManual::class,
        'referensi_id' => $manual->id,
        'created_by' => $this->keuangan->id,
    ]);

    $mutasiOtomatis = MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'keluar',
        'jumlah' => 500000,
    ]);

    $this->actingAs($this->keuangan)
        ->put(route('finance.rekap-pengeluaran.update', $mutasiManual), [
            'akun_kas_bank_id' => $this->akun->id,
            'kategori' => 'Penyesuaian Edit',
            'jumlah' => 75000,
            'tanggal' => now()->toDateString(),
        ])
        ->assertRedirect();
    expect($mutasiManual->fresh()->jumlah)->toBe(75000.0)
        ->and($mutasiManual->fresh()->tipe)->toBe('keluar');

    $this->actingAs($this->keuangan)
        ->delete(route('finance.rekap-pengeluaran.destroy', $mutasiManual))
        ->assertRedirect();
    expect($mutasiManual->fresh())->toBeNull();

    $this->actingAs($this->keuangan)
        ->delete(route('finance.rekap-pengeluaran.destroy', $mutasiOtomatis))
        ->assertForbidden();
});

test('export excel rekap pengeluaran tersedia', function () {
    MutasiKasBank::factory()->create([
        'akun_kas_bank_id' => $this->akun->id,
        'tipe' => 'keluar',
        'jumlah' => 500000,
    ]);

    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-pengeluaran.export'))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

test('panel sandi publik dipindah ke halaman rekap pengeluaran (TD-D4)', function () {
    $this->actingAs($this->keuangan)
        ->put(route('finance.rekap-pengeluaran.password'), ['password' => 'rahasia123'])
        ->assertRedirect(route('finance.rekap-pengeluaran.index'));

    expect(RekapPublikSetting::current()->requires_password)->toBeTrue();

    $this->actingAs($this->keuangan)
        ->get(route('finance.rekap-pengeluaran.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('publik.requires_password', true)
            ->where('publik.revealable', true)
            ->where('publik.password', 'rahasia123'));
});

test('role lain tidak bisa mengganti password publik', function () {
    $this->actingAs($this->orangLain)
        ->put(route('finance.rekap-pengeluaran.password'), ['password' => 'coba123'])
        ->assertForbidden();

    expect(RekapPublikSetting::current()->requires_password)->toBeFalse();
});

test('halaman publik pengeluaran tidak butuh login dan hanya berisi pengeluaran', function () {
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

    $this->get(route('rekap-pengeluaran-publik.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/RekapPengeluaranPublik')
            ->where('locked', false)
            ->where('rekap.total_pengeluaran', 200000)
            ->has('rekap.transaksi', 1)
            ->missing('rekap.total_masuk')
            ->missing('rekap.selisih'));
});

test('halaman publik pengeluaran terkunci setelah password diatur', function () {
    $this->actingAs($this->owner)
        ->put(route('finance.rekap-pengeluaran.password'), ['password' => 'rahasia123'])
        ->assertRedirect();

    $this->withSession([])->get(route('rekap-pengeluaran-publik.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('locked', true));

    $this->post(route('rekap-pengeluaran-publik.unlock'), ['password' => 'salah'])
        ->assertRedirect()
        ->assertSessionHasErrors('password');
});

test('password benar membuka halaman publik dan bisa dikunci lagi', function () {
    $this->actingAs($this->owner)
        ->put(route('finance.rekap-pengeluaran.password'), ['password' => 'rahasia123'])
        ->assertRedirect();

    $this->post(route('rekap-pengeluaran-publik.unlock'), ['password' => 'rahasia123'])
        ->assertRedirect()
        ->assertSessionHas('rekap_publik_unlocked');

    $this->get(route('rekap-pengeluaran-publik.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('locked', false));

    $this->post(route('rekap-pengeluaran-publik.lock'))->assertRedirect();

    $this->get(route('rekap-pengeluaran-publik.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('locked', true));
});

test('password legacy berformat hash tetap bisa membuka gate publik', function () {
    RekapPublikSetting::create([
        'password' => Hash::make('rahasia123'),
        'updated_by' => $this->owner->id,
    ]);

    $this->post(route('rekap-pengeluaran-publik.unlock'), ['password' => 'rahasia123'])
        ->assertRedirect()
        ->assertSessionHas('rekap_publik_unlocked');
});

test('export publik ditolak saat masih terkunci', function () {
    $this->actingAs($this->owner)
        ->put(route('finance.rekap-pengeluaran.password'), ['password' => 'rahasia123'])
        ->assertRedirect();

    $this->get(route('rekap-pengeluaran-publik.export'))->assertForbidden();
});

test('url lama rekap publik dialihkan 301 ke halaman baru (TD-D3)', function () {
    $response = $this->get('/rekap-publik');

    $response->assertStatus(301)
        ->assertRedirect(route('rekap-pengeluaran-publik.index'));
});
