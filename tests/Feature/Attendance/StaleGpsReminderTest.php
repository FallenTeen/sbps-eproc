<?php

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Notifications\StaleGpsNotification;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

/**
 * Fake PushNotificationService: constructor asli eager membuat Firebase
 * Factory, jadi double ini tidak memanggil parent constructor.
 */
function makeFakePushService(): PushNotificationService
{
    return new class extends PushNotificationService
    {
        public int $calls = 0;

        public array $tokens = [];

        public function __construct()
        {
        }

        public function sendToDevice(string $token, string $title, string $body, array $data = []): bool
        {
            $this->calls++;
            $this->tokens[] = $token;

            return true;
        }
    };
}

function buatUserDenganPresensiAktif(array $userAttributes = [], array $presensiAttributes = []): array
{
    $user = User::factory()->create($userAttributes);
    $karyawan = Karyawan::create(['user_id' => $user->id, 'nama' => $user->name, 'tipe' => 'tetap']);
    $presensi = Presensi::create(array_merge([
        'karyawan_id' => $karyawan->id,
        'check_in' => now()->subHours(2),
    ], $presensiAttributes));

    return [$user, $karyawan, $presensi];
}

test('stale reminder mengirim push dan notifikasi database untuk user stale', function () {
    config(['services.firebase.service_account' => ['credentials' => true]]);
    $fake = makeFakePushService();
    $this->app->instance(PushNotificationService::class, $fake);

    [$user, , $presensi] = buatUserDenganPresensiAktif(
        ['device_token' => 'fcm-token-stale'],
        ['check_in' => now()->subHours(3)]
    );
    $user->update(['last_tracking_at' => now()->subHours(2)]);

    $this->artisan('tracking:stale-reminder')
        ->assertSuccessful()
        ->expectsOutputToContain('1 pengingat terkirim');

    expect($fake->calls)->toBe(1);
    expect($fake->tokens)->toBe(['fcm-token-stale']);

    $notif = $user->notifications()->where('type', StaleGpsNotification::class)->first();
    expect($notif)->not->toBeNull();
    expect($notif->data['category'])->toBe('presensi');
    expect($notif->data['route'])->toBe('/presensi');
    expect($notif->data['type'])->toBe('stale_gps');
    expect($notif->data['title'])->toBe('Pemantauan lokasi berhenti');
});

test('stale reminder tidak mengirim ulang dalam jendela throttle 3 jam', function () {
    config(['services.firebase.service_account' => ['credentials' => true]]);
    $fake = makeFakePushService();
    $this->app->instance(PushNotificationService::class, $fake);

    [$user] = buatUserDenganPresensiAktif(
        ['device_token' => 'fcm-token-stale'],
        ['check_in' => now()->subHours(3)]
    );
    $user->update(['last_tracking_at' => now()->subHours(2)]);

    $this->artisan('tracking:stale-reminder')->assertSuccessful();
    $this->artisan('tracking:stale-reminder')
        ->assertSuccessful()
        ->expectsOutputToContain('0 pengingat terkirim, 1 dilewati');

    expect($fake->calls)->toBe(1);
    expect($user->notifications()->count())->toBe(1);
});

test('stale reminder melewati user tanpa device_token', function () {
    config(['services.firebase.service_account' => ['credentials' => true]]);
    $fake = makeFakePushService();
    $this->app->instance(PushNotificationService::class, $fake);

    [$user] = buatUserDenganPresensiAktif(
        ['device_token' => null],
        ['check_in' => now()->subHours(3)]
    );
    $user->update(['last_tracking_at' => now()->subHours(2)]);

    $this->artisan('tracking:stale-reminder')
        ->assertSuccessful()
        ->expectsOutputToContain('Tidak ada user dengan pemantauan lokasi stale');

    expect($fake->calls)->toBe(0);
    expect($user->notifications()->count())->toBe(0);
});

test('stale reminder melewati lokasi segar tapi mengingatkan null last_tracking_at dengan presensi lama', function () {
    config(['services.firebase.service_account' => ['credentials' => true]]);
    $fake = makeFakePushService();
    $this->app->instance(PushNotificationService::class, $fake);

    [$userSegar] = buatUserDenganPresensiAktif(['device_token' => 'fcm-token-segar']);
    $userSegar->update(['last_tracking_at' => now()->subMinutes(5)]);

    [$userTanpaTracking] = buatUserDenganPresensiAktif(['device_token' => 'fcm-token-null']);

    $this->artisan('tracking:stale-reminder')
        ->assertSuccessful()
        ->expectsOutputToContain('1 pengingat terkirim, 0 dilewati');

    expect($fake->calls)->toBe(1);
    expect($fake->tokens)->toBe(['fcm-token-null']);
    expect($userSegar->notifications()->count())->toBe(0);
    expect($userTanpaTracking->notifications()->count())->toBe(1);
});

test('stale reminder melewati presensi yang sudah check-out', function () {
    config(['services.firebase.service_account' => ['credentials' => true]]);
    $fake = makeFakePushService();
    $this->app->instance(PushNotificationService::class, $fake);

    [$user] = buatUserDenganPresensiAktif(
        ['device_token' => 'fcm-token-selesai'],
        ['check_in' => now()->subHours(3), 'check_out' => now()->subHours(1)]
    );
    $user->update(['last_tracking_at' => now()->subHours(2)]);

    $this->artisan('tracking:stale-reminder')
        ->assertSuccessful()
        ->expectsOutputToContain('Tidak ada user dengan pemantauan lokasi stale');

    expect($fake->calls)->toBe(0);
});

test('stale reminder sukses tanpa kirim apa pun saat kredensial Firebase kosong', function () {
    config(['services.firebase.service_account' => null]);
    $fake = makeFakePushService();
    $this->app->instance(PushNotificationService::class, $fake);

    [$user] = buatUserDenganPresensiAktif(
        ['device_token' => 'fcm-token-stale'],
        ['check_in' => now()->subHours(3)]
    );
    $user->update(['last_tracking_at' => now()->subHours(2)]);

    $this->artisan('tracking:stale-reminder')->assertSuccessful();

    expect($fake->calls)->toBe(0);
    expect($user->notifications()->count())->toBe(0);
});
