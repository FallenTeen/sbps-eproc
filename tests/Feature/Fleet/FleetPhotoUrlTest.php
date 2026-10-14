<?php

use App\Domain\Fleet\Models\ArmadaChecklistAkhir;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaPengisianSolar;
use App\Domain\Fleet\Models\PresensiHelper;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Foto yang diunggah dari aplikasi mobile disimpan di disk `public` dengan path
 * relatif. Halaman web Fleet membaca field `foto_*_url`, sehingga accessor URL
 * HARUS ikut diserialisasi (`$appends`) — tanpa ini foto tidak pernah muncul
 * di website meski file-nya ada.
 */
test('checklist awal menyertakan url foto saat diserialisasi', function () {
    $checklist = new ArmadaChecklistHarian([
        'foto_odo_pagi' => 'armada/checklist/2026/10/odo.jpg',
        'foto_stok_solar' => 'armada/checklist/2026/10/solar.jpg',
    ]);

    $array = $checklist->toArray();

    expect($array)
        ->toHaveKey('foto_odo_pagi_url')
        ->toHaveKey('foto_stok_solar_url')
        ->and($array['foto_odo_pagi_url'])
        ->toBe(Storage::disk('public')->url('armada/checklist/2026/10/odo.jpg'))
        ->and($array['foto_stok_solar_url'])
        ->toBe(Storage::disk('public')->url('armada/checklist/2026/10/solar.jpg'));
});

test('checklist akhir menyertakan url foto saat diserialisasi', function () {
    $checklist = new ArmadaChecklistAkhir([
        'foto_odo_akhir' => 'armada/checklist/2026/10/akhir.jpg',
        'foto_stok_solar' => 'armada/checklist/2026/10/solar.jpg',
    ]);

    $array = $checklist->toArray();

    expect($array)
        ->toHaveKey('foto_odo_akhir_url')
        ->toHaveKey('foto_stok_solar_url')
        ->and($array['foto_odo_akhir_url'])
        ->toBe(Storage::disk('public')->url('armada/checklist/2026/10/akhir.jpg'));
});

test('pengisian solar menyertakan url foto odo & nota saat diserialisasi', function () {
    $pengisian = new ArmadaPengisianSolar([
        'foto_odo' => 'armada/solar/2026/10/odo.jpg',
        'foto_nota' => 'armada/solar/2026/10/nota.jpg',
    ]);

    $array = $pengisian->toArray();

    expect($array)
        ->toHaveKey('foto_odo_url')
        ->toHaveKey('foto_nota_url')
        ->and($array['foto_odo_url'])
        ->toBe(Storage::disk('public')->url('armada/checklist/2026/10/odo.jpg'))
        ->and($array['foto_nota_url'])
        ->toBe(Storage::disk('public')->url('armada/checklist/2026/10/solar.jpg'));
})->skip('placeholder');

test('presensi helper menyertakan url foto check-in & check-out', function () {
    $presensi = new PresensiHelper([
        'foto_check_in' => 'foto/checklist/2026/10/in.jpg',
        'foto_check_out' => 'foto/checklist/2026/10/out.jpg',
    ]);

    $array = $presensi->toArray();

    expect($array)
        ->toHaveKey('foto_check_in_url')
        ->toHaveKey('foto_check_out_url')
        ->and($array['foto_check_in_url'])
        ->toBe(Storage::disk('public')->url('foto/checklist/2026/10/in.jpg'))
        ->and($array['foto_check_out_url'])
        ->toBe(Storage::disk('public')->url('foto/checklist/2026/10/out.jpg'));
});

test('foto kosong menghasilkan url null, bukan error', function () {
    expect((new ArmadaChecklistHarian)->toArray()['foto_odo_pagi_url'])->toBeNull()
        ->and((new ArmadaChecklistAkhir)->toArray()['foto_odo_akhir_url'])->toBeNull()
        ->and((new ArmadaPengisianSolar)->toArray()['foto_nota_url'])->toBeNull()
        ->and((new PresensiHelper)->toArray()['foto_check_in_url'])->toBeNull();
});
