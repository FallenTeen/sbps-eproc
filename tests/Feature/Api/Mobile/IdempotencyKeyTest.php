<?php

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Models\IdempotencyKey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function checkInPayload(Titik $titik): array
{
    return [
        'titik_id' => $titik->id,
        'latitude' => $titik->latitude,
        'longitude' => $titik->longitude,
        'photo' => UploadedFile::fake()->image('checkin.jpg'),
    ];
}

/**
 * Kolom JSON MySQL bisa menormalkan urutan key saat menyimpan,
 * jadi kesamaan response dibandingkan secara semantik.
 */
function jsonSame(string $a, string $b): bool
{
    $normalize = function ($value) use (&$normalize) {
        if (is_array($value)) {
            ksort($value);

            return array_map($normalize, $value);
        }

        return $value;
    };

    return $normalize(json_decode($a, true)) === $normalize(json_decode($b, true));
}

beforeEach(function () {
    Storage::fake('public');

    [$this->user, $this->token] = createMobileUserWithToken('SDM Lapangan Kondisional');
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
});

// ─── Check-in ────────────────────────────────────────────────────────────────

test('check-in: retry Idempotency-Key sama membalas response 201 yang sama, bukan 422', function () {
    $key = (string) Str::uuid();

    $first = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik))
        ->assertStatus(201);

    // Respons pertama hilang di jalan → client kirim ulang PERSIS sama.
    $second = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    $second->assertStatus(201)
        ->assertHeader('X-Idempotent-Replay', 'true');

    expect(jsonSame($second->getContent(), $first->getContent()))->toBeTrue();
    expect(Presensi::where('karyawan_id', $this->karyawan->id)->count())->toBe(1);
    expect(IdempotencyKey::count())->toBe(1);
});

test('check-in tanpa header Idempotency-Key ditolak 422', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik))
        ->assertStatus(422)
        ->assertJsonValidationErrors('Idempotency-Key');
});

test('check-in dengan key bukan uuid ditolak 422', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders('bukan-uuid'))
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik))
        ->assertStatus(422)
        ->assertJsonValidationErrors('Idempotency-Key');
});

test('check-in: key BERBEDA di hari yang sama tetap 422 asli (bukan retry)', function () {
    $first = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik))
        ->assertStatus(201);

    $conflict = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    $conflict->assertStatus(422)
        ->assertJsonPath('message', 'Anda sudah check-in hari ini.');

    expect(Presensi::count())->toBe(1);
    expect(IdempotencyKey::count())->toBe(1);
});

// ─── Check-out ───────────────────────────────────────────────────────────────

test('check-out: retry Idempotency-Key sama tidak menimpa data kedua kali', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    $key = (string) Str::uuid();
    $checkoutPayload = [
        'latitude' => $this->titik->latitude,
        'longitude' => $this->titik->longitude,
        'photo' => UploadedFile::fake()->image('checkout.jpg'),
    ];

    $first = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/presensi/check-out', $checkoutPayload)
        ->assertOk();

    $second = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/presensi/check-out', $checkoutPayload);

    $second->assertOk()
        ->assertHeader('X-Idempotent-Replay', 'true');

    expect(jsonSame($second->getContent(), $first->getContent()))->toBeTrue();

    // Foto check-out hanya tersimpan sekali → controller tidak dieksekusi ulang.
    expect(count(Storage::disk('public')->files('presensi/check-out')))->toBe(1);
});

// ─── Formulir ────────────────────────────────────────────────────────────────

test('formulir store: retry Idempotency-Key sama membalas 201 tanpa insert dobel', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    $key = (string) Str::uuid();
    $payload = ['aktivitas_dilakukan' => 'Pengecoran jalan raya'];

    $first = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/formulir/store', $payload)
        ->assertStatus(201);

    $second = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/formulir/store', $payload);

    $second->assertStatus(201)
        ->assertHeader('X-Idempotent-Replay', 'true')
        ->assertJsonPath('data.id', $first->json('data.id'));

    expect(FormulirLapangan::count())->toBe(1);
});

test('formulir store: key BERBEDA di hari yang sama tetap 422 asli (bukan retry)', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/formulir/store', ['aktivitas_dilakukan' => 'Aktivitas A'])
        ->assertStatus(201);

    $conflict = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/formulir/store', ['aktivitas_dilakukan' => 'Aktivitas B']);

    $conflict->assertStatus(422)
        ->assertJsonPath('message', 'Formulir hari ini sudah diisi.');

    expect(FormulirLapangan::count())->toBe(1);
});

test('formulir store: response error tidak di-cache sehingga retry dengan key sama diproses ulang', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders())
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    $key = (string) Str::uuid();

    // Gagal validasi (tanpa aktivitas) → tidak boleh masuk cache.
    $cachedBefore = IdempotencyKey::count();

    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/formulir/store', ['kondisi_area' => 'Bersih'])
        ->assertStatus(422);

    expect(IdempotencyKey::count())->toBe($cachedBefore);
    expect(IdempotencyKey::where('key', $key)->count())->toBe(0);

    // Client perbaiki payload, retry pakai key yang sama → sukses.
    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/formulir/store', ['aktivitas_dilakukan' => 'Pengecoran jalan raya'])
        ->assertStatus(201);

    expect(IdempotencyKey::where('key', $key)->count())->toBe(1);
});

// ─── Isolasi & TTL ───────────────────────────────────────────────────────────

test('key milik user lain tidak dipakai untuk replay', function () {
    [$otherUser, $otherToken] = createMobileUserWithToken('SDM Lapangan Kondisional');
    Karyawan::factory()->create(['user_id' => $otherUser->id]);

    $key = (string) Str::uuid();

    $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik))
        ->assertStatus(201);

    // Guard sanctum ter-cache antar request di dalam satu test;
    // reset agar token user kedua di-resolve ulang.
    $this->app->make('auth')->forgetGuards();

    $otherResponse = $this->withToken($otherToken)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    // Bukan retry (beda user) → jalur normal: sukses membuat presensinya sendiri.
    $otherResponse->assertStatus(201)
        ->assertHeaderMissing('X-Idempotent-Replay');

    expect(Presensi::count())->toBe(2);
    expect(IdempotencyKey::count())->toBe(2);
});

test('entri lebih tua dari 24 jam tidak direplay', function () {
    $key = (string) Str::uuid();

    IdempotencyKey::create([
        'key' => $key,
        'user_id' => $this->user->id,
        'endpoint' => 'mobile.presensi.check-in',
        'response_status' => 201,
        'response_body' => json_encode(['status' => 'success', 'stale' => true]),
        'created_at' => now()->subHours(25),
    ]);

    $response = $this->withToken($this->token)
        ->withHeaders(mobileIdemHeaders($key))
        ->postJson('/api/mobile/presensi/check-in', checkInPayload($this->titik));

    // Entri kedaluwarsa diabaikan & dibuang → controller berjalan normal.
    $response->assertStatus(201)
        ->assertHeaderMissing('X-Idempotent-Replay')
        ->assertJsonPath('data.status_validasi', 'valid')
        ->assertJsonMissing(['stale' => true]);

    expect(Presensi::count())->toBe(1);
    expect(IdempotencyKey::where('key', $key)->where('created_at', '>=', now()->subHour())->count())->toBe(1);
});

test('command idempotency:prune menghapus entri kedaluwarsa saja', function () {
    $old = IdempotencyKey::create([
        'key' => (string) Str::uuid(),
        'user_id' => $this->user->id,
        'endpoint' => 'mobile.presensi.check-in',
        'response_status' => 201,
        'response_body' => '{}',
        'created_at' => now()->subHours(30),
    ]);

    $fresh = IdempotencyKey::create([
        'key' => (string) Str::uuid(),
        'user_id' => $this->user->id,
        'endpoint' => 'mobile.formulir.store',
        'response_status' => 201,
        'response_body' => '{}',
        'created_at' => now()->subHour(),
    ]);

    Artisan::call('idempotency:prune');

    expect(IdempotencyKey::find($old->id))->toBeNull();
    expect(IdempotencyKey::find($fresh->id))->not->toBeNull();
});
