<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\PerpanjangDokumenBerkalaAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use App\Domain\Fleet\Models\ArmadaDokumenBerkalaRiwayat;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Notifications\ArmadaDokumenJatuhTempoNotification;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->create([
        'tipe_unit' => 'armada_jalan',
        'plat_nomor' => 'B 1234 SBPS',
    ]);

    $this->owner = User::factory()->create(['is_active' => true]);
    $this->owner->assignRole('Owner');

    // Create driver
    $this->driverUser = User::factory()->create(['is_active' => true]);
    Role::findOrCreate('Driver Armada', 'web');
    $this->driverUser->assignRole('Driver Armada');

    $karyawan = Karyawan::create([
        'user_id' => $this->driverUser->id,
        'nama' => 'Driver Dokumen Test',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);

    ArmadaDriver::create([
        'armada_id' => $this->armada->id,
        'karyawan_id' => $karyawan->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->subDay()->toDateString(),
        'status' => 'aktif',
    ]);

    $this->driverToken = $this->driverUser->createToken('mobile-test')->plainTextToken;
});

// ── TD-C3: Model Dokumen Berkala & Status Turunan ────────────────────────────

test('dokumen berkala menghitung status turunan dengan benar', function () {
    // 1. Lewat jatuh tempo
    $docLewat = ArmadaDokumenBerkala::create([
        'armada_id' => $this->armada->id,
        'jenis' => 'pajak_tahunan',
        'nomor_dokumen' => 'PKB-001',
        'tanggal_jatuh_tempo' => now()->subDays(5)->toDateString(),
    ]);
    expect($docLewat->status_dokumen)->toBe('lewat');

    // 2. Akan jatuh tempo (dalam 30 hari)
    $docAkan = ArmadaDokumenBerkala::create([
        'armada_id' => $this->armada->id,
        'jenis' => 'kir',
        'nomor_dokumen' => 'KIR-001',
        'tanggal_jatuh_tempo' => now()->addDays(10)->toDateString(),
    ]);
    expect($docAkan->status_dokumen)->toBe('akan_jatuh_tempo');

    // 3. Masih aktif lama (> 30 hari)
    $docAktif = ArmadaDokumenBerkala::create([
        'armada_id' => $this->armada->id,
        'jenis' => 'stnk_5_tahunan',
        'nomor_dokumen' => 'STNK-001',
        'tanggal_jatuh_tempo' => now()->addDays(90)->toDateString(),
    ]);
    expect($docAktif->status_dokumen)->toBe('aktif');
});

// ── TD-C4: Perpanjang Dokumen Berkala Action ─────────────────────────────────

test('perpanjang dokumen berkala menyimpan riwayat dan memperbarui timestamp armada', function () {
    $doc = ArmadaDokumenBerkala::create([
        'armada_id' => $this->armada->id,
        'jenis' => 'pajak_tahunan',
        'nomor_dokumen' => 'PKB-OLD',
        'tanggal_jatuh_tempo' => now()->addDays(2)->toDateString(),
        'nominal_biaya' => 1500000,
    ]);

    $tanggalBaru = now()->addYear()->toDateString();

    $updated = app(PerpanjangDokumenBerkalaAction::class)->execute(
        $doc,
        $this->owner,
        [
            'tanggal_jatuh_tempo_baru' => $tanggalBaru,
            'nominal_biaya' => 1650000,
            'nomor_dokumen_baru' => 'PKB-NEW',
            'catatan' => 'Perpanjang di Samsat Barat',
        ],
        UploadedFile::fake()->image('bukti_pajak.jpg')
    );

    expect($updated->tanggal_jatuh_tempo->toDateString())->toBe($tanggalBaru);
    expect($updated->nomor_dokumen)->toBe('PKB-NEW');
    expect($updated->nominal_biaya)->toBe(1650000.0);
    expect($updated->terakhir_dibayar_pada)->not->toBeNull();

    // Check Riwayat
    expect(ArmadaDokumenBerkalaRiwayat::where('dokumen_berkala_id', $doc->id)->count())->toBe(1);
    $riwayat = ArmadaDokumenBerkalaRiwayat::where('dokumen_berkala_id', $doc->id)->first();
    expect($riwayat->tanggal_jatuh_tempo_baru->toDateString())->toBe($tanggalBaru);
    expect($riwayat->diperpanjang_oleh)->toBe($this->owner->id);

    // Check Armada timestamp update (TD-C2)
    $this->armada->refresh();
    expect($this->armada->data_diperbarui_pada)->not->toBeNull();
    expect($this->armada->data_diperbarui_oleh)->toBe($this->owner->id);
});

// ── TD-C5: Reminder Scheduler Command ────────────────────────────────────────

test('artisan armada:dokumen-reminder mengirim notifikasi untuk dokumen yang jatuh tempo segera', function () {
    Notification::fake();

    Permission::findOrCreate('manage dokumen armada', 'web');
    $this->owner->givePermissionTo('manage dokumen armada');

    // Buat dokumen yang akan jatuh tempo dalam 15 hari
    ArmadaDokumenBerkala::create([
        'armada_id' => $this->armada->id,
        'jenis' => 'pajak_tahunan',
        'nomor_dokumen' => 'PKB-REMIND',
        'tanggal_jatuh_tempo' => now()->addDays(15)->toDateString(),
    ]);

    $this->artisan('armada:dokumen-reminder --days=30')
        ->assertSuccessful();

    Notification::assertSentTo(
        $this->owner,
        ArmadaDokumenJatuhTempoNotification::class
    );
});

// ── TD-C7: Mobile armada/saya mengembalikan dokumen_berkala ──────────────────

test('endpoint mobile armada/saya mengembalikan daftar dokumen berkala beserta sisa hari', function () {
    ArmadaDokumenBerkala::create([
        'armada_id' => $this->armada->id,
        'jenis' => 'pajak_tahunan',
        'nomor_dokumen' => 'PKB-MOBILE',
        'tanggal_jatuh_tempo' => now()->addDays(20)->toDateString(),
        'nominal_biaya' => 2000000,
    ]);

    $response = $this->withToken($this->driverToken)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/armada/saya');

    $response->assertOk()
        ->assertJsonPath('status', 'success');

    $items = $response->json('data.items');
    expect($items)->toBeArray();
    expect(count($items))->toBeGreaterThanOrEqual(1);

    $myUnit = collect($items)->firstWhere('id', $this->armada->id);
    expect($myUnit)->not->toBeNull();
    expect($myUnit['dokumen_berkala'])->toBeArray();
    expect(count($myUnit['dokumen_berkala']))->toBe(1);

    $doc = $myUnit['dokumen_berkala'][0];
    expect($doc['jenis'])->toBe('Pajak Tahunan');
    expect($doc['nomor'])->toBe('PKB-MOBILE');
    expect($doc['sisa_hari'])->toBe(20);
    expect($doc['status'])->toBe('akan_jatuh_tempo');
});

// ── Web Controller Routes ───────────────────────────────────────────────────

test('web route CRUD dokumen berkala berfungsi', function () {
    $this->actingAs($this->owner)
        ->post(route('fleet.armada.dokumen-berkala.store', $this->armada), [
            'jenis' => 'kir',
            'nomor_dokumen' => 'KIR-WEB',
            'tanggal_jatuh_tempo' => now()->addMonths(6)->toDateString(),
            'nominal_biaya' => 250000,
        ])
        ->assertRedirect();

    $doc = ArmadaDokumenBerkala::where('nomor_dokumen', 'KIR-WEB')->first();
    expect($doc)->not->toBeNull();

    // Update
    $this->actingAs($this->owner)
        ->put(route('fleet.armada.dokumen-berkala.update', [$this->armada, $doc]), [
            'nomor_dokumen' => 'KIR-WEB-EDITED',
            'tanggal_jatuh_tempo' => now()->addMonths(6)->toDateString(),
        ])
        ->assertRedirect();

    expect($doc->fresh()->nomor_dokumen)->toBe('KIR-WEB-EDITED');

    // Perpanjang
    $this->actingAs($this->owner)
        ->post(route('fleet.armada.dokumen-berkala.perpanjang', [$this->armada, $doc]), [
            'tanggal_jatuh_tempo_baru' => now()->addYear()->toDateString(),
            'nominal_biaya' => 300000,
        ])
        ->assertRedirect();

    expect($doc->fresh()->nominal_biaya)->toBe(300000.0);

    // Delete
    $this->actingAs($this->owner)
        ->delete(route('fleet.armada.dokumen-berkala.destroy', [$this->armada, $doc]))
        ->assertRedirect();

    expect(ArmadaDokumenBerkala::where('id', $doc->id)->exists())->toBeFalse();
});
