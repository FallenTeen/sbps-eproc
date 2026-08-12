<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Fleet\Actions\CalculateNextServiceDateAction;
use App\Domain\Fleet\Actions\EndDowntimeAction;
use App\Domain\Fleet\Actions\EstimateBBMFromJarakAction;
use App\Domain\Fleet\Actions\RecordBBMAction;
use App\Domain\Fleet\Actions\RecordChecklistHarianAction;
use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Actions\RecordSewaAlatJamAction;
use App\Domain\Fleet\Actions\RecordServiceHistoryAction;
use App\Domain\Fleet\Actions\StartDowntimeAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\Models\ServiceInterval;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\HR\Models\Karyawan;
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

    $this->unit   = UnitBisnis::factory()->gcs()->create();
    $this->proyek = Proyek::factory()->for($this->unit)->internal()->create(['created_by' => $this->user->id]);
    $this->titik  = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
    $this->driver = Karyawan::create([
        'nama'    => 'Driver Test',
        'tipe'    => 'borongan_rit',
        'jabatan' => 'Driver',
        'status'  => 'aktif',
    ]);
});

// =========================================================
// Ritase - Snapshot Tarif
// =========================================================

describe('Ritase - Pencatatan dan Snapshot Tarif', function () {
    test('record ritase menggunakan snapshot tarif dari rute', function () {
        $armada = Armada::factory()->for($this->unit)->dumpTruck()->create();
        $rute   = RuteTarif::create([
            'unit_bisnis_id' => $this->unit->id,
            'lokasi_asal'    => 'Quarry A',
            'lokasi_tujuan'  => 'Site B',
            'jarak_km'       => 20,
            'tarif_per_rit'  => 100_000,
            'berlaku_dari'   => '2026-01-01',
        ]);

        $action = new RecordRitaseAction();
        $ritase = $action->execute([
            'armada_id'          => $armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id'      => $rute->id,
            'tanggal'            => now()->toDateString(),
            'jumlah_rit'         => 8,
            'proyek_id'          => $this->proyek->id,
        ]);

        expect($ritase->tarif_per_rit_snapshot)->toEqual(100_000);
        expect($ritase->total_upah_rit)->toEqual(800_000);
        expect($ritase->rute_tarif_id)->toBe($rute->id);
    });

    test('tarif snapshot tetap meski tarif master diubah setelah ritase dibuat', function () {
        $armada = Armada::factory()->for($this->unit)->dumpTruck()->create();
        $rute   = RuteTarif::create([
            'unit_bisnis_id' => $this->unit->id,
            'lokasi_asal'    => 'X',
            'lokasi_tujuan'  => 'Y',
            'jarak_km'       => 15,
            'tarif_per_rit'  => 80_000,
            'berlaku_dari'   => '2026-01-01',
        ]);

        $action = new RecordRitaseAction();
        $ritase = $action->execute([
            'armada_id'          => $armada->id,
            'driver_karyawan_id' => $this->driver->id,
            'rute_tarif_id'      => $rute->id,
            'tanggal'            => now()->toDateString(),
            'jumlah_rit'         => 5,
        ]);

        // Ubah tarif master setelah ritase dibuat
        $rute->update(['tarif_per_rit' => 120_000]);

        // Snapshot ritase lama tidak berubah
        expect($ritase->fresh()->tarif_per_rit_snapshot)->toEqual(80_000);
        expect($ritase->fresh()->total_upah_rit)->toEqual(400_000);
    });

    test('ritase tanpa rute tarif input tarif manual', function () {
        $armada = Armada::factory()->for($this->unit)->dumpTruck()->create();

        $action = new RecordRitaseAction();
        $ritase = $action->execute([
            'armada_id'              => $armada->id,
            'driver_karyawan_id'     => $this->driver->id,
            'rute_tarif_id'          => null,
            'tanggal'                => now()->toDateString(),
            'jumlah_rit'             => 3,
            'tarif_per_rit_snapshot' => 90_000,
            'customer'               => 'PT Klien Manual',
        ]);

        expect($ritase->rute_tarif_id)->toBeNull();
        expect($ritase->tarif_per_rit_snapshot)->toEqual(90_000);
        expect($ritase->total_upah_rit)->toEqual(270_000);
    });
});

// =========================================================
// Sewa Alat Jam (HM-based)
// =========================================================

describe('Sewa Alat Jam - HM Based', function () {
    test('record sewa alat jam menghitung jam dari HM awal dan akhir', function () {
        $armada = Armada::factory()->for($this->unit)->alatBerat()->create();

        $action = new RecordSewaAlatJamAction();
        $sewa   = $action->execute([
            'armada_id'            => $armada->id,
            'penyewa_eksternal'    => 'PT Sewa Alat',
            'harga_per_jam_snapshot' => 200_000,
            'tanggal'              => now()->toDateString(),
            'hm_awal'              => 500.0,
            'hm_akhir'             => 507.5,
        ]);

        expect((float) $sewa->jumlah_jam)->toEqual(7.5);
        expect($sewa->harga_per_jam_snapshot)->toEqual(200_000);
        expect($sewa->status)->toBe('draft');
    });

    test('total nilai sewa = jumlah jam x harga per jam snapshot', function () {
        $armada = Armada::factory()->for($this->unit)->alatBerat()->create();

        $action = new RecordSewaAlatJamAction();
        $sewa   = $action->execute([
            'armada_id'              => $armada->id,
            'harga_per_jam_snapshot' => 150_000,
            'tanggal'                => now()->toDateString(),
            'jumlah_jam'             => 10,
        ]);

        // 10 jam x 150.000 = 1.500.000
        $totalSewa = $sewa->jumlah_jam * $sewa->harga_per_jam_snapshot;
        expect($totalSewa)->toEqual(1_500_000);
    });
});

// =========================================================
// Service History
// =========================================================

describe('Service History - Servis dan Reminder', function () {
    test('record servis memperbarui tanggal servis terakhir', function () {
        $armada = Armada::factory()->for($this->unit)->create();
        ServiceInterval::create([
            'serviceable_type' => Armada::class,
            'serviceable_id'   => $armada->id,
            'interval_bulan'   => 3,
        ]);

        $action = new RecordServiceHistoryAction();
        $action->execute($armada, [
            'tanggal'      => '2026-08-01',
            'jenis_servis' => 'Ganti Oli + Filter',
            'biaya'        => 800_000,
            'notes'        => 'Servis berkala 3 bulanan',
        ]);

        $armada->refresh();
        expect($armada->tanggal_servis_terakhir->toDateString())->toBe('2026-08-01');
    });

    test('calculate next service date menambah interval bulan dari tanggal servis terakhir', function () {
        $armada = Armada::factory()->for($this->unit)->create([
            'tanggal_servis_terakhir' => '2026-06-01',
        ]);
        $interval = ServiceInterval::create([
            'serviceable_type' => Armada::class,
            'serviceable_id'   => $armada->id,
            'interval_bulan'   => 3,
        ]);

        $action      = new CalculateNextServiceDateAction();
        $nextService = $action->execute($interval);

        // Servis terakhir 1 Juni + 3 bulan = 1 September
        expect($nextService->toDateString())->toBe('2026-09-01');
    });

    test('unit yang belum pernah servis menggunakan tanggal mulai pakai', function () {
        $armada = Armada::factory()->for($this->unit)->create([
            'tanggal_mulai_pakai'     => '2026-01-01',
            'tanggal_servis_terakhir' => null,
        ]);
        $interval = ServiceInterval::create([
            'serviceable_type' => Armada::class,
            'serviceable_id'   => $armada->id,
            'interval_bulan'   => 2,
        ]);

        $action      = new CalculateNextServiceDateAction();
        $nextService = $action->execute($interval);

        expect($nextService->toDateString())->toBe('2026-03-01');
    });
});

// =========================================================
// Checklist Kondisi Alat Harian
// =========================================================

describe('Checklist Kondisi Alat Harian', function () {
    test('record checklist kondisi baik tersimpan dengan benar', function () {
        $armada = Armada::factory()->for($this->unit)->create();

        $action   = new RecordChecklistHarianAction();
        $checklist = $action->execute($armada, [
            'tanggal'                 => now()->toDateString(),
            'kondisi_baik'            => true,
            'item_bermasalah'         => null,
            'dicatat_oleh_karyawan_id' => $this->driver->id,
        ]);

        expect($checklist->kondisi_baik)->toBeTrue();
        expect($checklist->item_bermasalah)->toBeNull();
    });

    test('record checklist kondisi tidak baik menyimpan item bermasalah', function () {
        $armada = Armada::factory()->for($this->unit)->create();

        $action   = new RecordChecklistHarianAction();
        $checklist = $action->execute($armada, [
            'tanggal'                 => now()->toDateString(),
            'kondisi_baik'            => false,
            'item_bermasalah'         => 'Ban belakang kiri bocor, lampu depan mati',
            'dicatat_oleh_karyawan_id' => $this->driver->id,
        ]);

        expect($checklist->kondisi_baik)->toBeFalse();
        expect($checklist->item_bermasalah)->toBe('Ban belakang kiri bocor, lampu depan mati');
    });

    test('checklist harian polymorphic bekerja untuk armada dan mesin', function () {
        $armada = Armada::factory()->for($this->unit)->create();

        ArmadaChecklistHarian::create([
            'checkable_type'           => Armada::class,
            'checkable_id'             => $armada->id,
            'tanggal'                  => now()->toDateString(),
            'kondisi_baik'             => true,
            'dicatat_oleh_karyawan_id' => $this->driver->id,
        ]);

        $cek = ArmadaChecklistHarian::where('checkable_id', $armada->id)->first();
        expect($cek)->not->toBeNull();
        expect($cek->checkable_type)->toBe(Armada::class);
    });
});

// =========================================================
// BBM Log
// =========================================================

describe('BBM Log - Pencatatan dan Estimasi', function () {
    test('record bbm menyimpan liter dan biaya', function () {
        $armada = Armada::factory()->for($this->unit)->create();

        $action = new RecordBBMAction();
        $log    = $action->execute($armada, [
            'tanggal'       => now()->toDateString(),
            'liter'         => 60,
            'biaya'         => 840_000,
            'dicatat_oleh'  => $this->user->id,
        ]);

        expect($log->liter)->toEqual(60);
        expect($log->biaya)->toEqual(840_000);
    });

    test('estimasi BBM dari jarak dan indeks solar menghitung dengan benar', function () {
        $rute = RuteTarif::create([
            'unit_bisnis_id'           => $this->unit->id,
            'lokasi_asal'              => 'A',
            'lokasi_tujuan'            => 'B',
            'jarak_km'                 => 20,
            'tarif_per_rit'            => 100_000,
            'indeks_liter_solar_per_km' => 0.4,
            'berlaku_dari'             => '2026-01-01',
        ]);

        $action   = new EstimateBBMFromJarakAction();
        $estimasi = $action->execute($rute, 5); // 5 rit

        // 5 rit x 20 km x 0.4 liter/km = 40 liter
        expect($estimasi)->toEqual(40.0);
    });
});

// =========================================================
// Downtime Log
// =========================================================

describe('Downtime Log - Mulai dan Selesai Downtime', function () {
    test('start downtime menyimpan baris tanpa selesai', function () {
        $armada = Armada::factory()->for($this->unit)->create();

        $action   = new StartDowntimeAction();
        $downtime = $action->execute($armada, [
            'penyebab'  => 'Mesin overheat',
            'kategori'  => 'kerusakan',
            'catatan'   => 'Butuh pendinginan',
        ]);

        expect($downtime)->not->toBeNull();
        expect($downtime->selesai)->toBeNull();
        expect($downtime->kategori)->toBe('kerusakan');
    });

    test('end downtime mengisi waktu selesai', function () {
        $armada   = Armada::factory()->for($this->unit)->create();
        $downtime = DowntimeLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id'   => $armada->id,
            'mulai'            => now()->subHours(3),
            'penyebab'         => 'Ganti ban',
            'kategori'         => 'kerusakan',
        ]);

        $action = new EndDowntimeAction();
        $action->execute($downtime);

        expect($downtime->fresh()->selesai)->not->toBeNull();
    });

    test('satu armada bisa memiliki beberapa riwayat downtime', function () {
        $armada = Armada::factory()->for($this->unit)->create();

        DowntimeLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id'   => $armada->id,
            'mulai'            => now()->subDays(7),
            'selesai'          => now()->subDays(6),
            'penyebab'         => 'Ganti oli',
            'kategori'         => 'kerusakan',
        ]);
        DowntimeLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id'   => $armada->id,
            'mulai'            => now()->subDays(2),
            'penyebab'         => 'Ban bocor',
            'kategori'         => 'kerusakan',
        ]);

        expect(DowntimeLog::where('serviceable_id', $armada->id)->count())->toBe(2);
    });
});
