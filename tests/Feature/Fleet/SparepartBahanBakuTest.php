<?php

use App\Domain\Fleet\Actions\RecordPengadaanSparepartAction;
use App\Domain\Fleet\Actions\RecordTodoSparepartAction;
use App\Domain\Fleet\Actions\RequestSparepartAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Domain\Procurement\Actions\ResolveSparepartBahanBakuAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\StokMutasi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Validation\ValidationException;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->titik = \App\Domain\Core\Models\Titik::factory()->create(['status' => 'aktif']);
    $this->armada = Armada::factory()->create([
        'status' => 'aktif',
        'titik_id' => $this->titik->id,
    ]);
});

test('resolver sparepart mencocokkan nama kanonik tanpa membuat master baru', function () {
    $master = BahanBaku::factory()->sparepart()->create([
        'nama' => 'Oli Mesin 10W-30',
        'kategori' => 'sparepart',
        'sparepart_untuk' => 'armada',
        'satuan' => 'liter',
        'aktif' => true,
    ]);

    $resolved = app(ResolveSparepartBahanBakuAction::class)->execute([
        'nama_item' => 'oli mesin 10w-30',
        'satuan' => 'botol',
        'jumlah' => 3,
    ], 'armada');

    expect($resolved['bahan_baku_id'])->toBe($master->id)
        ->and($resolved['nama_item'])->toBe('Oli Mesin 10W-30')
        ->and($resolved['satuan'])->toBe('liter')
        ->and(BahanBaku::count())->toBe(1);

    $freeText = app(ResolveSparepartBahanBakuAction::class)->execute([
        'nama_item' => 'Baut khusus lokal',
        'satuan' => 'pcs',
    ], 'armada');

    expect($freeText['bahan_baku_id'])->toBeNull()
        ->and($freeText['nama_item'])->toBe('Baut khusus lokal')
        ->and(BahanBaku::count())->toBe(1);
});

test('resolver menolak master sparepart dari konteks lain', function () {
    $master = BahanBaku::factory()->sparepart()->create([
        'nama' => 'Filter Mesin Produksi',
        'sparepart_untuk' => 'mesin',
        'satuan' => 'pcs',
        'aktif' => true,
    ]);

    expect(fn () => app(ResolveSparepartBahanBakuAction::class)->execute([
        'bahan_baku_id' => $master->id,
        'nama_item' => 'Filter Mesin Produksi',
    ], 'armada'))->toThrow(ValidationException::class);
});

test('permintaan sparepart menyimpan referensi master dan nama kanonik', function () {
    $master = BahanBaku::factory()->sparepart()->create([
        'nama' => 'Ban Dump Truck',
        'sparepart_untuk' => 'armada',
        'satuan' => 'unit',
        'aktif' => true,
    ]);

    $pengajuan = PengajuanServisArmada::factory()->create([
        'armada_id' => $this->armada->id,
        'status' => 'dikerjakan',
    ]);

    app(RequestSparepartAction::class)->execute($this->user, [
        [
            'nama_item' => 'ban dump truck',
            'jumlah' => 2,
            'satuan' => 'pcs',
        ],
        [
            'nama_item' => 'Karet basin lokal',
            'jumlah' => 1,
            'satuan' => 'pcs',
        ],
    ], $pengajuan);

    $items = $pengajuan->spareparts()->orderBy('nama_item')->get();

    expect($items)->toHaveCount(2)
        ->and($items->firstWhere('bahan_baku_id', $master->id)->nama_item)->toBe('Ban Dump Truck')
        ->and($items->firstWhere('bahan_baku_id', $master->id)->satuan)->toBe('unit')
        ->and($items->firstWhere('nama_item', 'Karet basin lokal')->bahan_baku_id)->toBeNull()
        ->and($pengajuan->fresh()->status->getValue())->toBe('menunggu_sparepart');
});

test('pencatatan pengadaan memutar stok keluar sekali dan idempoten', function () {
    $master = BahanBaku::factory()->sparepart()->create([
        'nama' => 'Oli Hidrolik',
        'sparepart_untuk' => 'armada',
        'satuan' => 'liter',
        'aktif' => true,
    ]);

    $pengajuan = PengajuanServisArmada::factory()->create([
        'armada_id' => $this->armada->id,
        'status' => 'menunggu_sparepart',
    ]);

    $sparepart = PengajuanServisSparepart::create([
        'pengajuan_servis_armada_id' => $pengajuan->id,
        'bahan_baku_id' => $master->id,
        'nama_item' => 'Oli Hidrolik',
        'jumlah' => 4,
        'satuan' => 'liter',
        'nominal' => 250000,
        'tanggal' => now()->toDateString(),
        'status' => 'diajukan',
    ]);

    app(RecordPengadaanSparepartAction::class)->execute($pengajuan, $this->user, [
        'items' => [[
            'id' => $sparepart->id,
            'nominal' => 250000,
            'jumlah' => 4,
        ]],
    ]);

    expect(StokMutasi::query()->where('tipe', 'keluar')->count())->toBe(1);

    app(RecordPengadaanSparepartAction::class)->execute($pengajuan->fresh(), $this->user, [
        'items' => [[
            'id' => $sparepart->id,
            'nominal' => 250000,
            'jumlah' => 4,
        ]],
    ]);

    $mutation = StokMutasi::query()->where('tipe', 'keluar')->first();

    expect(StokMutasi::query()->where('tipe', 'keluar')->count())->toBe(1)
        ->and($mutation->bahan_baku_id)->toBe($master->id)
        ->and($mutation->titik_id)->toBe($this->titik->id)
        ->and((float) $mutation->jumlah)->toBe(4.0)
        ->and($mutation->referensi_type)->toBe(PengajuanServisSparepart::class)
        ->and($mutation->referensi_id)->toBe($sparepart->id)
        ->and($mutation->created_by)->toBe($this->user->id);
});

test('pencatatan sparepart to-do juga memutar stok keluar', function () {
    $master = BahanBaku::factory()->sparepart()->create([
        'nama' => 'Filter Oli',
        'sparepart_untuk' => 'armada',
        'satuan' => 'pcs',
        'aktif' => true,
    ]);

    $todo = WorkshopTodo::create([
        'judul' => 'Servis rutin',
        'jadwal_tipe' => 'mingguan',
        'jadwal_detail' => 'senin',
        'armada_id' => $this->armada->id,
        'status' => 'terjadwal',
        'created_by' => $this->user->id,
    ]);

    $sparepart = PengajuanServisSparepart::create([
        'workshop_todo_id' => $todo->id,
        'bahan_baku_id' => $master->id,
        'nama_item' => 'Filter Oli',
        'jumlah' => 1,
        'satuan' => 'pcs',
        'nominal' => 35000,
        'tanggal' => now()->toDateString(),
        'status' => 'diajukan',
    ]);

    app(RecordTodoSparepartAction::class)->execute($this->user, [
        'items' => [['id' => $sparepart->id, 'nominal' => 35000]],
    ]);

    expect(StokMutasi::query()->where('tipe', 'keluar')->count())->toBe(1)
        ->and(StokMutasi::query()->where('tipe', 'keluar')->first()->titik_id)->toBe($this->titik->id);
});

test('sparepart free-text tidak menghasilkan mutasi stok', function () {
    $pengajuan = PengajuanServisArmada::factory()->create([
        'armada_id' => $this->armada->id,
        'status' => 'menunggu_sparepart',
    ]);

    $sparepart = PengajuanServisSparepart::create([
        'pengajuan_servis_armada_id' => $pengajuan->id,
        'nama_item' => 'Baut lokal',
        'jumlah' => 5,
        'satuan' => 'pcs',
        'nominal' => 5000,
        'tanggal' => now()->toDateString(),
        'status' => 'diajukan',
    ]);

    app(RecordPengadaanSparepartAction::class)->execute($pengajuan, $this->user, [
        'items' => [['id' => $sparepart->id, 'nominal' => 5000]],
    ]);

    expect(StokMutasi::count())->toBe(0);
});
