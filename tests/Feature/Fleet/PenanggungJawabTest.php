<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\ActivateCadanganPenanggungJawabAction;
use App\Domain\Fleet\Actions\AssignPenanggungJawabArmadaAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
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

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->dumpTruck()->create();

    $this->karyawan = function (string $nama): Karyawan {
        return Karyawan::create([
            'nama' => $nama,
            'tipe' => 'borongan_rit',
            'jabatan' => 'Driver',
            'status' => 'aktif',
        ]);
    };
});

// =========================================================
// Fase A2 — penanggung jawab armada (utama & cadangan)
// =========================================================

describe('Fase A2 - Assign Penanggung Jawab', function () {
    test('assign penanggung jawab utama tersimpan', function () {
        $pic = ($this->karyawan)('PIC Utama');

        $picBaru = (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $pic->id,
            'peran' => 'utama',
            'created_by' => $this->user->id,
        ]);

        expect($picBaru->armada_id)->toBe($this->armada->id);
        expect($picBaru->peran)->toBe('utama');
        expect($picBaru->sampai)->toBeNull();
        expect(ArmadaPenanggungJawab::count())->toBe(1);
    });

    test('penanggung jawab default ke peran utama jika tidak dikirim', function () {
        $pic = ($this->karyawan)('PIC Default');

        $hasil = (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $pic->id,
        ]);

        expect($hasil->peran)->toBe('utama');
    });

    test('active_penanggung_jawab mengembalikan utama yang masih aktif', function () {
        $pic = ($this->karyawan)('PIC Utama');
        $cadangan = ($this->karyawan)('PIC Cadangan');

        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $pic->id,
            'peran' => 'utama',
        ]);
        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $cadangan->id,
            'peran' => 'cadangan',
        ]);

        $this->armada->unsetRelation('penanggungJawabs');

        expect($this->armada->active_penanggung_jawab->karyawan_id)->toBe($pic->id);
    });
});

describe('Fase A2 - Aktivasi Cadangan', function () {
    test('mengaktifkan cadangan menonaktifkan utama (sampai terisi)', function () {
        $pic = ($this->karyawan)('PIC Utama');
        $cadangan = ($this->karyawan)('PIC Cadangan');

        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $pic->id,
            'peran' => 'utama',
            'mulai_dari' => '2026-01-01',
        ]);
        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $cadangan->id,
            'peran' => 'cadangan',
            'mulai_dari' => '2026-01-01',
        ]);

        (new ActivateCadanganPenanggungJawabAction)->execute([
            'armada_id' => $this->armada->id,
            'tanggal' => '2026-03-01',
            'alasan' => 'Sakit',
        ]);

        $utama = ArmadaPenanggungJawab::where('armada_id', $this->armada->id)
            ->where('peran', 'utama')->first();
        expect($utama->sampai->toDateString())->toBe('2026-03-01');

        $this->armada->unsetRelation('penanggungJawabs');
        $aktif = $this->armada->active_penanggung_jawab;
        expect($aktif->peran)->toBe('cadangan');
        expect($aktif->karyawan_id)->toBe($cadangan->id);
    });

    test('mengaktifkan cadangan saat belum ada cadangan membuat baris cadangan baru', function () {
        $pic = ($this->karyawan)('PIC Utama');
        $cadangan = ($this->karyawan)('Cadangan Baru');

        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $pic->id,
            'peran' => 'utama',
        ]);

        $hasil = (new ActivateCadanganPenanggungJawabAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $cadangan->id,
            'tanggal' => '2026-02-01',
            'created_by' => $this->user->id,
        ]);

        expect($hasil->peran)->toBe('cadangan');
        expect($hasil->karyawan_id)->toBe($cadangan->id);
        expect($hasil->mulai_dari->toDateString())->toBe('2026-02-01');
    });

    test('jika tidak ada cadangan dan tidak ada karyawan_id, gagal (422)', function () {
        $pic = ($this->karyawan)('PIC Utama');
        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $pic->id,
            'peran' => 'utama',
        ]);

        expect(fn () => (new ActivateCadanganPenanggungJawabAction)->execute([
            'armada_id' => $this->armada->id,
            'tanggal' => '2026-02-01',
        ]))->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    });
});

describe('Fase A2 - HTTP Controller', function () {
    test('index penanggung jawab dapat diakses user berizin', function () {
        $this->get(route('fleet.armada.penanggung-jawab.index', $this->armada))
            ->assertInertia(fn ($page) => $page
                ->component('Fleet/Armada/PenanggungJawab')
                ->has('armada')
                ->has('penanggungJawabs'));
    });

    test('store menugaskan penanggung jawab via HTTP', function () {
        $pic = ($this->karyawan)('PIC HTTP');

        $this->post(route('fleet.armada.penanggung-jawab.store', $this->armada), [
            'karyawan_id' => $pic->id,
            'peran' => 'utama',
            'mulai_dari' => '2026-01-01',
        ])->assertRedirect();

        expect(ArmadaPenanggungJawab::where('armada_id', $this->armada->id)->count())->toBe(1);
        expect(ArmadaPenanggungJawab::first()->karyawan_id)->toBe($pic->id);
    });

    test('activateCadangan via HTTP menonaktifkan utama', function () {
        $pic = ($this->karyawan)('PIC Utama');
        $cadangan = ($this->karyawan)('Cadangan HTTP');

        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $pic->id,
            'peran' => 'utama',
        ]);
        (new AssignPenanggungJawabArmadaAction)->execute([
            'armada_id' => $this->armada->id,
            'karyawan_id' => $cadangan->id,
            'peran' => 'cadangan',
        ]);

        $this->post(route('fleet.armada.penanggung-jawab.cadangan', $this->armada), [
            'tanggal' => '2026-04-01',
        ])->assertRedirect();

        $this->armada->unsetRelation('penanggungJawabs');
expect($this->armada->active_penanggung_jawab->karyawan_id)->toBe($cadangan->id);
    });
});
