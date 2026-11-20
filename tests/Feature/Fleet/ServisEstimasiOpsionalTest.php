<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $unit = UnitBisnis::factory()->create();
    $this->armada = Armada::factory()->for($unit)->create();

    Role::findOrCreate('Ketua Armada', 'web');
    [$this->user, $this->token] = createMobileUserWithToken();
    $this->user->assignRole('Ketua Armada');
});

function postServisEksternal($case, array $payload = [])
{
    return $case->withHeaders(mobileAuthHeaders([
        'Authorization' => 'Bearer '.$case->token,
        'Idempotency-Key' => (string) \Illuminate\Support\Str::uuid(),
    ]))->postJson('/api/mobile/servis-armada/eksternal', array_merge([
        'armada_id' => $case->armada->id,
        'nama_bengkel' => 'Bengkel Nusantara',
        'rincian_pekerjaan' => 'Ganti oli dan filter.',
    ], $payload));
}

test('estimasi biaya servis eksternal boleh kosong', function () {
    $response = postServisEksternal($this)->assertCreated();

    $servisId = $response->json('data.id');
    $servis = PengajuanServisArmada::findOrFail($servisId);

    expect($servis->total_biaya)->toBe(0.0);
    expect($servis->eksternalDetail->total_biaya_estimasi)->toBe(0.0);
});

test('estimasi biaya servis eksternal tetap tersimpan bila diisi', function () {
    $response = postServisEksternal($this, ['total_biaya_estimasi' => 1250000])->assertCreated();

    $servis = PengajuanServisArmada::findOrFail($response->json('data.id'));

    expect($servis->total_biaya)->toBe(1250000.0);
    expect($servis->eksternalDetail->total_biaya_estimasi)->toBe(1250000.0);
});
