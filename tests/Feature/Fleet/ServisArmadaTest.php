<?php

use App\Domain\Fleet\Actions\ApprovePengajuanServisAction;
use App\Domain\Fleet\Actions\AssignWorkshopPengerjaanAction;
use App\Domain\Fleet\Actions\CompletePengajuanServisAction;
use App\Domain\Fleet\Actions\RecordPengadaanSparepartAction;
use App\Domain\Fleet\Actions\RejectPengajuanServisAction;
use App\Domain\Fleet\Actions\RequestSparepartAction;
use App\Domain\Fleet\Actions\SubmitPengajuanServisAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\States\Dikerjakan;
use App\Domain\Fleet\States\Disetujui;
use App\Domain\Fleet\States\Ditolak;
use App\Domain\Fleet\States\Diajukan;
use App\Domain\Fleet\States\MenungguSparepart;
use App\Domain\Fleet\States\Selesai;
use App\Domain\Fleet\States\SparepartTersedia;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    $perms = [
        'view fleet service', 'manage fleet service', 'approve fleet service',
        'submit fleet service', 'manage sparepart', 'view sparepart',
        'manage fleet', 'view fleet',
    ];
    foreach ($perms as $p) {
        Permission::findOrCreate($p);
    }
    Role::findOrCreate('Ketua Divisi Armada', 'web');
    Role::findOrCreate('Workshop', 'web');
    Role::findOrCreate('Inventory', 'web');

    $this->armada = Armada::factory()->create(['status' => 'aktif']);

    $this->pic = User::factory()->create(['is_active' => true]);
    $this->pic->givePermissionTo(['view fleet service', 'submit fleet service', 'view fleet']);

    $this->approver = User::factory()->create(['is_active' => true]);
    $this->approver->givePermissionTo(['view fleet service', 'approve fleet service', 'view fleet', 'manage fleet']);
    $this->approver->syncRoles(['Ketua Divisi Armada']);

    $this->workshop = User::factory()->create(['is_active' => true]);
    $this->workshop->givePermissionTo(['view fleet service', 'manage fleet service', 'submit fleet service', 'view fleet']);
    $this->workshop->syncRoles(['Workshop']);

    $this->inventory = User::factory()->create(['is_active' => true]);
    $this->inventory->givePermissionTo(['view fleet service', 'manage sparepart', 'view sparepart', 'view fleet']);
    $this->inventory->syncRoles(['Inventory']);
});

test('SubmitPengajuanServisAction membuat ajuan berstatus diajukan dengan nomor otomatis', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, [
        'armada_id' => $this->armada->id,
        'catatan_ajuan' => 'Mesin tidak menyala',
    ]);

    expect($pengajuan)->toBeInstanceOf(PengajuanServisArmada::class);
    expect($pengajuan->status)->toBeInstanceOf(Diajukan::class);
    expect($pengajuan->kode_pengajuan)->toMatch('/^SVC-/');
    expect($pengajuan->diajukan_oleh)->toBe($this->pic->id);
});

test('ApprovePengajuanServisAction menyetujui (disetujui) dan mencatat approval', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, ['armada_id' => $this->armada->id]);

    $approved = (new ApprovePengajuanServisAction)->execute($pengajuan, $this->approver, 'ACC');

    expect($approved->status)->toBeInstanceOf(Disetujui::class);
    expect($approved->disetujui_oleh)->toBe($this->approver->id);
    expect($approved->tanggal_acc)->not->toBeNull();
    expect($approved->catatan_acc)->toBe('ACC');
});

test('RejectPengajuanServisAction menolak ajuan (ditolak)', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, ['armada_id' => $this->armada->id]);

    $rejected = (new RejectPengajuanServisAction)->execute($pengajuan, $this->approver, 'Bukan prioritas');

    expect($rejected->status)->toBeInstanceOf(Ditolak::class);
});

test('AssignWorkshopPengerjaanAction tanpa sparepart -> dikerjakan + personel', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, ['armada_id' => $this->armada->id]);
    (new ApprovePengajuanServisAction)->execute($pengajuan, $this->approver);

    $worked = (new AssignWorkshopPengerjaanAction)->execute($pengajuan, $this->workshop, [
        'tanggal_mulai_kerja' => now()->toDateString(),
        'catatan_pengerjaan' => 'Ganti pompa',
        'butuh_sparepart' => false,
        'personels' => [['nama_personel' => 'Pak Mekanik', 'peran' => 'Mekanik']],
    ]);

    expect($worked->status)->toBeInstanceOf(Dikerjakan::class);
    expect($worked->personels)->toHaveCount(1);
    expect($worked->personels->first()->nama_personel)->toBe('Pak Mekanik');
});

test('Alur lengkap butuh sparepart: assign -> request -> record -> selesai (+ service_history)', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, ['armada_id' => $this->armada->id]);
    (new ApprovePengajuanServisAction)->execute($pengajuan, $this->approver);

    // Workshop mulai + butuh sparepart -> menunggu_sparepart
    (new AssignWorkshopPengerjaanAction)->execute($pengajuan, $this->workshop, [
        'butuh_sparepart' => true,
        'personels' => [['nama_personel' => 'Mekanik A', 'peran' => 'Mekanik']],
    ]);
    expect($pengajuan->fresh()->status)->toBeInstanceOf(MenungguSparepart::class);

    // Workshop ajukan item sparepart
    (new RequestSparepartAction)->execute($this->workshop, [
        ['nama_item' => 'Pompa Air', 'jumlah' => 1, 'satuan' => 'pcs', 'nominal' => 250000],
        ['nama_item' => 'Oli Mesin', 'jumlah' => 2, 'satuan' => 'liter', 'nominal' => 50000],
    ], $pengajuan);
    expect(PengajuanServisSparepart::where('pengajuan_servis_armada_id', $pengajuan->id)->count())->toBe(2);

    // Inventory catat pengadaan -> sparepart_tersedia + total biaya
    $spareparts = PengajuanServisSparepart::where('pengajuan_servis_armada_id', $pengajuan->id)->get();
    $recorded = (new RecordPengadaanSparepartAction)->execute($pengajuan, $this->inventory, [
        'items' => $spareparts->map(function ($s) {
            return ['id' => $s->id, 'nominal' => $s->nominal, 'jumlah' => $s->jumlah];
        })->all(),
    ]);
    expect($recorded->status)->toBeInstanceOf(SparepartTersedia::class);
    expect((float) $recorded->total_biaya)->toBe(300000.0);

    // Workshop selesaikan -> selesai + service_history tercipta
    $done = (new CompletePengajuanServisAction)->execute($pengajuan, $this->workshop);
    expect($done->status)->toBeInstanceOf(Selesai::class);
    expect($done->tanggal_selesai)->not->toBeNull();

    $history = ServiceHistory::where('serviceable_type', Armada::class)
        ->where('serviceable_id', $this->armada->id)
        ->get();
    expect($history)->toHaveCount(1);
    expect((float) $history->first()->biaya)->toBe(300000.0);
});

test('role Workshop bisa membuka halaman index servis armada via web', function () {
    $this->actingAs($this->workshop)
        ->get(route('fleet.servis-armada.index'))
        ->assertOk();
});

test('role Inventory bisa membuka halaman index servis armada via web', function () {
    $this->actingAs($this->inventory)
        ->get(route('fleet.servis-armada.index'))
        ->assertOk();
});

test('user tanpa permission servis armada ditolak (403) dari halaman index', function () {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->get(route('fleet.servis-armada.index'))
        ->assertForbidden();
});

test('PIC bisa mengajukan servis via web POST', function () {
    $this->actingAs($this->pic)
        ->post(route('fleet.servis-armada.store'), [
            'armada_id' => $this->armada->id,
            'catatan_ajuan' => 'Ban bocor',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseCount('pengajuan_servis_armadas', 1);
});

test('PIC armada (diajukan) bisa melihat detail servis miliknya', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, ['armada_id' => $this->armada->id]);

    $this->actingAs($this->pic)
        ->get(route('fleet.servis-armada.show', $pengajuan->id))
        ->assertOk();
});

test('web complete dari role non-workshop (tanpa permission) ditolak 403', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, ['armada_id' => $this->armada->id]);
    (new ApprovePengajuanServisAction)->execute($pengajuan, $this->approver);
    (new AssignWorkshopPengerjaanAction)->execute($pengajuan, $this->workshop, ['butuh_sparepart' => false]);

    $outsider = User::factory()->create(['is_active' => true]);
    $this->actingAs($outsider)
        ->post(route('fleet.servis-armada.complete', $pengajuan->id))
        ->assertForbidden();
});

test('role Workshop bisa menyelesaikan servis via web (complete)', function () {
    $pengajuan = (new SubmitPengajuanServisAction)->execute($this->pic, ['armada_id' => $this->armada->id]);
    (new ApprovePengajuanServisAction)->execute($pengajuan, $this->approver);
    (new AssignWorkshopPengerjaanAction)->execute($pengajuan, $this->workshop, ['butuh_sparepart' => false]);

    $this->actingAs($this->workshop)
        ->post(route('fleet.servis-armada.complete', $pengajuan->id), [
            'tanggal_selesai_kerja' => now()->toDateString(),
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($pengajuan->fresh()->status)->toBeInstanceOf(Selesai::class);
});
