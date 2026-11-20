<?php

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordChecklistAkhirAction;
use App\Domain\Fleet\Actions\RecordChecklistAwalAction;
use App\Domain\Fleet\Actions\RecordPengisianSolarAction;
use App\Domain\Fleet\Enums\StokSolar;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPengisianSolar;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Services\ChecklistLockService;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Validation\ValidationException;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->driver = Karyawan::create([
        'nama' => 'Driver Test',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);
    $this->armada = Armada::factory()->for($this->unit)->create(['tipe_unit' => 'armada_jalan']);
});

test('checklist awal menurunkan kondisi buruk dari items', function () {
    $awal = (new RecordChecklistAwalAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'items' => [
            ['bagian' => 'Ban', 'kondisi' => 'baik'],
            ['bagian' => 'Rem', 'kondisi' => 'rusak', 'catatan' => 'bocor'],
        ],
        'stok_solar' => StokSolar::Setengah->value,
        'odo_pagi' => 1000,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]);

    expect($awal->kondisi_baik)->toBeFalse();
    expect($awal->item_bermasalah)->toContain('Rem');
    expect($awal->stok_solar)->toBe(StokSolar::Setengah);
});

test('checklist akhir final, menolak submit kedua, dan idempotent', function () {
    (new RecordChecklistAwalAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_pagi' => 1000,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]);

    $akhir = (new RecordChecklistAkhirAction)->execute($this->armada, [
        'tanggal' => '2026-02-01', 'odo_akhir' => 900, 'client_uuid' => 'c1',
    ]);
    expect($akhir->odo_anomali)->toBeTrue();

    expect(fn () => (new RecordChecklistAkhirAction)->execute($this->armada, [
        'tanggal' => '2026-02-01', 'client_uuid' => 'c2',
    ]))->toThrow(ValidationException::class);

    $again = (new RecordChecklistAkhirAction)->execute($this->armada, [
        'tanggal' => '2026-02-01', 'client_uuid' => 'c1',
    ]);
    expect($again->id)->toBe($akhir->id);
});

test('checklist akhir ditolak bila belum ada checklist awal', function () {
    expect(fn () => (new RecordChecklistAkhirAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_akhir' => 1100,
    ]))->toThrow(ValidationException::class);
});

test('checklist awal terkunci setelah checklist akhir disubmit', function () {
    $awal = (new RecordChecklistAwalAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_pagi' => 1000,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]);

    (new RecordChecklistAkhirAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_akhir' => 1100,
    ]);

    expect((new ChecklistLockService)->isAwalLocked($awal->fresh(), $this->driver)['locked'])->toBeTrue();

    expect(fn () => (new RecordChecklistAwalAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_pagi' => 1200,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]))->toThrow(ValidationException::class);
});

test('checklist awal terkunci setelah presensi check-out', function () {
    $awal = (new RecordChecklistAwalAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_pagi' => 1000,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]);

    Presensi::create([
        'karyawan_id' => $this->driver->id,
        'check_in' => '2026-02-01 07:00:00',
        'check_out' => '2026-02-01 16:00:00',
    ]);

    expect((new ChecklistLockService)->isAwalLocked($awal, $this->driver)['locked'])->toBeTrue();

    expect(fn () => (new RecordChecklistAwalAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_pagi' => 1100,
        'dicatat_oleh_karyawan_id' => $this->driver->id,
    ]))->toThrow(ValidationException::class);
});

test('pengisian solar menyinkronkan BbmLog, update, dan delete', function () {
    $p = (new RecordPengisianSolarAction)->execute($this->armada, [
        'tanggal' => '2026-02-01',
        'odo_atau_hm' => 1005,
        'liter' => 20,
        'nominal_rp' => 200000,
        'foto_odo' => 'a.jpg',
        'foto_nota' => 'b.jpg',
        'dicatat_oleh' => User::factory()->create()->id,
        'client_uuid' => 'c-solar',
    ]);

    expect($p->harga_per_liter)->toBe(10000.0);
    expect($p->bbm_log_id)->not->toBeNull();
    $bbmId = $p->bbm_log_id;

    (new RecordPengisianSolarAction)->update($p, ['liter' => 25, 'nominal_rp' => 250000]);
    expect($p->fresh()->harga_per_liter)->toBe(10000.0);
    expect($p->bbmLog->fresh()->liter)->toBe(25.0);

    (new RecordPengisianSolarAction)->delete($p);

    expect(ArmadaPengisianSolar::find($p->id))->toBeNull();
    expect(BbmLog::find($bbmId))->toBeNull();
});
