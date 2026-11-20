<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->for($this->unit)->create();

    Permission::findOrCreate('view fleet', 'web');
    Permission::findOrCreate('manage fleet service', 'web');

    $workshopRole = Role::findOrCreate('Workshop', 'web');
    $workshopRole->syncPermissions(['view fleet', 'manage fleet service']);
    [$this->workshop, $this->workshopToken] = createMobileUserWithToken();
    $this->workshop->assignRole($workshopRole);
    [$this->submitter] = createMobileUserWithToken();

    $outsiderRole = Role::findOrCreate('Servis Outsider Test', 'web');
    $outsiderRole->syncPermissions([]);
    [$this->outsider, $this->outsiderToken] = createMobileUserWithToken();
    $this->outsider->assignRole($outsiderRole);
});

function servisPayload(array $overrides = []): array
{
    return array_merge([
        'armada_id' => null,
        'diajukan_oleh' => null,
        'status' => 'disetujui',
        'tipe_servis' => 'internal',
        'tanggal_ajuan' => now()->toDateString(),
        'kode_pengajuan' => 'SVC-TEST-'.uniqid(),
    ], $overrides);
}

function mobileGetServis($case, string $path, string $token)
{
    return $case->withHeaders(mobileAuthHeaders([
        'Authorization' => 'Bearer '.$token,
    ]))->getJson($path);
}

function mobilePostServis($case, string $path, string $token, array $payload = [])
{
    return $case->withHeaders(mobileAuthHeaders([
        'Authorization' => 'Bearer '.$token,
        'Idempotency-Key' => (string) Str::uuid(),
    ]))->postJson($path, $payload);
}

test('workshop dapat membuka detail semua status pasca persetujuan', function () {
    foreach (['disetujui', 'dikerjakan', 'menunggu_sparepart', 'sparepart_tersedia', 'selesai'] as $status) {
        $servis = PengajuanServisArmada::factory()->create(servisPayload([
            'armada_id' => $this->armada->id,
            'diajukan_oleh' => $this->submitter->id,
            'status' => $status,
        ]));

        mobileGetServis($this,"/api/mobile/servis-armada/{$servis->id}", $this->workshopToken)
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.id', $servis->id)
            ->assertJsonStructure([
                'data' => [
                    'timeline' => [
                        '*' => ['key', 'label', 'state', 'badge', 'details'],
                    ],
                ],
            ]);
    }
});

test('workshop tidak melihat ajuan diajukan atau ditolak di saya', function () {
    $diajukan = PengajuanServisArmada::factory()->create(servisPayload([
        'armada_id' => $this->armada->id,
        'diajukan_oleh' => $this->submitter->id,
        'status' => 'diajukan',
    ]));
    $disetujui = PengajuanServisArmada::factory()->create(servisPayload([
        'armada_id' => $this->armada->id,
        'diajukan_oleh' => $this->submitter->id,
        'status' => 'disetujui',
    ]));

    $response = mobileGetServis($this,'/api/mobile/servis-armada/saya', $this->workshopToken)->assertOk();

    $ids = collect($response->json('data'))->pluck('id');
    expect($ids)->toContain($disetujui->id);
    expect($ids)->not->toContain($diajukan->id);
});

test('role tanpa akses workshop tetap ditolak pada detail dan aksi workshop', function () {
    $servis = PengajuanServisArmada::factory()->create(servisPayload([
        'armada_id' => $this->armada->id,
        'diajukan_oleh' => $this->submitter->id,
        'status' => 'disetujui',
    ]));

    $responses = [
        'detail' => mobileGetServis($this,"/api/mobile/servis-armada/{$servis->id}", $this->outsiderToken),
        'mulai' => mobilePostServis($this,"/api/mobile/servis-armada/{$servis->id}/mulai", $this->outsiderToken),
        'request-sparepart' => mobilePostServis($this,"/api/mobile/workshop/job/{$servis->id}/request-sparepart", $this->outsiderToken),
    ];

    foreach ($responses as $name => $response) {
        expect($response->status())->toBe(403, $name.': '.$response->getContent());
    }
});

test('workshop diizinkan menjalankan aksi pengerjaan', function () {
    $servis = PengajuanServisArmada::factory()->create(servisPayload([
        'armada_id' => $this->armada->id,
        'diajukan_oleh' => $this->submitter->id,
        'status' => 'disetujui',
    ]));

    mobilePostServis($this,"/api/mobile/servis-armada/{$servis->id}/mulai", $this->workshopToken, [
        'catatan_pengerjaan' => 'Pemeriksaan awal.',
        'butuh_sparepart' => false,
    ])->assertOk();

    expect($servis->fresh()->status->getValue())->toBe('dikerjakan');

    mobilePostServis($this,"/api/mobile/workshop/job/{$servis->id}/request-sparepart", $this->workshopToken)
        ->assertStatus(422);
});
