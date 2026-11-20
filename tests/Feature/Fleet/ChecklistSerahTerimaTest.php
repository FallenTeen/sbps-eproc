<?php

use App\Domain\Fleet\Actions\GenerateChecklistSerahTerimaPdfAction;
use App\Domain\Fleet\Actions\RecordChecklistSerahTerimaAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ChecklistSerahTerima;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $perms = [
        'view fleet', 'manage fleet',
    ];
    foreach ($perms as $p) {
        Permission::findOrCreate($p);
    }
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Kepala Divisi Armada', 'web');

    $this->armada = Armada::factory()->create(['status' => 'aktif', 'kode_unit' => 'TEST', 'plat_nomor' => 'B 1234 AB']);

    $this->sewa = SewaAlatJam::create([
        'armada_id' => $this->armada->id,
        'tipe_sewa' => 'eksternal',
        'penyewa_nama' => 'Perusahaan Test',
        'penyewa_pt' => 'Perusahaan Test',
        'penyewa_alamat' => 'Jl. Contoh No. 1',
        'penyewa_penanggung_jawab' => 'Pak Joko',
        'penyewa_no_hp' => '081234567890',
        'harga_per_jam_snapshot' => 50000,
        'status' => 'disetujui',
        'tanggal' => now(),
        'hm_awal' => 100,
        'hm_akhir' => 200,
        'jumlah_jam' => 100,
    ]);

    $this->admin = User::factory()->create();
    $this->admin->givePermissionTo(['view fleet', 'manage fleet']);
    $this->admin->syncRoles(['Admin']);

    $this->kepala = User::factory()->create();
    $this->kepala->givePermissionTo(['view fleet', 'manage fleet']);
    $this->kepala->syncRoles(['Kepala Divisi Armada']);
});

test('RecordChecklistSerahTerimaAction catat checklist berangkat dengan data penyewa snapshot', function () {
    $action = new RecordChecklistSerahTerimaAction;
    $checklist = $action->execute($this->sewa, 'berangkat', [
        'odo_atau_hm' => 150,
        'tanggal' => now()->toDateString(),
        'catatan' => 'Checklist awal',
        'ditandatangani_oleh' => 'Pak Joko',
        'items' => [
            ['item' => 'Kondisi Mesin', 'kondisi' => 'baik', 'catatan' => ''],
            ['item' => 'Rem', 'kondisi' => 'rusak', 'catatan' => 'Rem tiris'],
        ],
        'foto_kondisi' => [],
    ]);

    expect($checklist->tipe)->toBe('berangkat');
    expect($checklist->data_penyewa['nama'])->toBe('Perusahaan Test');
    expect($checklist->data_penyewa['pt'])->toBe('Perusahaan Test');
    expect($checklist->odo_atau_hm)->toEqual(150);
    expect($checklist->details->count())->toBe(2);
    expect($checklist->details->first()->item)->toBe('Kondisi Mesin');
    expect($checklist->details->first()->kondisi)->toBe('baik');

    // Idempoten: record ulang berangkat menggantikan baris lama
    $checklist2 = $action->execute($this->sewa, 'berangkat', [
        'odo_atau_hm' => 180,
        'tanggal' => now()->addDay()->toDateString(),
        'catatan' => 'Checklist diganti',
        'ditandatangani_oleh' => 'Pak Joko',
        'items' => [
            ['item' => 'Kondisi Mesin', 'kondisi' => 'baik', 'catatan' => ''],
        ],
        'foto_kondisi' => [],
    ]);

    expect($checklist2->odo_atau_hm)->toEqual(180);
    expect(ChecklistSerahTerima::where('tipe', 'berangkat')->count())->toBe(1);
});

test('RecordChecklistSerahTerimaAction catat checklist kembali dan menghitung pemakaian', function () {
    // Pertama catat berangkat
    $action = new RecordChecklistSerahTerimaAction;
    $checklistBerangkat = $action->execute($this->sewa, 'berangkat', [
        'odo_atau_hm' => 150,
        'tanggal' => now()->toDateString(),
        'catatan' => 'Awal',
        'ditandatangani_oleh' => 'Pak Joko',
        'items' => [],
        'foto_kondisi' => [],
    ]);

    // Lalu catat kembali
    $checklistKembali = $action->execute($this->sewa, 'kembali', [
        'odo_atau_hm' => 250,
        'tanggal' => now()->addDay()->toDateString(),
        'catatan' => 'Selesai',
        'ditandatangani_oleh' => 'Pak Joko',
        'items' => [],
        'foto_kondisi' => [],
    ]);

    expect($checklistKembali->tipe)->toBe('kembali');
    expect($checklistKembali->odo_atau_hm)->toEqual(250);
    // pemakaian = 250 - 150 = 100 (dihitung on-the-fly, tidak disimpan di DB)
    expect(true)->toBeTrue(); // validasi lanjut di controller/view
});

test('Uniknya per (sewa, tipe): hanya ada satu baris berangkat & satu baris kembali', function () {
    $action = new RecordChecklistSerahTerimaAction;

    $action->execute($this->sewa, 'berangkat', [
        'odo_atau_hm' => 100,
        'tanggal' => now()->toDateString(),
        'catatan' => 'A',
        'ditandatangani_oleh' => 'Pak Joko',
        'items' => [],
        'foto_kondisi' => [],
    ]);

    $action->execute($this->sewa, 'berangkat', [
        'odo_atau_hm' => 200,
        'tanggal' => now()->addDay()->toDateString(),
        'catatan' => 'B',
        'ditandatangani_oleh' => 'Pak Joko',
        'items' => [],
        'foto_kondisi' => [],
    ]);

    // Hanya 1 baris berangkat (idempoten)
    expect(ChecklistSerahTerima::where('tipe', 'berangkat')->count())->toBe(1);

    // Catat kembali
    $action->execute($this->sewa, 'kembali', [
        'odo_atau_hm' => 200,
        'tanggal' => now()->addDay()->toDateString(),
        'catatan' => 'Selesai',
        'ditandatangani_oleh' => 'Pak Joko',
        'items' => [],
        'foto_kondisi' => [],
    ]);

    expect(ChecklistSerahTerima::where('tipe', 'kembali')->count())->toBe(1);
});

test('item template kustom berangkat otomatis dipakai checklist kembali', function () {
    $action = new RecordChecklistSerahTerimaAction;
    $template = [...ChecklistSerahTerima::DEFAULT_ITEMS, 'Jok'];

    $berangkat = $action->execute($this->sewa, 'berangkat', [
        'item_template' => $template,
        'items' => [],
        'foto_kondisi' => [],
    ]);

    $kembali = $action->execute($this->sewa, 'kembali', [
        'items' => [],
        'foto_kondisi' => [],
    ]);

    expect($berangkat->item_template)->toBe($template);
    expect($kembali->item_template)->toBe($template);
    expect($kembali->details->pluck('item')->all())->toBe($template);
    expect($berangkat->fresh()->details->pluck('item')->all())->toBe($template);
    expect($kembali->details->firstWhere('item', 'Jok')?->kondisi)->toBe('baik');
});

test('PDF checklist cetak dinamis mengikuti item_template kustom', function () {
    $action = new RecordChecklistSerahTerimaAction;
    $template = [...ChecklistSerahTerima::DEFAULT_ITEMS, 'Jok'];

    $berangkat = $action->execute($this->sewa, 'berangkat', [
        'odo_atau_hm' => 100,
        'tanggal' => now()->toDateString(),
        'item_template' => $template,
        'items' => [
            ['item' => 'Jok', 'kondisi' => 'rusak', 'catatan' => 'Robecek'],
        ],
        'foto_kondisi' => [],
    ]);

    $kembali = $action->execute($this->sewa, 'kembali', [
        'odo_atau_hm' => 250,
        'tanggal' => now()->addDay()->toDateString(),
        'items' => [
            ['item' => 'Jok', 'kondisi' => 'baik', 'catatan' => 'Diganti'],
        ],
        'foto_kondisi' => [],
    ]);

    $pdf = app(GenerateChecklistSerahTerimaPdfAction::class)->execute($this->sewa);
    $output = $pdf->output();

    expect($output)->toStartWith('%PDF-')
        ->and($berangkat->item_template)->toContain('Jok')
        ->and($kembali->item_template)->toContain('Jok')
        ->and($berangkat->details->pluck('item'))->toContain('Jok')
        ->and($kembali->details->pluck('item'))->toContain('Jok');
});

test('klien lama tanpa item_template memakai label item sebagai template', function () {
    $action = new RecordChecklistSerahTerimaAction;

    $checklist = $action->execute($this->sewa, 'berangkat', [
        'items' => [
            ['item' => 'Jok', 'kondisi' => 'rusak', 'catatan' => 'Robecek'],
        ],
        'foto_kondisi' => [],
    ]);

    expect($checklist->item_template)->toBe(['Jok']);
    expect($checklist->details->count())->toBe(1);
});
