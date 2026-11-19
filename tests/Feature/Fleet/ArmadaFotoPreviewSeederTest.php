<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

uses(TestCase::class, RefreshDatabase::class);

function armadaPreviewPng(): string
{
    $image = imagecreatetruecolor(8, 8);
    imagefill($image, 0, 0, imagecolorallocate($image, 220, 38, 38));

    ob_start();
    imagepng($image);
    $png = ob_get_clean();
    imagedestroy($image);

    return $png;
}

beforeEach(function () {
    Storage::fake('public');
    $this->unit = UnitBisnis::factory()->gcs()->create();
});

test('seeder menambahkan satu foto preview ke enam armada', function () {
    Http::fake([
        '*' => Http::response(armadaPreviewPng(), 200, ['Content-Type' => 'image/png']),
    ]);

    Armada::factory()->count(6)->sequence(fn ($sequence) => [
        'unit_bisnis_id' => $this->unit->id,
        'kode_unit' => 'UNIT-'.str_pad((string) ($sequence->index + 1), 2, '0', STR_PAD_LEFT),
        'plat_nomor' => 'B '.str_pad((string) ($sequence->index + 1), 4, '0', STR_PAD_LEFT).' XX',
    ])->create();
    $this->seed(\Database\Seeders\ArmadaFotoPreviewSeeder::class);

    expect(Armada::query()->whereHas('media')->count())->toBe(6);
});

test('seeder tidak menimpa atau menduplikasi foto existing', function () {
    Http::fake([
        '*' => Http::response(armadaPreviewPng(), 200, ['Content-Type' => 'image/png']),
    ]);

    $png = armadaPreviewPng();
    $armada = Armada::factory()->create([
        'unit_bisnis_id' => $this->unit->id,
        'kode_unit' => 'AAA-01',
        'plat_nomor' => 'B 0001 XX',
    ]);
    $armada->addMediaFromString($png)
        ->usingFileName('user.png')
        ->toMediaCollection('foto_unit');

    Armada::factory()->count(5)->sequence(fn ($sequence) => [
        'unit_bisnis_id' => $this->unit->id,
        'kode_unit' => 'BBB-0'.($sequence->index + 1),
        'plat_nomor' => 'B '.str_pad((string) ($sequence->index + 2), 4, '0', STR_PAD_LEFT).' XX',
    ])->create();

    $this->seed(\Database\Seeders\ArmadaFotoPreviewSeeder::class);
    $this->seed(\Database\Seeders\ArmadaFotoPreviewSeeder::class);

    expect($armada->refresh()->getMedia('foto_unit'))->toHaveCount(1)
        ->and($armada->getFirstMedia('foto_unit')->file_name)->toBe('user.png')
        ->and(Armada::query()->whereHas('media')->count())->toBe(6);
});

test('seeder tetap selesai saat satu unduhan gagal', function () {
    Http::fake([
        '*' => Http::response('', 500),
    ]);

    Armada::factory()->count(6)->sequence(fn ($sequence) => [
        'unit_bisnis_id' => $this->unit->id,
        'kode_unit' => 'UNIT-'.str_pad((string) ($sequence->index + 1), 2, '0', STR_PAD_LEFT),
        'plat_nomor' => 'B '.str_pad((string) ($sequence->index + 1), 4, '0', STR_PAD_LEFT).' XX',
    ])->create();

    expect(fn () => $this->seed(\Database\Seeders\ArmadaFotoPreviewSeeder::class))
        ->not->toThrow(Throwable::class);

    expect(Armada::query()->whereHas('media')->count())->toBe(0);
});
